import { createClient } from "@supabase/supabase-js";

// Helper to generate standardized, clean, SEO-friendly URL slugs matching App.jsx
function generateSlug(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .trim()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritic mark overlays
    .replace(/[–—]/g, "-") // Convert En-dash & Em-dash to standard hyphens
    .replace(/[^a-z0-9\s-]/g, "") // Keep only alphanumeric characters, spaces, and hyphens
    .replace(/\s+/g, "-") // Replace spaces with single hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // Strip leading and trailing hyphens
}

// Helper to safely escape specific XML characters in slugs to prevent broken sitemaps
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

function escapeXml(unsafe) {
  return stripInvalidXmlCharacters(unsafe)
    .replace(/[<>&'"]/g, function (c) {
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

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
    return res.status(500).end("Sitemap configuration error.");
  }

  // 2. Safely load Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap service is temporarily unavailable.");
  }

  const xmlBaseUrl = escapeXml(baseUrl);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    // 3. Paginated query execution to bypass Supabase PostgREST 1,000-row default response cap
    let places = [];
    let page = 0;
    const pageSize = 1000;
    let fetchMore = true;

    while (fetchMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Select 'slug' column and capture all completed status variants
      const { data, error } = await supabase
        .from("travel_bucket_list")
        .select("slug, place_name, album_photos, created_at")
        .in("status", ["done", "Completed", "Visited"])
        .order("id", { ascending: true })
        .range(from, to);

      if (error) throw error;

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

    // 4. Construct the baseline XML Sitemap structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${xmlBaseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>  
  <url>
    <loc>${xmlBaseUrl}/videos</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${xmlBaseUrl}/route-planner</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${xmlBaseUrl}/suggest-spot</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${xmlBaseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>  
  <url>
    <loc>${xmlBaseUrl}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${xmlBaseUrl}/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;

    // 5. Append dynamic routes based on database records
    if (places.length > 0) {
      places.forEach((place) => {
        // Pass place.slug or place.place_name through generateSlug to guarantee lowercasing & normalization
        const locationSlug = generateSlug(place.slug || place.place_name);

        if (locationSlug) {
          const cleanSlug = escapeXml(locationSlug);

          // Use created_at or fallback to today
          const lastMod = formatDateOnly(place.created_at);
          const lastModTag = lastMod
            ? `\n    <lastmod>${lastMod}</lastmod>`
            : "";

          // Place Route
          xml += `
  <url>
    <loc>${xmlBaseUrl}/place/${cleanSlug}</loc>
    ${lastModTag}
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;

          // Gallery Route
          if (Array.isArray(place.album_photos) && place.album_photos.length > 0) {
            xml += `
  <url>
    <loc>${xmlBaseUrl}/gallery/${cleanSlug}</loc>
    ${lastModTag}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
          }
        }
      });
    }

    // Close the XML tag
    xml += `\n</urlset>`;

    // 6. Return standard XML response with cache control
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "s-maxage=7200, stale-while-revalidate=86400",
    );
    return res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap Generation Error:", err);
    res.setHeader("Content-Type", "text/plain");
    return res.status(500).send("Sitemap generation failed.");
  }
}
