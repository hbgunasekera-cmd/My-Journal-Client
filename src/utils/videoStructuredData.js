function normalizeMatchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getAttractionSlug(place = {}) {
  const slug = String(place.slug || place.place_name || place.name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug;
}

/**
 * Resolves a video to a published TouristAttraction only when an explicit
 * place reference or an unambiguous place-name match in its title exists.
 */
export function findRelatedTouristAttraction(
  video = {},
  places = [],
  siteUrl = "https://www.myjournalview.com",
) {
  if (!Array.isArray(places) || places.length === 0) return null;
  const publicPlaces = places.filter((place) => {
    const status = String(place.status || "").trim().toLowerCase();
    return !status || ["done", "completed", "visited"].includes(status);
  });

  const videoPlaceId =
    video.location_id ||
    video.place_id ||
    video.travel_bucket_list_id;
  const explicitNames = [
    video.place_name,
    video.location_name,
    video.destination_name,
    typeof video.location === "string" ? video.location : video.location?.name,
  ]
    .map(normalizeMatchText)
    .filter(Boolean);

  let matchedPlace = videoPlaceId
    ? publicPlaces.find((place) => String(place.id) === String(videoPlaceId))
    : null;

  if (!matchedPlace && explicitNames.length) {
    matchedPlace = publicPlaces.find((place) => {
      const candidates = [place.place_name, place.slug].map(normalizeMatchText);
      return explicitNames.some((name) => candidates.includes(name));
    });
  }

  if (!matchedPlace) {
    const title = normalizeMatchText(video.title || video.name);
    if (title) {
      const titleMatches = publicPlaces
        .filter((place) => {
          const placeName = normalizeMatchText(place.place_name);
          const placeSlug = normalizeMatchText(place.slug);
          return [placeName, placeSlug].some(
            (candidate) => candidate.length >= 5 && ` ${title} `.includes(` ${candidate} `),
          );
        })
        .sort(
          (left, right) =>
            normalizeMatchText(right.place_name).length -
            normalizeMatchText(left.place_name).length,
        );

      const mostSpecificName = normalizeMatchText(titleMatches[0]?.place_name);
      const remainingMatchesAreNested = titleMatches
        .slice(1)
        .every((place) => mostSpecificName.includes(normalizeMatchText(place.place_name)));

      // Refuse generic or ambiguous matches; nested names resolve to the
      // most specific destination when a title contains both variants.
      if (titleMatches.length > 0 && (titleMatches.length === 1 || remainingMatchesAreNested)) {
        matchedPlace = titleMatches[0];
      }
    }
  }

  if (!matchedPlace?.place_name) return null;

  const slug = getAttractionSlug(matchedPlace);
  if (!slug) return null;

  const url = `${siteUrl.replace(/\/+$/, "")}/place/${encodeURIComponent(slug)}`;
  const locality = String(matchedPlace.locality || matchedPlace.district || "").trim();

  return {
    "@type": "TouristAttraction",
    "@id": `${url}#place`,
    name: matchedPlace.place_name,
    url,
    address: {
      "@type": "PostalAddress",
      ...(locality ? { addressLocality: locality } : {}),
      addressCountry: "LK",
    },
  };
}

/**
 * Uses the original publish date when available, falling back to the
 * record's creation date. Invalid or missing dates are omitted.
 */
export function normalizeVideoUploadDate(video = {}) {
  const value = video.upload_date || video.published_at || video.created_at;
  if (!value) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Converts seconds, MM:SS, HH:MM:SS, or ISO duration to Schema.org format. */
export function normalizeVideoDurationValue(value) {
  if (value === null || value === undefined || value === "") return undefined;

  if (
    typeof value === "string" &&
    /^PT(?=.+)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?$/i.test(value.trim())
  ) {
    return value.trim();
  }

  if (typeof value === "number" || /^\d+(?:\.\d+)?$/.test(String(value).trim())) {
    const numericSeconds = Number(value);
    if (!Number.isFinite(numericSeconds) || numericSeconds < 0) return undefined;
    let remaining = Math.round(numericSeconds);
    const hours = Math.floor(remaining / 3600);
    remaining %= 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds || (!hours && !minutes) ? `${seconds}S` : ""}`;
  }

  const match = String(value).trim().match(/^(?:(\d{1,3}):)?(\d{1,3}):(\d{2})$/);
  if (!match) return undefined;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  if (minutes >= 60 || seconds >= 60) return undefined;

  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds || (!hours && !minutes) ? `${seconds}S` : ""}`;
}
