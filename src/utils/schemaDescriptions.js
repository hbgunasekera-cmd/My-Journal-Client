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

const LOCATION_CATEGORY_NOUNS = [
  [/waterfall|falls?/, "waterfall"],
  [/mountain|peak|summit|range/, "mountain or peak"],
  [/view\s*point|viewpoint|lookout|overlook/, "viewpoint"],
  [/monastery|temple|shrine|hermitage/, "monastery or temple"],
  [/trail|trek|hike|hiking/, "hiking trail"],
  [/archaeolog|historic|historical|heritage|ruins/, "heritage site"],
  [/beach|coast|shore/, "beach"],
  [/reservoir|tank|lake|water\s*body/, "lake or reservoir"],
  [/plateau|tableland/, "plateau"],
  [/forest|park|reserve/, "nature area"],
  [/pool/, "natural pool"],
  [/stream|creek|brook/, "stream"],
];

const NARRATIVE_OPENING = /^(?:the )?(?:morning|evening|afternoon|sun|sunrise|sunset|journey|trip|day|weather|wind|rain)\b|^(?:we|i)\s+(?:arrived|started|set off|reached|began|found)\b|\bwas already making its presence felt\b/i;

// Only descriptions in this registry may make factual claims in location
// schema and social metadata. Verify each claim against an authoritative
// source before adding it. Unknown locations receive a neutral description;
// this does not alter the visible article text.
const VERIFIED_LOCATION_SCHEMA_DESCRIPTIONS = new Map([
  [
    "thotupola mountain",
    {
      description:
        "Thotupola Kanda (Thotupola Mountain) is Sri Lanka's third-highest peak at 2,357 metres, within Horton Plains National Park.",
      source: "https://tourism.cp.gov.lk/en/hiking-n-trekking",
    },
  ],
  [
    "thotupola kanda",
    {
      description:
        "Thotupola Kanda (Thotupola Mountain) is Sri Lanka's third-highest peak at 2,357 metres, within Horton Plains National Park.",
      source: "https://tourism.cp.gov.lk/en/hiking-n-trekking",
    },
  ],
  [
    "totapolakanda",
    {
      description:
        "Thotupola Kanda (Thotupola Mountain) is Sri Lanka's third-highest peak at 2,357 metres, within Horton Plains National Park.",
      source: "https://tourism.cp.gov.lk/en/hiking-n-trekking",
    },
  ],
]);

function normalizeLocationKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getVerifiedLocationDescription(place = {}) {
  for (const candidate of [place.slug, place.place_name, place.name]) {
    const verified = VERIFIED_LOCATION_SCHEMA_DESCRIPTIONS.get(
      normalizeLocationKey(candidate),
    );
    if (verified) return verified.description;
  }
  return "";
}

function getLocationCategoryNoun(category = "") {
  const normalized = cleanDescription(category).toLowerCase();
  return LOCATION_CATEGORY_NOUNS.find(([pattern]) => pattern.test(normalized))?.[1]
    || "destination";
}

function buildLocationGalleryMetaDescription(placeName, categoryNoun) {
  const candidates = [
    `View the ${placeName} photo gallery on My Journal. Explore its images, mapped coordinates and destination information for this ${categoryNoun} in Sri Lanka.`,
    `View the ${placeName} photo gallery on My Journal. Explore its photos, mapped coordinates and location information for this ${categoryNoun} in Sri Lanka.`,
    `View the ${placeName} photo gallery on My Journal. Explore its mapped coordinates, destination and category information for this ${categoryNoun} in Sri Lanka.`,
    `View the ${placeName} photo gallery on My Journal. Explore its mapped coordinates, category details and location information for this ${categoryNoun} in Sri Lanka.`,
    `View the ${placeName} photo gallery on My Journal. Explore its mapped coordinates, location, category and destination details for this ${categoryNoun} in Sri Lanka.`,
    `View the ${placeName} photo gallery on My Journal. Explore its mapped coordinates, location, category and destination information for this ${categoryNoun} in Sri Lanka.`,
    `The My Journal gallery for ${placeName} includes photos, mapped coordinates, category and location details for this ${categoryNoun} in Sri Lanka.`,
    `Find ${placeName} photos and mapped location details in the My Journal gallery. This ${categoryNoun} entry also lists category information for Sri Lanka.`,
    `The My Journal gallery page for ${placeName} includes photos, mapped coordinates, category and location details for this ${categoryNoun} in Sri Lanka.`,
  ];

  const preferred = candidates.find(
    (candidate) => candidate.length >= 150 && candidate.length <= 155,
  );
  if (preferred) return preferred;

  // Long names or uncommon categories may not fit the preferred range. Keep
  // the closest complete sentence that still fits the app's 155-char cap.
  const underLimit = candidates.filter((candidate) => candidate.length <= 155);
  if (underLimit.length) {
    return underLimit.reduce((best, current) =>
      current.length > best.length ? current : best,
    );
  }

  return trimToLimit(candidates[0], 155);
}

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

export function buildConciseLocationSchemaDescription(place = {}) {
  const verifiedDescription = getVerifiedLocationDescription(place);
  if (verifiedDescription) return verifiedDescription;

  const placeName = cleanDescription(place.place_name || place.name || "");
  if (!placeName) return "Explore this destination in My Journal.";

  const category = cleanDescription(place.category || "");
  const locality = cleanDescription(place.locality || "");
  const genericCategories = new Set(["location", "destination", "attraction"]);
  const location = [locality, "Sri Lanka"].filter(Boolean).join(", ");

  const categoryText = category && !genericCategories.has(category.toLowerCase())
    ? `listed under the ${category} category`
    : "listed as a destination";

  return `${placeName} is ${categoryText} in ${location}. Explore its location guide and photos on My Journal.`;
}

export function buildLocationMetaDescription(place = {}, { isGallery = false } = {}) {
  const placeName = cleanDescription(place.place_name || place.name || "");
  if (!placeName) return "Explore this destination in My Journal.";

  const categoryNoun = getLocationCategoryNoun(place.category);
  if (isGallery) {
    return buildLocationGalleryMetaDescription(placeName, categoryNoun);
  }

  const verifiedDescription = getVerifiedLocationDescription(place);
  if (verifiedDescription) {
    return `Travel guide for ${placeName}. ${verifiedDescription}`;
  }

  return `Read the My Journal travel guide for ${placeName}, a ${categoryNoun} in Sri Lanka. Find map coordinates, photos and destination information on this page.`;
}

export function buildConciseVideoSchemaDescription(video = {}, title = "") {
  const videoTitle = title || video.title || video.name || "My Journal video";
  const videoPlace =
    video.place_name ||
    video.location_name ||
    video.relatedAttraction?.name ||
    (typeof video.location === "string" ? video.location : video.location?.name) ||
    "";
  const locality =
    video.locality ||
    video.location?.locality ||
    video.relatedAttraction?.address?.addressLocality ||
    "";
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
