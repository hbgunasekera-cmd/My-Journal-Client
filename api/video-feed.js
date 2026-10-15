import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "../server/supabase-config.js";

const DEFAULT_SITE_URL = "https://www.myjournalview.com";
const BASE_VIDEO_COLUMNS = "id,url,title,custom_thumbnail_url,created_at,is_active";

function getSiteOrigin() {
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const parsed = new URL(siteUrl);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Site URL must use HTTP or HTTPS.");
  }
  return parsed.origin;
}

function generateSlug(value) {
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

function cleanText(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).replace(/[<>]/g, "").replace(/\s+/g, " ").trim() || fallback;
}

function truncateText(value, maxLength) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");
  return lastSpace > 0 ? shortened.slice(0, lastSpace) : shortened;
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

function getYouTubeId(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;

  let parsed;
  try {
    parsed = new URL(text.includes("://") ? text : `https://${text}`);
  } catch {
    return null;
  }

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
  const title = cleanText(
    video?.title || (video?.id ? `Sri Lanka Backcountry Video ${video.id}` : "Sri Lanka Backcountry Video"),
    "Sri Lanka Backcountry Video",
  );
  const titleSlug = generateSlug(title) || "video";
  const idSlug = generateSlug(video?.id);
  return idSlug ? `${titleSlug}-${idSlug}` : titleSlug;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function fetchVideos(supabase) {
  const { data, error } = await supabase
    .from("hub_videos")
    .select(BASE_VIDEO_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(20);

  if (error) throw error;
  return data || [];
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
    return res.status(500).end("Video feed configuration error.");
  }

  const { supabaseUrl, supabaseKey } = getSupabaseServerConfig();
  if (!supabaseUrl || !supabaseKey) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).end("Video feed service is temporarily unavailable.");
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const videos = await fetchVideos(supabase);
    const rssItems = videos.map((video) => {
      const youtubeId = getYouTubeId(video.url);
      const title = cleanText(video.title || `Sri Lanka Backcountry Video ${video.id}`, "Sri Lanka Backcountry Video");
      const slug = buildVideoSlug(video);
      if (!slug) return "";

      const pageUrl = `${siteOrigin}/videos/${encodeURIComponent(slug)}`;
      const mediaTitle = truncateText(title, 100);
      const thumbnailUrl = absoluteHttpUrl(video.custom_thumbnail_url) ||
        (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : "");
      const description = truncateText(
        `Watch ${title} in the My Journal video gallery, featuring travel films and landscapes from Sri Lanka.`,
        2048,
      );
      const publicationDate = parseDate(video.created_at);
      const pubDate = publicationDate
        ? `<pubDate>${escapeXml(publicationDate.toUTCString())}</pubDate>`
        : "";
      const mediaPlayer = youtubeId
        ? `<media:player url="https://www.youtube-nocookie.com/embed/${escapeXml(youtubeId)}" />`
        : "";
      const mediaContent = mediaPlayer
        ? `<media:content medium="video">${mediaPlayer}<media:title>${escapeXml(mediaTitle)}</media:title><media:description>${escapeXml(description)}</media:description>${thumbnailUrl ? `<media:thumbnail url="${escapeXml(thumbnailUrl)}" />` : ""}</media:content>`
        : "";
      const htmlDescription = [
        thumbnailUrl
          ? `<p><img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(title)}" style="max-width:100%;height:auto" /></p>`
          : "",
        `<p>${escapeHtml(description)}</p>`,
        `<p><a href="${escapeHtml(pageUrl)}">Watch this video on My Journal</a></p>`,
        "<p><small>© My Journal | Sri Lanka</small></p>",
      ].filter(Boolean).join("\n");

      return `<item>
        <title>${escapeXml(title)}</title>
        <link>${escapeXml(pageUrl)}</link>
        <description>${cdata(htmlDescription)}</description>
        ${pubDate}
        <guid isPermaLink="true">${escapeXml(pageUrl)}</guid>
        ${mediaContent}
        <content:encoded>${cdata(htmlDescription)}</content:encoded>
      </item>`;
    }).filter(Boolean).join("\n");

    const selfUrl = `${siteOrigin}/video-feed.xml`;
    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My Journal | Video Gallery</title>
    <link>${escapeXml(`${siteOrigin}/videos`)}</link>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <description>New travel videos and landscape films from My Journal's Sri Lanka video gallery.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <copyright>My Journal | Sri Lanka</copyright>
    ${rssItems}
  </channel>
</rss>`;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    return req.method === "HEAD"
      ? res.status(200).end()
      : res.status(200).send(rssFeed);
  } catch (error) {
    console.error("Video RSS feed generation failed:", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).end("Video feed generation failed.");
  }
}
