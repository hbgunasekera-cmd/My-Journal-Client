const DEFAULT_SITE_URL = "https://www.myjournalview.com";
const DEFAULT_SUPABASE_URL = "https://vpslgikpaintiuayajmx.supabase.co";
// Public key fallback for server-rendered crawler metadata; runtime env vars still override it.
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rsbN_QlROV14EEzYjl9dTQ_Jxl-ra44";

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

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cleanText(value, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value).replace(/\s+/g, " ").replace(/[<>]/g, "").trim() || fallback;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function absoluteHttpUrl(value, fallback) {
  try {
    const parsed = new URL(String(value));
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : fallback;
  } catch {
    return fallback;
  }
}

function extractImageUrl(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value.url || value.src || value.image_url || "";
}

function socialImageUrl(value, fallback) {
  const source = extractImageUrl(value);
  const safeUrl = absoluteHttpUrl(source, "");
  if (!safeUrl) return fallback;

  try {
    const parsed = new URL(safeUrl);
    const host = parsed.hostname.toLowerCase();

    // Photos share pages are HTML documents, not usable og:image assets.
    if (host === "photos.google.com" || host === "photos.app.goo.gl") {
      return fallback;
    }

    // Match the direct Google Photos image URL format used by the React app.
    // Remove an old size/query suffix so social crawlers get a large image.
    if (host === "googleusercontent.com" || host.endsWith(".googleusercontent.com")) {
      const imageBase = `${parsed.origin}${parsed.pathname.split("=")[0]}`;
      return `${imageBase}=w1200-rw`;
    }

    return parsed.href;
  } catch {
    return fallback;
  }
}

function firstSocialImage(values, fallback) {
  for (const value of values) {
    const imageUrl = socialImageUrl(value, "");
    if (imageUrl) return imageUrl;
  }
  return fallback;
}

