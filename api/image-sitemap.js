import { createClient } from "@supabase/supabase-js";

// =======================================================================
// IMAGE SITEMAP
// Automatically generated from travel_bucket_list.album_photos
// =======================================================================

function generateSlug(name) {
    if (!name) return "";

    return String(name)
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[–—]/g, "-")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function stripInvalidXmlCharacters(value) {
    return Array.from(String(value ?? ""))
        .filter((character) => {
            const codePoint = character.codePointAt(0);
            return codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d ||
                (codePoint >= 0x20 && codePoint <= 0xd7ff) ||
                (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
                (codePoint >= 0x10000 && codePoint <= 0x10ffff);
        })
        .join("");
}

function escapeXml(value) {
    return stripInvalidXmlCharacters(value)
        .replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            case '"':
                return "&quot;";
            default:
                return c;
        }
    });
}

function formatDateOnly(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toISOString().slice(0, 10);
}

function cleanText(value, fallback = "") {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    return String(value)
        .replace(/\s+/g, " ")
        .replace(/[<>]/g, "")
        .trim();
}

function getImageTitle(placeName, category, index) {
    return cleanText(
        `${placeName} ${category || "landscape"} photo ${index + 1}`,
        `${placeName} landscape photo ${index + 1}`,
    );
}

function getImageCaption(
    placeName,
    locality,
    category,
    index,
) {
    return cleanText(
        `${placeName} in ${locality || "Sri Lanka"}. ` +
            `Field photograph ${index + 1} documenting the surrounding ` +
            `${category || "landscape"}.`,
        `${placeName} field photograph ${index + 1}`,
    );
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).end("Method Not Allowed");
    }

    // ---------------------------------------------------------------------
    // 1. Base URL
    // ---------------------------------------------------------------------

    let baseUrl;
    try {
        const parsedSiteUrl = new URL(
            process.env.NEXT_PUBLIC_SITE_URL ||
            process.env.SITE_URL ||
            "https://www.myjournalview.com",
        );
        if (!["https:", "http:"].includes(parsedSiteUrl.protocol)) throw new Error("Invalid site URL");
        baseUrl = parsedSiteUrl.origin;
    } catch {
        return res.status(500).end("Image sitemap configuration error.");
    }

    // ---------------------------------------------------------------------
    // 2. Supabase credentials
    // ---------------------------------------------------------------------

    const supabaseUrl = process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL;

    const supabaseKey = process.env.SUPABASE_KEY ||
        process.env.VITE_SUPABASE_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8",
        );

        res.setHeader("Cache-Control", "no-store");
        return res.status(503).send("Image sitemap service is temporarily unavailable.");
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        // -------------------------------------------------------------------
        // 3. Fetch all completed places
        // -------------------------------------------------------------------

        let places = [];
        let page = 0;

        const pageSize = 1000;
        let fetchMore = true;

        while (fetchMore) {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            const {
                data,
                error,
            } = await supabase
                .from("travel_bucket_list")
                .select(`
          slug,
          place_name,
          category,
          locality,
          album_photos,
          created_at
        `)
                .in(
                    "status",
                    [
                        "done",
                        "Completed",
                        "Visited",
                    ],
                )
                .order("id", { ascending: true })
                .range(from, to);

            if (error) {
                throw error;
            }

            if (data && data.length > 0) {
                places = places.concat(data);

                if (data.length < pageSize) {
                    fetchMore = false;
                } else {
                    page++;
                }
            } else {
                fetchMore = false;
            }
        }

        // -------------------------------------------------------------------
        // 4. Start Image Sitemap
        // -------------------------------------------------------------------

        let xml = `<?xml version="1.0" encoding="UTF-8"?>

<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

        // -------------------------------------------------------------------
        // 5. Add images
        // -------------------------------------------------------------------

        places.forEach((place) => {
            if (
                !Array.isArray(place.album_photos) ||
                place.album_photos.length === 0
            ) {
                return;
            }

            const placeName = cleanText(
                place.place_name,
                "Sri Lanka Backcountry Location",
            );

            const category = cleanText(
                place.category,
                "natural attraction",
            );

            const locality = cleanText(
                place.locality,
                "Sri Lanka",
            );

            const locationSlug = generateSlug(
                place.slug ||
                    place.place_name,
            );

            if (!locationSlug) {
                return;
            }

            const pageUrl = `${baseUrl}/gallery/${locationSlug}`;

            const lastMod = formatDateOnly(place.created_at);
            const lastModTag = lastMod
                ? `<lastmod>${lastMod}</lastmod>`
                : "";

            // Remove duplicate/empty image URLs
            const images = [
                ...new Set(
                    place.album_photos
                        .filter(Boolean)
                        .map((photo) => {
                            if (typeof photo === "string") return photo.trim();
                            return String(photo?.url || photo?.src || photo?.image_url || "").trim();
                        })
                        .filter(Boolean),
                ),
            ];

            if (images.length === 0) {
                return;
            }

            xml += `

  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    ${lastModTag}`;

            images.forEach((imageUrl, index) => {
                const title = getImageTitle(
                    placeName,
                    category,
                    index,
                );

                const caption = getImageCaption(
                    placeName,
                    locality,
                    category,
                    index,
                );

                xml += `

    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
      <image:caption>${escapeXml(caption)}</image:caption>
    </image:image>`;
            });

            xml += `
  </url>`;
        });

        // -------------------------------------------------------------------
        // 6. Close XML
        // -------------------------------------------------------------------

        xml += `
</urlset>`;

        // -------------------------------------------------------------------
        // 7. Response headers
        // -------------------------------------------------------------------

        res.setHeader(
            "Content-Type",
            "application/xml; charset=utf-8",
        );

        res.setHeader(
            "Cache-Control",
            "s-maxage=7200, stale-while-revalidate=86400",
        );

        return res
            .status(200)
            .send(xml);
    } catch (err) {
        console.error(
            "Image Sitemap Generation Error:",
            err,
        );

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8",
        );

        return res
            .status(500)
            .send("Image sitemap generation failed.");
    }
}
