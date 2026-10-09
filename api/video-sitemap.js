import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "../server/supabase-config.js";

function generateSlug(name) {
    if (!name) return "";
    return String(name).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[–—]/g, "-").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function stripInvalidXmlCharacters(value) {
    return Array.from(String(value ?? "")).filter((character) => {
        const codePoint = character.codePointAt(0);
        return codePoint === 0x09 || codePoint === 0x0a || codePoint === 0x0d || (codePoint >= 0x20 && codePoint <= 0xd7ff) || (codePoint >= 0xe000 && codePoint <= 0xfffd) || (codePoint >= 0x10000 && codePoint <= 0x10ffff);
    }).join("");
}

function escapeXml(value) {
    return stripInvalidXmlCharacters(value).replace(/[<>&'"]/g, (c) => {
        switch (c) { case "<": return "&lt;"; case ">": return "&gt;"; case "&": return "&amp;"; case "'": return "&apos;"; case '"': return "&quot;"; default: return c; }
    });
}

function cleanText(value, fallback = "") {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value).replace(/\s+/g, " ").replace(/[<>]/g, "").trim();
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isMissingColumnError(error) {
    return error?.code === "42703" || error?.code === "PGRST204";
}

function getHttpUrl(value, fallback) {
    try {
        const url = new URL(String(value));
        return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
    } catch { return fallback; }
}

function getYouTubeId(url) {
    if (!url) return null;
    const value = String(url).trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    let parsed;
    try { parsed = new URL(value.includes("://") ? value : `https://${value}`); } catch { return null; }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let candidate = "";
    if (host === "youtu.be") {
        candidate = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
        candidate = parsed.searchParams.get("v") || "";
        if (!candidate) {
            const [kind, id] = parsed.pathname.split("/").filter(Boolean);
            if (["embed", "shorts", "live", "v"].includes(kind?.toLowerCase())) candidate = id || "";
        }
    }
    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

function buildVideoSlug(video) {
    const rawTitle = cleanText(video?.title || video?.name || `Sri Lanka Backcountry Video ${video?.id || ""}`, `Sri Lanka Backcountry Video`);
    const baseSlug = generateSlug(rawTitle) || "video";
    const idSlug = generateSlug(video?.id);
    return idSlug ? `${baseSlug}--${idSlug}` : baseSlug;
}

export default async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).end("Method Not Allowed");
    }

    let baseUrl;
    try {
        const parsedSiteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.myjournalview.com");
        if (!["https:", "http:"].includes(parsedSiteUrl.protocol)) throw new Error("Invalid site URL");
        baseUrl = parsedSiteUrl.origin;
    } catch {
        return res.status(500).end("Video sitemap configuration error.");
    }

    const { supabaseUrl, supabaseKey } = getSupabaseServerConfig();

    if (!supabaseUrl || !supabaseKey) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        return res.status(503).send("Video sitemap service is temporarily unavailable.");
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        let videoColumns = "id,url,title,description,custom_thumbnail_url,upload_date,published_at,created_at,is_active";
        const coreVideoColumns = "id,url,title,custom_thumbnail_url,is_active";
        let pageData = [];

        // Fallback Logic embedded in first request
        let firstPage = await supabase.from("hub_videos").select(videoColumns).eq("is_active", true).order("id", { ascending: true }).range(0, 999);
        let errorToThrow = firstPage.error;

        if (firstPage.error && isMissingColumnError(firstPage.error) && videoColumns !== coreVideoColumns) {
            videoColumns = coreVideoColumns;
            const retryFirst = await supabase.from("hub_videos").select(videoColumns).eq("is_active", true).order("id", { ascending: true }).range(0, 999);
            pageData.push(...(retryFirst.data || []));
            errorToThrow = retryFirst.error;
        } else {
            pageData.push(...(firstPage.data || []));
        }

        if (errorToThrow) throw errorToThrow;

        if (pageData.length === 1000) {
            const nextPages = await Promise.all([
                supabase.from("hub_videos").select(videoColumns).eq("is_active", true).order("id", { ascending: true }).range(1000, 1999),
                supabase.from("hub_videos").select(videoColumns).eq("is_active", true).order("id", { ascending: true }).range(2000, 2999)
            ]);
            nextPages.forEach(p => { if (p.data) pageData.push(...p.data); });
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n';

        pageData.forEach((video) => {
            if (!video?.url) return;
            const youtubeId = getYouTubeId(video.url);
            if (!youtubeId) return;

            const title = cleanText(video.title || `Sri Lanka Backcountry Video ${video.id}`, "Sri Lanka Backcountry Video");
            const slug = buildVideoSlug(video);
            if (!slug) return;

            const watchPageUrl = `${baseUrl}/videos/${slug}`;
            const defaultThumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            const thumbnail = getHttpUrl(video.custom_thumbnail_url, defaultThumbnail);
            const description = cleanText(video.description || `Watch ${title}. A My Journal visual field recording documenting Sri Lanka's backcountry landscapes, trails, terrain and natural attractions.`, `Watch ${title} from My Journal's Sri Lanka backcountry video archive.`).slice(0, 2048);
            
            const publicationDate = video.upload_date || video.published_at || video.created_at;
            const parsedPublicationDate = parseDate(publicationDate);

            xml += `  <url>\n    <loc>${escapeXml(watchPageUrl)}</loc>\n`;
            xml += `    <video:video><video:thumbnail_loc>${escapeXml(thumbnail)}</video:thumbnail_loc><video:title>${escapeXml(title)}</video:title><video:description>${escapeXml(description)}</video:description><video:player_loc>https://www.youtube.com/embed/${escapeXml(youtubeId)}</video:player_loc>`;
            
            if (parsedPublicationDate) {
                xml += `<video:publication_date>${parsedPublicationDate.toISOString()}</video:publication_date>`;
            }
            xml += `<video:family_friendly>yes</video:family_friendly></video:video>\n  </url>\n`;
        });

        xml += `</urlset>`;

        res.setHeader("Content-Type", "text/xml; charset=utf-8");
        res.setHeader("Cache-Control", "s-maxage=7200, stale-while-revalidate=86400");
        return res.status(200).send(xml);
    } catch (err) {
        console.error("Video Sitemap Generation Error:", err);
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        return res.status(500).send("Video sitemap generation failed.");
    }
}
