import { reportClientError } from './clientErrorLogger.js';

function cleanLocationText(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildLocationPageTitle(place = {}, { isGallery = false } = {}) {
  const name = cleanLocationText(place.place_name || place.name) || "Sri Lanka Destination";
  const category = cleanLocationText(place.category) || "Destination";
  return isGallery
    ? `${name} Photos & Aerial Views (${category}), Sri Lanka | My Journal`
    : `${name} (${category}) Travel Guide, Sri Lanka | My Journal`;
}

function getImageSource(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(value.url || value.src || value.image_url || "").trim();
}

function isUsableImageSource(value) {
  try {
    const parsed = new URL(value, "https://www.myjournalview.com");
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    return host !== "photos.google.com" && host !== "photos.app.goo.gl";
  } catch (error) {
    reportClientError(error, {
      errorType: 'handled_error',
      context: { operation: 'validate_location_image_url' },
    });
    return false;
  }
}

/** Prefer this location's saved cover; use its own first gallery image only if needed. */
export function getLocationHeroImageSource(place = {}) {
  const candidates = [
    place.cover_photo_url,
    ...(Array.isArray(place.album_photos) ? place.album_photos : []),
  ].map(getImageSource);
  return candidates.find((source) => source && isUsableImageSource(source)) || "";
}
