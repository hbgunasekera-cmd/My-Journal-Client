import { getSupabaseServerConfig } from "../server/supabase-config.js";
import {
  buildConciseLocationSchemaDescription,
  buildConciseVideoSchemaDescription,
  buildLocationMetaDescription,
} from "../src/utils/schemaDescriptions.js";
import {
  buildLocationPageTitle,
  getLocationHeroImageSource,
} from "../src/utils/locationSeo.js";
import {
  findRelatedTouristAttraction,
  normalizeVideoDurationValue,
  normalizeVideoUploadDate,
} from "../src/utils/videoStructuredData.js";
const DEFAULT_SITE_URL = "https://www.myjournalview.com";
const CRAWLER_USER_AGENT = /bot|crawler|spider|bing|msnbot|twitterbot|facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher|meta-webindexer|whatsapp|telegram|pinterest|linkedin|slack|discord|instagram|tiktok|xbot|yandex|baidu|duckduck|applebot|google-inspectiontool|googleother|gptbot|chatgpt-user|perplexity|claudebot|claude-user|microsoftpreview|cohere|bytespider|mediapartners-google/i;

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

function parseArticle(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return { story: parsed };
  } catch {
    // Older rows may store the article as plain prose rather than JSON.
  }
  return { story: value };
}

function humanizeFieldName(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderArticleContent(value) {
  const budget = { remaining: 40000 };
  const ignoredKeys = new Set([
    "isFullContent",
    "metrics",
    "language",
    "source_language",
    "translation",
    "translations",
    "model",
    "generated_at",
  ]);

  const renderValue = (current, depth = 0) => {
    if (current === null || current === undefined || depth > 6 || budget.remaining <= 0) {
      return "";
    }

    if (typeof current === "string") {
      const text = current.replace(/\r\n?/g, "\n").trim();
      if (!text) return "";
      const visibleText = text.slice(0, budget.remaining);
      budget.remaining -= visibleText.length;
      return visibleText
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
        .join("");
    }

    if (typeof current === "number" && Number.isFinite(current)) {
      const text = String(current);
      budget.remaining -= text.length;
      return `<p>${escapeHtml(text)}</p>`;
    }

    if (Array.isArray(current)) {
      const items = current
        .map((item) => renderValue(item, depth + 1))
        .filter(Boolean);
      return items.length ? `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : "";
    }

    if (typeof current === "object") {
      return Object.entries(current)
        .filter(([key, item]) => !ignoredKeys.has(key) && item !== null && item !== undefined && item !== "")
        .map(([key, item]) => {
          const content = renderValue(item, depth + 1);
          if (!content) return "";
          const headingTag = depth === 0 ? "h2" : "h3";
          return `<section><${headingTag}>${escapeHtml(humanizeFieldName(key))}</${headingTag}>${content}</section>`;
        })
        .join("");
    }

    return "";
  };

  return renderValue(value);
}

function buildPlaceSchema(placeName, title, description, imageUrl, canonicalUrl, isGallery, galleryImages = []) {
  if (isGallery) {
    const images = [
      ...(imageUrl && !imageUrl.endsWith("/my-journal-logo.png")
        ? [{ url: imageUrl, alt: title, caption: "" }]
        : []),
      ...galleryImages.filter((image) => image.url !== imageUrl),
    ];
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${canonicalUrl}#gallery`,
      url: canonicalUrl,
      name: title,
      description,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: images.slice(0, 50).map((image, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "ImageObject",
            contentUrl: image.url,
            name: image.alt,
            ...(image.caption ? { caption: image.caption } : {}),
          },
        })),
      },
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${canonicalUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    headline: title,
    description,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    about: { "@type": "Place", name: placeName },
    author: { "@type": "Organization", name: "My Journal", url: DEFAULT_SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "My Journal",
      url: DEFAULT_SITE_URL,
      logo: { "@type": "ImageObject", url: `${DEFAULT_SITE_URL}/my-journal-logo.png` },
    },
    inLanguage: "en",
  };
}