function truncateText(value, maxLength = 155) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  const shortened = text.slice(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${lastSpace > 0 ? shortened.slice(0, lastSpace) : shortened}…`;
}

function buildVideoSlug(video) {
  const title = cleanText(
    video?.title || (video?.id ? `Sri Lanka Backcountry Video ${video.id}` : "Sri Lanka Backcountry Video"),
    "Sri Lanka Backcountry Video",
  );
  const titleSlug = generateSlug(title) || "video";
  const idSlug = generateSlug(video?.id);
  return idSlug ? `${titleSlug}--${idSlug}` : titleSlug;
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

function normalizeBaseUrl(value) {
  const parsed = new URL(value || DEFAULT_SITE_URL);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Site URL must use HTTP or HTTPS.");
  }
  return parsed.origin;
}

async function fetchRows(supabaseUrl, supabaseKey, table, params) {
  const url = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/${table}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    const diagnostic = responseBody.replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error(
      `Supabase ${table} lookup failed (${response.status})${diagnostic ? `: ${diagnostic}` : ""}.`,
    );
  }
  return response.json();
}

function buildVideoSchema(video, videoId, title, description, imageUrl, canonicalUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${canonicalUrl}#video`,
    name: title,
    description,
    thumbnailUrl: [imageUrl],
    url: canonicalUrl,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    publisher: {
      "@type": "Organization",
      name: "My Journal",
      url: DEFAULT_SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SITE_URL}/my-journal-logo.png`,
      },
    },
    isFamilyFriendly: true,
  };

  const dateValue = video.upload_date || video.published_at || video.created_at;
  if (dateValue) {
    const date = new Date(dateValue);
    if (!Number.isNaN(date.getTime())) schema.uploadDate = date.toISOString();
  }
  return schema;
}

function replaceRootElement(html, replacement) {
  const rootOpen = /<div\b(?=[^>]*\bid\s*=\s*["']root["'])[^>]*>/i.exec(html);
  if (!rootOpen) throw new Error("Index document does not have the expected root element.");

  const tokenPattern = /<!--[\s\S]*?-->|<\/?div\b[^>]*>/gi;
  tokenPattern.lastIndex = rootOpen.index + rootOpen[0].length;
  let depth = 1;
  let token;

  while ((token = tokenPattern.exec(html))) {
    if (token[0].startsWith("<!--")) continue;
    if (/^<\/div/i.test(token[0])) {
      depth -= 1;
      if (depth === 0) {
        return `${html.slice(0, rootOpen.index)}${replacement}${html.slice(tokenPattern.lastIndex)}`;
      }
    } else if (!/\/\s*>$/.test(token[0])) {
      depth += 1;
    }
  }

  throw new Error("Index document root element is not properly closed.");
}

export default async function handler(req, res) {
  const method = String(req.method || "GET").toUpperCase();
  if (!["GET", "HEAD"].includes(method)) {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end("Method Not Allowed");
  }

  const query = req.query || {};
  const rawType = Array.isArray(query.type) ? query.type[0] : query.type;
  const rawSlugValue = Array.isArray(query.slug) ? query.slug[0] : query.slug;
  const routeType = String(rawType || "place").toLowerCase();
  const rawSlug = typeof rawSlugValue === "string" ? rawSlugValue : "";
  const videoGallery = routeType === "video-gallery";
  const videoRoute = routeType === "videos" || routeType === "video";
  const placeRoute = routeType === "place" || routeType === "gallery";

  if ((!videoGallery && !rawSlug) || (!videoGallery && !videoRoute && !placeRoute)) {
    return res.status(404).end("Not Found");
  }

  let baseUrl;
  try {
    baseUrl = normalizeBaseUrl(
      process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL,
    );
  } catch {
    return res.status(500).end("Site metadata configuration error.");
  }

  const pathType = videoRoute || videoGallery ? "videos" : routeType;
  const decodedSlug = safeDecode(rawSlug);
  const cleanSlug = videoRoute
    ? decodedSlug.toLowerCase()
    : generateSlug(decodedSlug);
  const canonicalUrl = videoGallery
    ? `${baseUrl}/videos`
    : `${baseUrl}/${pathType}/${encodeURIComponent(cleanSlug)}`;

  if (
    (rawSlug && rawSlug !== cleanSlug) ||
    (rawType && !videoGallery && String(rawType) !== pathType)
  ) {
    res.setHeader("Location", canonicalUrl);
    res.setHeader("Cache-Control", "s-maxage=31536000, immutable");
    return res.status(301).end();
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("OG metadata Supabase configuration is missing.", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).end("Metadata service is unavailable: Supabase configuration is missing.");
  }

  const defaultImage = `${baseUrl}/my-journal-logo.png`;
  let title = "My Journal | Nature & Adventure Travel";
  let description = "Discover hidden waterfalls, scenic hikes, and immersive travel stories across Sri Lanka.";
  let imageUrl = defaultImage;
  let isNotFound = false;
  let videoId = null;
  let videoSchema = null;
  let galleryImages = [];

  try {
    if (videoGallery) {
      title = "Aerial & Video Journal | My Journal";
      description = "Watch aerial drone perspectives, backcountry video journals, terrain footage, trails, waterfalls and natural landscapes across Sri Lanka.";
    } else if (videoRoute) {
      const select = "id,url,title,description,custom_thumbnail_url,upload_date,published_at,created_at,is_active";
      const idSeparator = cleanSlug.lastIndexOf("--");
      let videos;

      if (idSeparator >= 0) {
        const idSlug = cleanSlug.slice(idSeparator + 2);
        const params = new URLSearchParams({ select, id: `eq.${idSlug}`, is_active: "eq.true", limit: "1" });
        videos = await fetchRows(supabaseUrl, supabaseKey, "hub_videos", params);
      } else {
        // Accept old title-only links while the ID-based links become established.
        const params = new URLSearchParams({ select, is_active: "eq.true", limit: "1000" });
        videos = await fetchRows(supabaseUrl, supabaseKey, "hub_videos", params);
      }

      const video = videos.find((item) =>
        buildVideoSlug(item) === cleanSlug || generateSlug(item.title) === cleanSlug,
      );
      videoId = video ? getYouTubeId(video.url) : null;

      if (!video || !videoId) {
        isNotFound = true;
      } else {
        const videoTitle = cleanText(
          video.title || `Sri Lanka Backcountry Video ${video.id}`,
          "Sri Lanka Backcountry Video",
        );
        title = `${videoTitle} | My Journal`;
        description = truncateText(
          video.description || `Watch ${videoTitle} from My Journal's Sri Lanka backcountry video archive.`,
        );
        imageUrl = socialImageUrl(
          video.custom_thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        );
        videoSchema = buildVideoSchema(video, videoId, videoTitle, description, imageUrl, canonicalUrl);
      }
    } else {
      const params = new URLSearchParams({
        select: "place_name,slug,cover_photo_url,ai_article,album_photos",
        status: "in.(done,Completed,Visited)",
        slug: `ilike.${cleanSlug}`,
        limit: "1",
      });
      let places = await fetchRows(supabaseUrl, supabaseKey, "travel_bucket_list", params);

      if (!places.length) {
        const decodedName = decodedSlug.replace(/-/g, " ").replace(/[\\%_]/g, "\\$&");
        const fallbackParams = new URLSearchParams({
          select: "place_name,slug,cover_photo_url,ai_article,album_photos",
          status: "in.(done,Completed,Visited)",
          place_name: `ilike.${decodedName}`,
          limit: "1",
        });
        places = await fetchRows(supabaseUrl, supabaseKey, "travel_bucket_list", fallbackParams);
      }

      const place = places[0];
      if (!place) {
        isNotFound = true;
      } else {
        const placeName = cleanText(place.place_name, "Sri Lanka Backcountry Location");
        const gallery = routeType === "gallery";
        title = gallery ? `${placeName} Gallery | My Journal` : `${placeName} | My Journal`;
        const article = place.ai_article && typeof place.ai_article === "object" ? place.ai_article : {};
        const story = typeof place.ai_article === "string" ? place.ai_article : article.story;
        description = truncateText(story || `Explore ${placeName} in Sri Lanka.`, 120);
        imageUrl = firstSocialImage(
          [
            place.cover_photo_url,
            ...(Array.isArray(place.album_photos) ? place.album_photos : []),
          ],
          defaultImage,
        );
        galleryImages = Array.isArray(place.album_photos)
          ? place.album_photos
            .map((photo) => socialImageUrl(photo, ""))
            .filter(Boolean)
            .slice(0, 8)
          : [];
      }
    }
  } catch (error) {
    console.error("API metadata lookup failed:", error);
    res.setHeader("Cache-Control", "no-store");
    const message = String(error?.message || "Supabase metadata lookup failed")
      .replace(/[\r\n<>]/g, " ")
      .slice(0, 350);
    return res.status(503).end(`Metadata lookup failed: ${message}`);
  }

  if (isNotFound) {
    title = "404 - Page Not Found | My Journal";
    description = "The requested location, gallery, or video could not be found on My Journal.";
  }

  try {
    const indexResponse = await fetch(`${baseUrl}/index.html`);
    if (!indexResponse.ok) throw new Error(`Index document fetch failed (${indexResponse.status}).`);
    let html = await indexResponse.text();

    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeImageUrl = escapeHtml(imageUrl);
    const safeCanonicalUrl = escapeHtml(canonicalUrl);
    const robotsTag = isNotFound
      ? '<meta name="robots" content="noindex, follow" />'
      : '<meta name="robots" content="index, follow, max-image-preview:large" />';
    const openGraphType = videoId ? "video.other" : placeRoute ? "article" : "website";
    const videoTags = videoId
      ? `<meta property="og:video" content="https://www.youtube-nocookie.com/embed/${escapeHtml(videoId)}" />
         <meta property="og:video:secure_url" content="https://www.youtube-nocookie.com/embed/${escapeHtml(videoId)}" />
         <meta property="og:video:type" content="text/html" />`
      : "";
    const metadata = `
      <title>${safeTitle}</title>
      <meta name="description" content="${safeDescription}" />
      ${robotsTag}
      <link rel="canonical" href="${safeCanonicalUrl}" />
      <meta property="og:type" content="${openGraphType}" />
      <meta property="og:site_name" content="My Journal" />
      <meta property="og:url" content="${safeCanonicalUrl}" />
      <meta property="og:title" content="${safeTitle}" />
      <meta property="og:description" content="${safeDescription}" />
      <meta property="og:image" content="${safeImageUrl}" />
      <meta property="og:image:secure_url" content="${safeImageUrl}" />
      <meta property="og:image:alt" content="${safeTitle}" />
      ${videoTags}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="${safeCanonicalUrl}" />
      <meta name="twitter:title" content="${safeTitle}" />
      <meta name="twitter:description" content="${safeDescription}" />
      <meta name="twitter:image" content="${safeImageUrl}" />
      <meta name="twitter:image:alt" content="${safeTitle}" />`;

    const schemaTag = videoSchema
      ? `<script type="application/ld+json">${JSON.stringify(videoSchema).replace(/</g, "\\u003c")}</script>`
      : "";

    html = html
      .replace(/<title>[\s\S]*?<\/title>/i, "")
      .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, "")
      .replace(/<meta\s+name=["']robots["'][\s\S]*?>/gi, "")
      .replace(/<meta\s+property=["']og:[\s\S]*?>/gi, "")
      .replace(/<meta\s+name=["']twitter:[\s\S]*?>/gi, "")
      .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, "");

    if (!/<\/head>/i.test(html) || !/<div\b(?=[^>]*\bid\s*=["']root["'])[^>]*>/i.test(html)) {
      throw new Error("Index document does not have the expected HTML shell.");
    }
    html = html.replace(/<\/head>/i, `${metadata}${schemaTag}\n</head>`);

    let mediaContent = "";
    if (videoId) {
      mediaContent = `<iframe src="https://www.youtube-nocookie.com/embed/${escapeHtml(videoId)}" title="${safeTitle}" style="display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:16px" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } else {
      const heroImage = imageUrl !== defaultImage
        ? `<img src="${safeImageUrl}" alt="${safeTitle}" style="display:block;width:100%;height:auto;max-height:72vh;object-fit:contain;border-radius:16px" fetchpriority="high" />`
        : "";
      const additionalImages = galleryImages
        .filter((url) => url !== imageUrl)
        .slice(0, 7)
        .map((url) => `<img src="${escapeHtml(url)}" alt="${safeTitle}" style="display:block;width:100%;height:auto;max-height:440px;object-fit:cover;border-radius:12px" loading="lazy" />`)
        .join("");
      mediaContent = `${heroImage}${additionalImages ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:20px">${additionalImages}</div>` : ""}`;
    }

    const crawlerBody = `<div id="root"><main style="max-width:1100px;margin:0 auto;padding:28px 20px;font-family:system-ui,-apple-system,sans-serif;color:#334155;line-height:1.5"><article>${mediaContent}<h1 style="margin:20px 0 8px;font-size:clamp(24px,4vw,34px);line-height:1.2">${safeTitle}</h1><p style="max-width:760px;margin:0 auto;font-size:13px;line-height:1.5;color:#64748b">${safeDescription}</p></article></main></div>`;
    html = replaceRootElement(html, crawlerBody);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", isNotFound
      ? "s-maxage=300, stale-while-revalidate=600"
      : "s-maxage=3600, stale-while-revalidate=86400");
    const status = isNotFound ? 404 : 200;
    return method === "HEAD" ? res.status(status).end() : res.status(status).send(html);
  } catch (error) {
    console.error("HTML metadata response failed:", error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).end("Unable to render page metadata.");
  }
}
