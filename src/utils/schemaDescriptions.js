const CATEGORY_TERMS = {
  waterfall: ["waterfall", "falls", "cascade"],
  mountain: ["mountain", "mountains", "peak", "range", "summit"],
  trail: ["trail", "trek", "hike", "hiking", "route"],
  viewpoint: ["viewpoint", "view point", "lookout", "panorama", "overlook"],
  monastery: ["monastery", "temple", "shrine", "hermitage", "buddhist"],
  archaeology: ["archaeological", "archaeology", "historic", "historical", "heritage", "ruins"],
  beach: ["beach", "coast", "shore"],
  reservoir: ["reservoir", "tank", "lake", "water body"],
  plateaus: ["plateau", "plateaus", "tableland"],
  reservedforest: ["reserved forest", "forest reserve", "forest"],
  park: ["park", "nature reserve"],
  pool: ["pool", "natural pool"],
  stream: ["stream", "creek", "brook"],
  location: ["destination", "attraction", "place"],
};

const CATEGORY_LABELS = {
  waterfall: "waterfall",
  mountain: "mountain",
  trail: "trail",
  viewpoint: "viewpoint",
  beach: "beach",
  park: "park",
  plateaus: "plateau",
  reservedforest: "reserved forest",
  monastery: "monastery",
  archaeology: "archaeological site",
  reservoir: "reservoir",
  pool: "natural pool",
  stream: "stream",
  location: "destination",
};

const NARRATIVE_OPENING = /^(?:the )?(?:morning|evening|afternoon|sun|sunrise|sunset|journey|trip|day|weather|wind|rain)\b|^(?:we|i)\s+(?:arrived|started|set off|reached|began|found)\b|\bwas already making its presence felt\b/i;

function cleanDescription(value) {
  if (typeof value !== "string") return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[`*_>#]/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function includesPhrase(text, phrase) {
  const normalizedText = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ")} `;
  const normalizedPhrase = String(phrase || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  return normalizedPhrase.length >= 3 && normalizedText.includes(` ${normalizedPhrase} `);
}

function sentenceCandidates(value) {
  const cleaned = cleanDescription(value);
  if (!cleaned) return [];

  return cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function trimToLimit(value, maxLength) {
  if (value.length <= maxLength) return value;

  const shortened = value.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const boundary = lastSpace > maxLength * 0.65 ? lastSpace : maxLength;
  return `${shortened.slice(0, boundary).replace(/[\s,;:.-]+$/g, "")}…`;
}

/**
 * Selects one concise, location-related sentence from existing content.
 * This is extractive: it does not invent facts or call an AI service.
 */
export function buildConciseSchemaDescription({
  candidates = [],
  placeName = "",
  locality = "",
  category = "",
  relatedTerms = [],
  fallback = "",
  maxLength = 200,
} = {}) {
  const categoryKey = String(category).toLowerCase().replace(/[^a-z]/g, "");
  const terms = [
    ...relatedTerms,
    ...(CATEGORY_TERMS[categoryKey] || []),
  ].filter(Boolean);

  let bestSentence = "";
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? candidate : candidate?.value;
    const weight = typeof candidate === "string" ? 0 : Number(candidate?.weight || 0);

    for (const sentence of sentenceCandidates(value)) {
      let score = weight;
      if (placeName && includesPhrase(sentence, placeName)) score += 10;
      if (locality && includesPhrase(sentence, locality)) score += 8;
      for (const term of terms) {
        if (includesPhrase(sentence, term)) score += 2;
      }
      if (sentence.length <= maxLength) score += 1;
      if (NARRATIVE_OPENING.test(sentence)) score -= 8;

      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }
  }

  let description = bestScore > 0 ? bestSentence : cleanDescription(fallback);
  if (!description) return "";

  // Keep every description tied to the destination even when the selected
  // source sentence describes a feature without naming where it is.
  if (placeName && !includesPhrase(description, placeName)) {
    if (locality && includesPhrase(description, locality)) {
      description = `${placeName}: ${description}`;
    } else {
      const location = [placeName, locality, "Sri Lanka"].filter(Boolean).join(", ");
      description = `${description.replace(/[.!?]+$/, "")}. Located at ${location}.`;
    }
  }

  return trimToLimit(description, maxLength);
}

export function buildConciseLocationSchemaDescription(place = {}, articleValue = null) {
  let article = articleValue;
  if (typeof article === "string") {
    try {
      article = JSON.parse(article);
    } catch {
      article = { story: article };
    }
  }
  if (!article || typeof article !== "object" || Array.isArray(article)) article = {};

  const about = article.about && typeof article.about === "object" ? article.about : {};
  const whyVisit = article.why_visit && typeof article.why_visit === "object" ? article.why_visit : {};
  const placeName = place.place_name || place.name || "";
  const locality = place.locality || place.city || "";
  const category = place.category || "destination";
  const categoryLabel = CATEGORY_LABELS[String(category).toLowerCase().replace(/[^a-z]/g, "")] || "destination";
  const articleWord = /^[aeiou]/i.test(categoryLabel) ? "an" : "a";
  const fallback = placeName
    ? `${placeName} is ${articleWord} ${categoryLabel}${locality ? ` in ${locality}` : " in Sri Lanka"}.`
    : "Destination in Sri Lanka.";

  return buildConciseSchemaDescription({
    candidates: [
      { value: article.schema_description, weight: 8 },
      { value: article.meta_description, weight: 7 },
      { value: article.seo_description, weight: 7 },
      { value: article.seo_intro, weight: 6 },
      { value: about.overview, weight: 5 },
      { value: whyVisit.summary, weight: 4 },
      { value: place.short_description, weight: 4 },
      { value: place.description, weight: 3 },
      { value: article.story, weight: 0 },
      { value: typeof articleValue === "string" ? articleValue : "", weight: 0 },
    ],
    placeName,
    locality,
    category,
    fallback,
  });
}

export function buildConciseVideoSchemaDescription(video = {}, title = "") {
  const videoTitle = title || video.title || video.name || "My Journal video";
  const videoPlace =
    video.place_name ||
    video.location_name ||
    (typeof video.location === "string" ? video.location : video.location?.name) ||
    "";
  const locality = video.locality || video.location?.locality || "";
  const fallback = `Video clip of ${videoTitle}${videoPlace ? ` at ${videoPlace}` : locality ? ` in ${locality}` : " from Sri Lanka"}.`;

  return buildConciseSchemaDescription({
    candidates: [
      { value: video.schema_description, weight: 8 },
      { value: video.meta_description, weight: 7 },
      { value: video.seo_description, weight: 6 },
      { value: video.description, weight: 4 },
    ],
    placeName: videoPlace || videoTitle,
    locality,
    category: video.category || "",
    relatedTerms: [videoTitle, videoPlace],
    fallback,
  });
}

export function buildConciseImageSchemaDescription({
  description = "",
  caption = "",
  placeName = "",
  locality = "",
  category = "",
} = {}) {
  return buildConciseSchemaDescription({
    candidates: [
      { value: description, weight: 3 },
      { value: caption, weight: 5 },
    ],
    placeName,
    locality,
    category,
    fallback: caption || `${placeName} landscape photograph in ${locality || "Sri Lanka"}.`,
  });
}
