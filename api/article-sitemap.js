import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerConfig } from "../server/supabase-config.js";

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
  return stripInvalidXmlCharacters(value).replace(/[<>&'"]/g, (character) => {
    switch (character) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return character;
    }
  });
}

function formatDateOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
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
    if (!["https:", "http:"].includes(parsedSiteUrl.protocol)) {
      throw new Error("Invalid site URL");
    }
    baseUrl = parsedSiteUrl.origin;
  } catch {
    return res.status(500).end("Article sitemap configuration error.");
  }

  const { supabaseUrl, supabaseKey } = getSupabaseServerConfig();
  if (!supabaseUrl || !supabaseKey) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Article sitemap service is temporarily unavailable.");
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const places = [];
    const pageSize = 1000;
    let page = 0;

    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from("travel_bucket_list")
        .select("slug, place_name, created_at")
        .in("status", ["done", "Completed", "Visited"])
        .order("id", { ascending: true })
        .range(from, to);

      if (error) throw error;
      if (!data?.length) break;
      places.push(...data);
      if (data.length < pageSize) break;
      page += 1;
    }

    const slugCounts = new Map();
    for (const place of places) {
      const slug = generateSlug(place.slug || place.place_name);
      if (slug) slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (const place of places) {
      const slug = generateSlug(place.slug || place.place_name);
      if (!slug || slugCounts.get(slug) !== 1) continue;

      const lastMod = formatDateOnly(place.created_at);
      xml += `\n  <url><loc>${escapeXml(`${baseUrl}/place/${slug}`)}</loc>`;
      if (lastMod) xml += `<lastmod>${lastMod}</lastmod>`;
      xml += `<changefreq>monthly</changefreq><priority>0.9</priority></url>`;
    }
    xml += "\n</urlset>";

    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=7200, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (error) {
    console.error("Article Sitemap Generation Error:", error);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(500).send("Article sitemap generation failed.");
  }
}
