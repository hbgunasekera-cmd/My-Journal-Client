function escapeXml(value) {
  return String(value ?? "").replace(/[<>&'"]/g, (character) => {
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
    return res.status(500).end("Sitemap configuration error.");
  }

  const sitemapUrls = [
    `${baseUrl}/article-sitemap.xml`,
    `${baseUrl}/page-sitemap.xml`,
    `${baseUrl}/image-sitemap.xml`,
    `${baseUrl}/video-sitemap.xml`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join("\n")}
</sitemapindex>`;

  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=7200, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}