function buildVideoGallerySchema(items, title, description, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#videos`,
    url: canonicalUrl,
    name: title,
    description,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.slice(0, 50).map((video, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: video.pageUrl,
        item: {
          ...video.schema,
        },
      })),
    },
  };
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
  const relativeFallback = String(source).startsWith("/")
    ? new URL(source, DEFAULT_SITE_URL).href
    : "";
  const safeUrl = absoluteHttpUrl(source, relativeFallback);
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
  return idSlug ? `${titleSlug}-${idSlug}` : titleSlug;
}

function buildLegacyVideoSlug(video) {
  return buildVideoSlug(video).replace(
    /-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
    "--$1",
  );
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

async function fetchHubVideos(supabaseUrl, supabaseKey, params) {
  const baseColumns = "id,url,title,custom_thumbnail_url,created_at,is_active";
  const query = new URLSearchParams(params.toString());
  query.set("select", baseColumns);
  return fetchRows(supabaseUrl, supabaseKey, "hub_videos", query);
}

async function fetchPublishedAttractions(supabaseUrl, supabaseKey) {
  const params = new URLSearchParams({
    select: "slug,place_name,locality",
    status: "in.(done,Completed,Visited)",
    limit: "2000",
  });

  try {
    return await fetchRows(supabaseUrl, supabaseKey, "travel_bucket_list", params);
  } catch (error) {
    // Video metadata must still render if destination lookup is unavailable.
    console.warn("Video destination enrichment was skipped:", error?.message || error);
    return [];
  }
}

function buildVideoSchema(video, videoId, title, description, imageUrl, canonicalUrl, relatedAttraction = null) {
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

  const uploadDate = normalizeVideoUploadDate(video);
  if (uploadDate) {
    schema.uploadDate = uploadDate;
  }

  const duration = normalizeVideoDurationValue(video.duration_iso ?? video.duration);
  if (duration) {
    schema.duration = duration;
  }

  if (relatedAttraction?.["@id"]) {
    schema.about = relatedAttraction;
    schema.contentLocation = {
      "@type": "Place",
      "@id": relatedAttraction["@id"],
      name: relatedAttraction.name,
      ...(relatedAttraction.address
        ? { address: relatedAttraction.address }
        : {}),
    };
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
  const userAgent = String(req.headers?.["user-agent"] || "");
  const isCrawler = CRAWLER_USER_AGENT.test(userAgent);
  let canonicalUrl = videoGallery
    ? `${baseUrl}/videos`
    : `${baseUrl}/${pathType}/${encodeURIComponent(cleanSlug)}`;

  if (videoRoute) {
    res.setHeader("Vary", "User-Agent");
  }

  if (
    (rawSlug && rawSlug !== cleanSlug) ||
    (rawType && !videoGallery && String(rawType) !== pathType)
  ) {
    res.setHeader("Location", canonicalUrl);
    res.setHeader("Cache-Control", "s-maxage=31536000, immutable");
    return res.status(301).end();
  }

  // Individual video URLs are routed through this function for every client
  // so crawler rendering cannot silently fall back to index.html's homepage
  // canonical. Human visitors still receive the SPA shell; React then opens
  // the requested video inside the Video Hub UI.
  if (videoRoute && !isCrawler) {
    try {
      const indexResponse = await fetch(`${baseUrl}/index.html`);
      if (!indexResponse.ok) throw new Error(`Index document fetch failed (${indexResponse.status}).`);
      const html = await indexResponse.text();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return method === "HEAD" ? res.status(200).end() : res.status(200).send(html);
    } catch (error) {
      console.error("Video app shell fetch failed:", error);
      res.setHeader("Cache-Control", "no-store");
      return res.status(503).end("Video page is temporarily unavailable.");
    }
  }

  const { supabaseUrl, supabaseKey } = getSupabaseServerConfig();
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
  let pageSchema = null;
  let articleContentHtml = "";
  let videoDescriptionHtml = "";
  let videoGalleryItems = [];
  let galleryImages = [];

  try {
    if (videoGallery) {
      title = "Aerial & Video Journal | My Journal";
      description = "Watch aerial drone perspectives, backcountry video journals, terrain footage, trails, waterfalls and natural landscapes across Sri Lanka.";
      const videoParams = new URLSearchParams({
        is_active: "eq.true",
        limit: "100",
      });
      const videos = await fetchHubVideos(supabaseUrl, supabaseKey, videoParams);
      const attractions = videos.length
        ? await fetchPublishedAttractions(supabaseUrl, supabaseKey)
        : [];
      videoGalleryItems = videos
        .map((video) => {
          const itemVideoId = getYouTubeId(video.url);
          if (!itemVideoId) return null;
          const videoTitle = cleanText(
            video.title || `Sri Lanka Backcountry Video ${video.id}`,
            "Sri Lanka Backcountry Video",
          );
          const videoDescription = cleanText(
            video.description || `Watch ${videoTitle} from My Journal's Sri Lanka backcountry video archive.`,
          );
          const itemImageUrl = socialImageUrl(
            video.custom_thumbnail_url || `https://img.youtube.com/vi/${itemVideoId}/hqdefault.jpg`,
            `https://img.youtube.com/vi/${itemVideoId}/hqdefault.jpg`,
          );
          const videoSlug = buildVideoSlug(video);
          const pageUrl = `${baseUrl}/videos/${encodeURIComponent(videoSlug)}`;
          const relatedAttraction = findRelatedTouristAttraction(
            video,
            attractions,
            baseUrl,
          );
          const videoWithAttraction = relatedAttraction
            ? {
              ...video,
              relatedAttraction,
              place_name: relatedAttraction.name,
              locality: relatedAttraction.address?.addressLocality,
            }
            : video;
          const schemaDescription = buildConciseVideoSchemaDescription(videoWithAttraction, videoTitle);
          return {
            videoId: itemVideoId,
            title: videoTitle,
            description: videoDescription,
            schemaDescription,
            imageUrl: itemImageUrl,
            pageUrl,
            schema: buildVideoSchema(
              video,
              itemVideoId,
              videoTitle,
              schemaDescription,
              itemImageUrl,
              pageUrl,
              relatedAttraction,
            ),
          };
        })
        .filter(Boolean);
      if (videoGalleryItems[0]?.imageUrl) imageUrl = videoGalleryItems[0].imageUrl;
      pageSchema = buildVideoGallerySchema(videoGalleryItems, title, description, canonicalUrl);
    } else if (videoRoute) {
      // The video description is optional metadata generated below; it is
      // not a column in hub_videos.
      const idSuffix = cleanSlug.match(
        /--?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
      );
      let videos;

      if (idSuffix) {
        const idSlug = idSuffix[1];
        const params = new URLSearchParams({ id: `eq.${idSlug}`, is_active: "eq.true", limit: "1" });
        videos = await fetchHubVideos(supabaseUrl, supabaseKey, params);
      } else {
        // Accept old title-only links while the ID-based links become established.
        const params = new URLSearchParams({ is_active: "eq.true", limit: "1000" });
        videos = await fetchHubVideos(supabaseUrl, supabaseKey, params);
      }

      const video = videos.find((item) =>
        buildVideoSlug(item) === cleanSlug ||
        buildLegacyVideoSlug(item) === cleanSlug ||
        generateSlug(item.title) === cleanSlug,
      );
      videoId = video ? getYouTubeId(video.url) : null;

      if (!video || !videoId) {
        isNotFound = true;
      } else {
        const canonicalVideoSlug = buildVideoSlug(video);
        if (cleanSlug !== canonicalVideoSlug) {
          res.setHeader("Location", `${baseUrl}/videos/${encodeURIComponent(canonicalVideoSlug)}`);
          res.setHeader("Cache-Control", "s-maxage=31536000, stale-while-revalidate=86400");
          return res.status(301).end();
        }

        const videoTitle = cleanText(
          video.title || `Sri Lanka Backcountry Video ${video.id}`,
          "Sri Lanka Backcountry Video",
        );
        const attractions = await fetchPublishedAttractions(supabaseUrl, supabaseKey);
        const relatedAttraction = findRelatedTouristAttraction(
          video,
          attractions,
          baseUrl,
        );
        const videoWithAttraction = relatedAttraction
          ? {
            ...video,
            relatedAttraction,
            place_name: relatedAttraction.name,
            locality: relatedAttraction.address?.addressLocality,
          }
          : video;
        title = `${videoTitle} | My Journal`;
        const fullVideoDescription = cleanText(
          video.description || `Watch ${videoTitle} from My Journal's Sri Lanka backcountry video archive.`,
        );
        description = buildConciseVideoSchemaDescription(videoWithAttraction, videoTitle);
        videoDescriptionHtml = renderArticleContent({ description: fullVideoDescription });
        imageUrl = socialImageUrl(
          video.custom_thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        );
        videoSchema = buildVideoSchema(
          video,
          videoId,
          videoTitle,
          description,
          imageUrl,
          canonicalUrl,
          relatedAttraction,
        );
      }
    } else {
      const params = new URLSearchParams({
        select: "place_name,slug,category,locality,cover_photo_url,ai_article,album_photos",
        status: "in.(done,Completed,Visited)",
        slug: `ilike.${cleanSlug}`,
        limit: "2",
      });
      const slugMatches = await fetchRows(supabaseUrl, supabaseKey, "travel_bucket_list", params);
      let places = slugMatches.length === 1 ? slugMatches : [];

      if (!slugMatches.length) {
        const decodedName = decodedSlug.replace(/-/g, " ").replace(/[\\%_]/g, "\\$&");
        const fallbackParams = new URLSearchParams({
          select: "place_name,slug,category,locality,cover_photo_url,ai_article,album_photos",
          status: "in.(done,Completed,Visited)",
          place_name: `ilike.${decodedName}`,
          limit: "2",
        });
        const nameMatches = await fetchRows(supabaseUrl, supabaseKey, "travel_bucket_list", fallbackParams);
        if (nameMatches.length === 1) {
          const matchedPlace = nameMatches[0];
          const storedSlug = generateSlug(matchedPlace.slug || matchedPlace.place_name);
          if (storedSlug && storedSlug !== cleanSlug) {
            canonicalUrl = `${baseUrl}/${pathType}/${encodeURIComponent(storedSlug)}`;
            res.setHeader("Location", canonicalUrl);
            res.setHeader("Cache-Control", "s-maxage=31536000, immutable");
            return res.status(301).end();
          }
          if (storedSlug === cleanSlug) places = nameMatches;
        }
      }

      const place = places[0];
      if (!place) {
        isNotFound = true;
      } else {
        const placeName = cleanText(place.place_name, "Sri Lanka Backcountry Location");
        const gallery = routeType === "gallery";
        title = buildLocationPageTitle(place, { isGallery: gallery });
        const article = parseArticle(place.ai_article);
        const schemaDescription = buildConciseLocationSchemaDescription(place);
        description = buildLocationMetaDescription(place, { isGallery: gallery });
        articleContentHtml = renderArticleContent(article);
        const heroImageSource = getLocationHeroImageSource(place);
        imageUrl = heroImageSource ? socialImageUrl(heroImageSource, "") : "";
        galleryImages = Array.isArray(place.album_photos)
          ? place.album_photos.slice(0, 50)
            .map((photo, index) => {
              const photoRecord = photo && typeof photo === "object" ? photo : {};
              const url = socialImageUrl(photo, "");
              if (!url) return null;
              const alt = cleanText(
                photoRecord.alt || photoRecord.alt_text || photoRecord.title || `${placeName} landscape photo ${index + 1}`,
              );
              const caption = cleanText(
                photoRecord.caption || photoRecord.description || photoRecord.title || "",
              );
              return { url, alt, caption };
            })
            .filter(Boolean)
          : [];
        pageSchema = buildPlaceSchema(placeName, title, schemaDescription, imageUrl, canonicalUrl, gallery, galleryImages);
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
  description = truncateText(description, 155);

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
      ${safeImageUrl ? `<link rel="image_src" href="${safeImageUrl}" />` : ""}
      <meta property="og:type" content="${openGraphType}" />
      <meta property="og:site_name" content="My Journal" />
      <meta property="og:url" content="${safeCanonicalUrl}" />
      <meta property="og:title" content="${safeTitle}" />
      <meta property="og:description" content="${safeDescription}" />
      ${safeImageUrl ? `<meta property="og:image" content="${safeImageUrl}" />
      <meta property="og:image:secure_url" content="${safeImageUrl}" />
      <meta property="og:image:alt" content="${safeTitle}" />` : ""}
      ${videoTags}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="${safeCanonicalUrl}" />
      <meta name="twitter:title" content="${safeTitle}" />
      <meta name="twitter:description" content="${safeDescription}" />
      ${safeImageUrl ? `<meta name="twitter:image" content="${safeImageUrl}" />
      <meta name="twitter:image:alt" content="${safeTitle}" />` : ""}`;

    const structuredData = videoSchema || pageSchema;
    const schemaTag = structuredData
      ? `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`
      : "";

    html = html
      .replace(/<title>[\s\S]*?<\/title>/gi, "")
      .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, "")
      .replace(/<meta\s+name=["']robots["'][\s\S]*?>/gi, "")
      .replace(/<meta\s+property=["']og:[\s\S]*?>/gi, "")
      .replace(/<meta\s+name=["']twitter:[\s\S]*?>/gi, "")
      .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, "")
      .replace(/<link\s+rel=["']image_src["'][\s\S]*?>/gi, "");

    if (!/<\/head>/i.test(html) || !/<div\b(?=[^>]*\bid\s*=["']root["'])[^>]*>/i.test(html)) {
      throw new Error("Index document does not have the expected HTML shell.");
    }
    html = html.replace(/<\/head>/i, `${metadata}${schemaTag}\n</head>`);

    let mediaContent = "";
    if (videoId) {
      mediaContent = `<iframe src="https://www.youtube-nocookie.com/embed/${escapeHtml(videoId)}" title="${safeTitle}" style="display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:16px" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } else {
      const heroAlt = galleryImages.find((photo) => photo.url === imageUrl)?.alt || title;
      const heroImage = imageUrl
        ? `<img src="${safeImageUrl}" alt="${escapeHtml(heroAlt)}" style="display:block;width:100%;height:auto;max-height:72vh;object-fit:contain;border-radius:16px" fetchpriority="high" />`
        : "";
      const additionalImages = galleryImages
        .filter((photo) => photo.url !== imageUrl)
        .slice(0, 49)
        .map((photo) => `<figure><img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt)}" style="display:block;width:100%;height:auto;max-height:440px;object-fit:cover;border-radius:12px" loading="lazy" />${photo.caption ? `<figcaption>${escapeHtml(photo.caption)}</figcaption>` : ""}</figure>`)
        .join("");
      mediaContent = `${heroImage}${additionalImages ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:20px">${additionalImages}</div>` : ""}`;
    }

    const videoListContent = videoGalleryItems.map((video) =>
      `<article><a href="${escapeHtml(video.pageUrl)}"><img src="${escapeHtml(video.imageUrl)}" alt="${escapeHtml(video.title)}" style="display:block;width:100%;height:auto;max-height:420px;object-fit:cover" loading="lazy" /><h2>${escapeHtml(video.title)}</h2></a><p>${escapeHtml(video.description)}</p></article>`,
    ).join("");
    const richTextContent = [articleContentHtml, videoDescriptionHtml, videoListContent]
      .filter(Boolean)
      .join("");
    const crawlerBody = `<div id="root"><main style="max-width:1100px;margin:0 auto;padding:28px 20px;font-family:system-ui,-apple-system,sans-serif;color:#334155;line-height:1.5"><article>${mediaContent}<h1 style="margin:20px 0 8px;font-size:clamp(24px,4vw,34px);line-height:1.2">${safeTitle}</h1><p style="max-width:760px;margin:0 auto 24px;font-size:13px;line-height:1.5;color:#64748b">${safeDescription}</p>${richTextContent}</article></main></div>`;
    html = replaceRootElement(html, crawlerBody);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", videoRoute
      ? "no-store"
      : isNotFound
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
