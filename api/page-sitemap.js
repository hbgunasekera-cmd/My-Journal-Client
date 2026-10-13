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
    return res.status(500).end("Page sitemap configuration error.");
  }

  const staticPaths = [
    "/",
    "/videos",
    "/route-planner",
    "/suggest-spot",
    "/about",
    "/privacy",
    "/terms",
  ];
  const destinationCategories = [
    "Waterfall", "Mountain", "Trail", "Viewpoint", "Beach", "Park",
    "Plateaus", "Reserved Forest", "Monastery", "Archaeology", "Reservoir",
    "Pool", "Stream", "Location",
  ];
  const urls = [
    ...staticPaths.map((path) => `${baseUrl}${path}`),
    ...destinationCategories.map((category) =>
      `${baseUrl}/?category=${encodeURIComponent(category.toLowerCase())}`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=7200, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}
