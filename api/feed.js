import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://www.myjournalview.com";

function getSiteOrigin() {
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const parsed = new URL(siteUrl);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Site URL must use HTTP or HTTPS.");
  }
  return parsed.origin;
}

function generateCleanSlug(value) {
  if (!value) return "";
  return String(value)
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
  return stripInvalidXmlCharacters(value).replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character]);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
}

function cdata(value) {
  return `<![CDATA[${String(value ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function absoluteHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function extractArticleText(article) {
  if (typeof article === "string") return article;
  if (!article || typeof article !== "object" || Array.isArray(article)) return "";
  const prose = article.story || article.content || "";
  return typeof prose === "string" ? prose : "";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD, OPTIONS");
    return res.status(405).end("Method Not Allowed");
  }

  let siteOrigin;
  try {
    siteOrigin = getSiteOrigin();
  } catch {
    return res.status(500).end("Feed configuration error.");
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).end("Feed service is temporarily unavailable.");
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: places, error } = await supabase
      .from("travel_bucket_list")
      .select("id, slug, place_name, created_at, cover_photo_url, ai_article, status")
      .in("status", ["done", "Completed", "Visited"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const rssItems = (places || []).map((place) => {
      const slug = generateCleanSlug(place.slug || place.place_name);
      if (!slug) return "";

      const rawUrl = `${siteOrigin}/gallery/${encodeURIComponent(slug)}`;
      const safeImageUrl = absoluteHttpUrl(place.cover_photo_url);
      const articleText = extractArticleText(place.ai_article);
      const firstParagraph = articleText.split(/\r?\n(?:\s*\r?\n)?/)[0]?.trim() ||
        "Explore this hidden gem in Sri Lanka.";
      const htmlDescription = [
        safeImageUrl
          ? `<p><img src="${escapeHtml(safeImageUrl)}" alt="${escapeHtml(place.place_name)}" style="max-width:100%;height:auto" /></p>`
          : "",
        `<p>${escapeHtml(firstParagraph)}</p>`,
        `<p>📍Location: <a href="${escapeHtml(rawUrl)}">${escapeHtml(rawUrl)}</a></p>`,
        "<p><small>© My Journal. Original photography available at www.myjournalview.com.</small></p>",
      ].filter(Boolean).join("\n");
      const publicationDate = place.created_at ? new Date(place.created_at) : null;
      const pubDate = publicationDate && !Number.isNaN(publicationDate.getTime())
        ? `<pubDate>${escapeXml(publicationDate.toUTCString())}</pubDate>`
        : "";
      const mediaContent = safeImageUrl
        ? `<media:content url="${escapeXml(safeImageUrl)}" medium="image"><media:credit role="photographer">Hasitha Gunasekera</media:credit><media:copyright>My Journal | Sri Lanka</media:copyright></media:content>`
        : "";

      return `<item>
        <title>${escapeXml(`✍️ New Journal Entry: ${place.place_name || "Untitled location"}`)}</title>
        <link>${escapeXml(rawUrl)}</link>
        <description>${cdata(htmlDescription)}</description>
        ${pubDate}
        <guid isPermaLink="true">${escapeXml(rawUrl)}</guid>
        ${mediaContent}
      </item>`;
    }).filter(Boolean).join("\n");

    const selfUrl = `${siteOrigin}/api/feed`;
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My Journal | Sri Lanka Travel Gallery</title>
    <link>${escapeXml(`${siteOrigin}/`)}</link>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <description>Official cinematic drone and iPhone photography by Hasitha Gunasekera.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    return req.method === "HEAD"
      ? res.status(200).end()
      : res.status(200).send(rssFeed);
  } catch (error) {
    console.error("RSS feed generation failed:", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).end("Feed generation failed.");
  }
}
