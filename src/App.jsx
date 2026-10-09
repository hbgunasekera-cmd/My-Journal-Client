// =======================================================================
// 1. REACT CORE & DOM HOOKS
// =======================================================================
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
} from 'react';
import { createRoot } from 'react-dom/client';

// =======================================================================
// 2. THIRD-PARTY LIBRARIES & UTILITIES
// =======================================================================
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import toast, { Toaster } from 'react-hot-toast';

// =======================================================================
// 3. DRAG AND DROP ENGINE
// =======================================================================
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// =======================================================================
// 4. LEAFLET MAP ENGINE & STYLES
// =======================================================================
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// =======================================================================
// 5. LUCIDE ICONS (CONSOLIDATED & ALPHABETIZED)
// =======================================================================
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  Globe,
  GripVertical,
  Heart,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Pause,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sun,
  UserCheck,
  Video,
  Wind,
  X,
  Zap
} from 'lucide-react';

// =======================================================================
// 6. LOCAL UTILITIES, COMPONENTS & LOCALIZATION CONFIG
// =======================================================================
import './i18n.js';

// =======================================================================
// 7. CONFIGURATION & INITIALIZATION
// =======================================================================
const CONFIG = {
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL,
    KEY: import.meta.env.VITE_SUPABASE_KEY,
  },
  API_KEYS: {
    WEATHER: import.meta.env.VITE_WEATHER_KEY,
    ORS: import.meta.env.VITE_ORS_KEY,
  }
};

const { URL: SUPABASE_URL, KEY: SUPABASE_KEY } = CONFIG.SUPABASE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Configuration missing! Check VITE_SUPABASE_URL and VITE_SUPABASE_KEY environment variables."
  );
}

export const supabaseClient = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Global Leaflet attachment for routing compatibility
if (typeof window !== 'undefined') {
  window.L = L;
}

// Leaflet Default Marker Asset Fix
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// =======================================================================
// 8. CONSTANTS & CATEGORY DESCRIPTIONS
// =======================================================================
export const DEFAULT_LOCATION = { lat: 7.0777, lng: 79.8924 };

export const VALID_CATEGORIES = [
  "Waterfall", "Mountain", "Trail", "Viewpoint", "Beach", "Park",
  "Plateaus", "Reserved Forest", "Monastery", "Archaeology", "Reservoir",
  "Pool", "Stream", "Location"
];

export const CATEGORY_STYLES = {
  // Water & Coastal 
  Waterfall: {
    class: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700/30",
    hex: "#0ea5e9"
  },
  Beach: {
    class: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700/40",
    hex: "#2563eb"
  },
  Reservoir: {
    class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30",
    hex: "#3b82f6"
  },
  Pool: {
    class: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/30",
    hex: "#6366f1"
  },
  Stream: {
    class: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/30",
    hex: "#06b6d4"
  },

  // Earth, Mountains & Forests
  Mountain: {
    class: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/30",
    hex: "#a855f7" // Purple
  },
  Trail: {
    class: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/40",
    hex: "#d97706"
  },
  Park: {
    class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/30",
    hex: "#22c55e"
  },
  Plateaus: {
    class: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700/30",
    hex: "#84cc16"
  },
  "Reserved Forest": {
    class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/30",
    hex: "#10b981" // Original required color
  },

  // Culture, Heritage & Sightseeing
  Monastery: {
    class: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/30",
    hex: "#f97316" // Original required color
  },
  Archaeology: {
    class: "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-300 dark:border-stone-700/30",
    hex: "#78716c" // Stone
  },
  Viewpoint: {
    class: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-700/30",
    hex: "#d946ef"
  },
  Location: {
    class: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-300 dark:border-zinc-700/30",
    hex: "#71717a"
  },

  // Amenities & Attractions
  attraction: {
    class: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/30",
    hex: "#eab308" // Yellow/Gold
  },
  gas_station: {
    class: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/30",
    hex: "#ef4444" // Red
  },
  restaurant: {
    class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/30",
    hex: "#3b82f6"
  },
  lodging: {
    class: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-700/30",
    hex: "#d946ef"
  },

  // Fallback
  Default: {
    class: "bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-700/30",
    hex: "#525252"
  }
};


export const getCategoryStyleObject = (category) => {
  if (!category) return CATEGORY_STYLES.Default;

  if (CATEGORY_STYLES[category]) return CATEGORY_STYLES[category];

  const normalizedCategory = category.trim().toLowerCase();
  const matchedKey = Object.keys(CATEGORY_STYLES).find(
    (key) => key.toLowerCase() === normalizedCategory
  );

  return CATEGORY_STYLES[matchedKey] || CATEGORY_STYLES.Default;
};

export const getCategoryColorClass = (category) => {
  return getCategoryStyleObject(category).class;
};

export const getCategoryHex = (category) => {
  return getCategoryStyleObject(category).hex;
};

export const CATEGORY_DESCRIPTIONS = {
  "All": "A comprehensive expedition directory detailing remote geographical locations across Sri Lanka. Explore mapped coordinates, terrain conditions, and photographic field notes spanning waterfalls, highland mountain trails, historical monasteries, and hidden natural streams.",
  "Waterfall": "Documenting Sri Lanka's spectacular hydrological systems and hidden cascade clusters. This index details trail routes, baseline water volumes, seasonal patterns, and safe approaches for photographing remote waterfalls embedded within the island's central tea valley basins and mountain ranges.",
  "Mountain": "High-altitude alpine formations, mountain peaks, and challenging ridges across Sri Lanka's central highlands. Access field telemetry regarding elevation statistics, cloud forest borders, geographic exposure profiles, and wild camping layout vectors.",
  "Trail": "Backcountry trekking pathways, wilderness hiking loops, and primitive footpaths. Tracks technical navigation indicators, terrain difficulty scales, path visibility parameters, and essential equipment prep benchmarks for foot expeditions.",
  "Viewpoint": "Panoramic geographical lookouts, sheer cliff drop-offs, and high-altitude observation horizons across mountain passes. Includes solar tracking visibility timelines and optimal ambient conditions for wide-angle landscape photography.",
  "Beach": "Remote coastal formations, pristine sandy shorelines, and maritime boundaries across Sri Lanka's marine belts. Documenting reef layouts, localized tidal tendencies, and uncrowded coastal horizons suited for adventure tracking.",
  "Park": "National parks, strictly handled wildlife sanctuaries, and ecological reserves. Information focuses on protected habitat limits, migration corridors, Department of Wildlife Conservation (DWC) access rules, and field safety protocols.",
  "Plateaus": "High-altitude tablelands and unique highland plains ecosystems characterized by distinct dwarf forest flora and open montane grasslands. Field metrics map shifting cloud cover, high wind exposures, and overnight trail conditions.",
  "Reserved Forest": "Highly protected tropical rainforests, pristine endemic biomes, and protected buffer woodland zones. These technical logs emphasize strict wilderness conservation ethics, deep jungle path navigation, and biological diversity indices.",
  "Monastery": "Ancient rock-cut forest hermitages and meditative sanctuary complexes tucked away inside isolated canopies. These field reports outline historic architectural structures, step routes, cave inscriptions, and respect-driven exploration rules.",
  "Archaeology": "Preserved historic ruins, ancient structural components, stupas, and royal gardens throughout Sri Lanka's historic capitals. Mapping spatial networks between historic stone masonry, ancient inscription coordinates, and guardstones.",
  "Reservoir": "Massive historical man-made lake systems and catchments engineered throughout the island's river basins. Tracks surrounding forest buffers, protective embankment pathways, and visual vantage horizons for photography.",
  "Pool": "Pristine natural rock pools, secluded stream basins, and wild swimming water bodies found along mountain river beds. Emphasizes depth assessments, water flow safety vectors, and seasonal water volume updates.",
  "Stream": "Clear natural waterways, cold-water channels, and minor river tributaries flowing through dense reserves. Ideal reference points for identifying clean mountain water collection nodes, micro-climate variations, and aquatic biodiversity clusters.",
  "Location": "Geographic landmarks, notable rural waypoints, and specialized exploratory points of interest across Sri Lanka. Serves as a localized spatial reference framework connecting different natural terrains and tracking coordinates."
};

// =======================================================================
// 9. UTILITY HELPERS & HOOKS
// =======================================================================

/**
 * Custom React hook to debounce state updates
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}


/**
 * Left-click drag scrolling for application scroll containers.
 *
 * Native wheel / touchpad / touchscreen scrolling is intentionally
 * NOT intercepted. This hook only adds the optional left-mouse-drag
 * scrolling behavior.
 *
 * Interactive descendants such as buttons, links, inputs, textareas,
 * selects, and drag handles are excluded so normal interaction remains
 * intact.
 */

export function useDragScroll() {
  // Use state instead of useRef so we trigger a re-render/effect when the element mounts
  const [element, setElement] = useState(null);
  const dragState = useRef({
    active: false,
    dragging: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });

  useEffect(() => {
    // If the element isn't in the DOM yet, do nothing. 
    // It will run again automatically once the element mounts.
    if (!element) return;

    const isInteractiveTarget = (target) => {
      if (!(target instanceof Element)) return false;
      return Boolean(
        target.closest(
          'button, a, input, textarea, select, option, [role="button"], [role="link"], [data-no-drag-scroll], [draggable="true"]'
        )
      );
    };

    const handlePointerDown = (e) => {
      /* Only physical left mouse button. */
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (isInteractiveTarget(e.target)) return;

      dragState.current = {
        active: true,
        dragging: false,
        startX: e.clientX,
        startY: e.clientY,
        startScrollLeft: element.scrollLeft,
        startScrollTop: element.scrollTop,
      };
    };

    const handlePointerMove = (e) => {
      const state = dragState.current;
      if (!state.active) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (!state.dragging) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

        state.dragging = true;
        element.classList.add('drag-scroll-active');
        element.setPointerCapture?.(e.pointerId);
      }

      element.scrollLeft = state.startScrollLeft - dx;
      element.scrollTop = state.startScrollTop - dy;

      e.preventDefault();
    };

    const endDrag = (e) => {
      if (element?.hasPointerCapture?.(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
      }

      element?.classList.remove('drag-scroll-active');

      dragState.current = {
        active: false,
        dragging: false,
        startX: 0,
        startY: 0,
        startScrollLeft: 0,
        startScrollTop: 0,
      };
    };

    // Attach listeners dynamically when the element becomes available
    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', endDrag);
    element.addEventListener('pointercancel', endDrag);
    element.addEventListener('lostpointercapture', endDrag);

    // Clean up event listeners when the element unmounts
    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', endDrag);
      element.removeEventListener('pointercancel', endDrag);
      element.removeEventListener('lostpointercapture', endDrag);
    };
  }, [element]); // Dependency array tracks the DOM element

  // Return the state setter to act as our callback ref
  return setElement;
}

// =======================================================================
// 10. GEO & MATH HELPERS
// =======================================================================

/**
 * Calculates Haversine distance in kilometers between two lat/lon coordinates
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// =======================================================================
// 11. STRING, URL & AUTOMATIC MEDIA SEO HELPERS
// =======================================================================

/**
 * Sanitizes location names for display/SEO text normalization only.
 *
 * This does not modify the underlying database value.
 */
export const auditLocationName = (name) => {
  if (!name) return "Unnamed Location";

  return String(name)
    .replace(/[^a-zA-Z0-9\s\-'.]/g, "")
    .trim();
};

/**
 * Generates deterministic URL-safe slugs.
 */
export const generateSlug = (name) => {
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
};

const safeDecodeURIComponent = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const Breadcrumbs = ({ items = [], className = "" }) => {
  const visibleItems = items.filter((item) => item?.label);
  if (visibleItems.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className="flex flex-wrap items-center gap-x-2 gap-y-1"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {visibleItems.map((item, index) => {
          const isCurrent = index === visibleItems.length - 1;
          return (
            <li
              key={`${item.href || item.label}-${index}`}
              className="inline-flex items-center gap-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {item.href && !isCurrent ? (
                <a
                  href={item.href}
                  itemProp="item"
                  className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                  <span itemProp="name">{item.label}</span>
                </a>
              ) : (
                <span
                  itemProp="name"
                  aria-current={isCurrent ? "page" : undefined}
                  className={isCurrent ? "font-semibold" : ""}
                >
                  {item.label}
                </span>
              )}
              <meta itemProp="position" content={String(index + 1)} />
              {!isCurrent && (
                <ChevronRight aria-hidden="true" className="h-3 w-3 opacity-50" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const getLocalizedValue = (item, baseKey, currentLanguage = "en") => {
  if (!item) return "";
  const lang = currentLanguage.split("-")[0].toLowerCase();
  if (lang === "en") return item[baseKey] || "";
  const localizedKey = `${baseKey}_${lang}`;
  const legacyLang = lang === "id" ? "in" : lang === "ko" ? "kr" : null;
  return item[localizedKey] || (legacyLang && item[`${baseKey}_${legacyLang}`]) || item[baseKey] || "";
};

const getSafeHttpUrl = (value) => {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const getInitialAppRouteState = () => {
  const initialState = {
    isPrivacyOpen: false,
    legalView: "privacy",
    isPlannerOpen: false,
    isAddOpen: false,
  };
  if (typeof window === "undefined") return initialState;

  const url = new URL(window.location.href);
  const path = url.pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const view = url.searchParams.get("view");
  const legalView = ["privacy", "terms", "about"].find(
    (candidate) => view === candidate || path === "/" + candidate,
  );

  if (legalView) {
    return { ...initialState, isPrivacyOpen: true, legalView };
  }
  if (view === "route_planner" || path === "/route-planner" || path === "/plan") {
    return { ...initialState, isPlannerOpen: true };
  }
  if (view === "suggest_spot" || path === "/suggest-spot" || path === "/add") {
    return { ...initialState, isAddOpen: true };
  }
  return initialState;
};

const getCategoryFromSearch = (search = "") => {
  const requestedCategory = new URLSearchParams(search)
    .get("category")
    ?.trim()
    .toLowerCase();

  return VALID_CATEGORIES.find(
    (category) => category.toLowerCase() === requestedCategory,
  ) || "All";
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);

/**
 * Optimizes supported external image URLs.
 *
 * The original database URL is never changed.
 */
export const getOptimizedUrl = (
  url,
  width = 1000,
  quality = 70
) => {
  if (!url) return "";

  const value = String(url).trim();

  if (!value) {
    return "";
  }

  const safeWidth = Number.isFinite(Number(width))
    ? Math.max(1, Math.min(2500, Math.round(Number(width))))
    : 1000;
  const safeQuality = Number.isFinite(Number(quality))
    ? Math.max(20, Math.min(100, Math.round(Number(quality))))
    : 70;
  if (value.startsWith("/")) return value;

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    return "";
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) return "";
  const host = parsedUrl.hostname.toLowerCase();

  // ---------------------------------------------------------------------
  // Google User Content / Google Photos
  // ---------------------------------------------------------------------

  if (host === "googleusercontent.com" || host.endsWith(".googleusercontent.com")) {
    const baseUrl = value
      .split("=")[0]
      .split("?")[0];

    return `${baseUrl}=w${safeWidth}-rw`;
  }

  // ---------------------------------------------------------------------
  // Supabase Storage
  // ---------------------------------------------------------------------

  if (host.endsWith(".supabase.co")) {
    if (import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMATIONS !== "true") {
      return value;
    }

    const publicObjectPrefix = "/storage/v1/object/public/";
    const publicRenderPrefix = "/storage/v1/render/image/public/";
    if (parsedUrl.pathname.includes(publicObjectPrefix)) {
      parsedUrl.pathname = parsedUrl.pathname.replace(publicObjectPrefix, publicRenderPrefix);
    }
    if (parsedUrl.pathname.includes(publicRenderPrefix)) {
      parsedUrl.searchParams.set("width", String(safeWidth));
      parsedUrl.searchParams.set("quality", String(safeQuality));
      parsedUrl.searchParams.set("format", "webp");
      return parsedUrl.toString();
    }
  }

  return parsedUrl.toString();
};

/**
 * Truncates text on a word boundary.
 */
export const truncateText = (
  text,
  maxLength = 155
) => {
  if (!text) {
    return "";
  }

  const value = String(text).trim();

  if (value.length <= maxLength) {
    return value;
  }

  const trimmed = value.substring(
    0,
    maxLength
  );

  const lastSpace =
    trimmed.lastIndexOf(" ");

  return (
    lastSpace > 0
      ? trimmed.substring(0, lastSpace)
      : trimmed
  ) + "...";
};

// =======================================================================
// 11A. GENERIC SEO TEXT HELPERS
// =======================================================================

/**
 * Conservatively cleans dynamically generated SEO text.
 */
export const seoCleanText = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const cleaned = String(value)
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();

  return cleaned || fallback;
};

/**
 * Safely obtains the public place name.
 */
export const getMediaSEOPlaceName = (
  place = {}
) => {
  return seoCleanText(
    place?.place_name ||
    place?.name ||
    place?.title,
    "Sri Lanka Backcountry Location"
  );
};

/**
 * Safely obtains category/type.
 */
export const getMediaSEOCategory = (
  place = {}
) => {
  return seoCleanText(
    place?.category ||
    place?.type,
    "natural attraction"
  );
};

/**
 * Safely obtains locality.
 *
 * No geographic fallback is supplied here because callers that emit
 * structured geographic metadata must distinguish an actual source value
 * from a generic Sri Lanka-wide context.
 */
export const getMediaSEOLocality = (
  place = {}
) => {
  return seoCleanText(
    place?.locality ||
    place?.district ||
    place?.province
  );
};

/**
 * Safely obtains canonical place slug.
 *
 * Existing DB slug is preferred.
 * Otherwise a deterministic slug is generated.
 */
export const getMediaSEOPlaceSlug = (
  place = {}
) => {
  const existingSlug = seoCleanText(
    place?.slug
  );

  if (existingSlug) {
    return generateSlug(existingSlug);
  }

  return generateSlug(
    getMediaSEOPlaceName(place)
  );
};

/**
 * Safely converts an arbitrary date value into ISO format.
 *
 * Invalid dates are discarded rather than invented.
 */
export const normalizeISODate = (
  value
) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

/**
 * Converts common duration formats to Schema.org ISO 8601 duration.
 *
 * Supported:
 * - PT5M23S
 * - 323 seconds
 * - "323"
 * - HH:MM:SS
 * - MM:SS
 *
 * Invalid values are discarded.
 */
export const normalizeVideoDuration = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  // ---------------------------------------------------------------------
  // Already ISO 8601 duration.
  // ---------------------------------------------------------------------

  if (
    typeof value === "string" &&
    /^PT(?=.+)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?$/i.test(
      value.trim()
    )
  ) {
    return value.trim();
  }

  // ---------------------------------------------------------------------
  // Numeric seconds.
  // ---------------------------------------------------------------------

  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    const totalSeconds =
      Math.round(value);

    const hours =
      Math.floor(totalSeconds / 3600);

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      totalSeconds % 60;

    let result = "PT";

    if (hours > 0) {
      result += `${hours}H`;
    }

    if (minutes > 0) {
      result += `${minutes}M`;
    }

    if (
      seconds > 0 ||
      result === "PT"
    ) {
      result += `${seconds}S`;
    }

    return result;
  }

  const text = String(value).trim();

  // ---------------------------------------------------------------------
  // Numeric string.
  // ---------------------------------------------------------------------

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return normalizeVideoDuration(
      Number(text)
    );
  }

  // ---------------------------------------------------------------------
  // HH:MM:SS or MM:SS.
  // ---------------------------------------------------------------------

  const match = text.match(
    /^(?:(\d{1,2}):)?(\d{1,3}):(\d{2})$/
  );

  if (match) {
    const hours =
      Number(match[1] || 0);

    const minutes =
      Number(match[2] || 0);

    const seconds =
      Number(match[3] || 0);

    if (
      minutes >= 60 ||
      seconds >= 60
    ) {
      return undefined;
    }

    let result = "PT";

    if (hours > 0) {
      result += `${hours}H`;
    }

    if (minutes > 0) {
      result += `${minutes}M`;
    }

    if (
      seconds > 0 ||
      result === "PT"
    ) {
      result += `${seconds}S`;
    }

    return result;
  }

  return undefined;
};

// =======================================================================
// 11B. AUTOMATIC IMAGE SEO
// =======================================================================

/**
 * Generates image SEO metadata directly from:
 *
 *     album_photos[]
 *          +
 *     existing place record
 *          +
 *     image index
 *
 * No image SEO database row is required.
 */
export const buildAutomaticImageSEO = (
  imageUrl,
  index = 0,
  place = {},
  options = {}
) => {
  if (!imageUrl) {
    return null;
  }

  const placeName =
    getMediaSEOPlaceName(place);

  const category =
    getMediaSEOCategory(place);

  const locality =
    getMediaSEOLocality(place);

  const placeSlug =
    getMediaSEOPlaceSlug(place);

  const imageNumber =
    Number(index || 0) + 1;

  // ---------------------------------------------------------------------
  // Existing article / AI metadata
  // ---------------------------------------------------------------------

  const article =
    typeof place?.ai_article === "object" &&
      place.ai_article !== null
      ? place.ai_article
      : {};

  const metrics =
    article?.metrics &&
      typeof article.metrics === "object"
      ? article.metrics
      : {};

  // ---------------------------------------------------------------------
  // Optional existing image metadata
  // ---------------------------------------------------------------------

  const suppliedTitle =
    options?.title ||
    options?.imageTitle ||
    null;

  const suppliedAlt =
    options?.alt ||
    options?.altText ||
    null;

  const suppliedCaption =
    options?.caption ||
    null;

  const suppliedDescription =
    options?.description ||
    null;

  // ---------------------------------------------------------------------
  // Automatic title
  // ---------------------------------------------------------------------

  const title = seoCleanText(
    suppliedTitle ||
    `${placeName} ${category} landscape photo ${imageNumber}`,
    `${placeName} landscape photo ${imageNumber}`
  );

  // ---------------------------------------------------------------------
  // Automatic alt
  // ---------------------------------------------------------------------

  const alt = seoCleanText(
    suppliedAlt ||
    `${placeName}, ${category}, ${locality || "Sri Lanka"
    }, Sri Lanka - landscape photo ${imageNumber}`,
    `${placeName}, Sri Lanka - photo ${imageNumber}`
  );

  // ---------------------------------------------------------------------
  // Automatic caption
  // ---------------------------------------------------------------------

  const caption = seoCleanText(
    suppliedCaption ||
    `${placeName} in ${locality || "Sri Lanka"
    }, Sri Lanka. Field photograph ${imageNumber} documenting the surrounding ${category.toLowerCase()} landscape.`,
    `${placeName} field photograph ${imageNumber}`
  );

  // ---------------------------------------------------------------------
  // Optional elevation context
  // ---------------------------------------------------------------------

  const elevation =
    metrics?.elevation_m !== undefined &&
      metrics?.elevation_m !== null &&
      metrics?.elevation_m !== ""
      ? metrics.elevation_m
      : undefined;

  const elevationText =
    elevation !== undefined
      ? ` Elevation is approximately ${elevation} metres.`
      : "";

  // ---------------------------------------------------------------------
  // Automatic description
  // ---------------------------------------------------------------------

  const description = seoCleanText(
    suppliedDescription ||
    `${caption}${elevationText} This image is part of the My Journal visual field archive for ${placeName}.`,
    caption
  );

  // ---------------------------------------------------------------------
  // Optimized image URL
  // ---------------------------------------------------------------------

  const optimizedUrl =
    getOptimizedUrl(
      imageUrl,
      1200,
      82
    );

  // ---------------------------------------------------------------------
  // Crawlable gallery URL
  // ---------------------------------------------------------------------

  const pageUrl =
    `https://www.myjournalview.com/gallery/${placeSlug}`;

  return {
    url: imageUrl,
    contentUrl: imageUrl,
    optimizedUrl,
    title,
    name: title,
    alt,
    caption,
    description,
    index: imageNumber,
    placeName,
    category,
    locality,
    slug: placeSlug,
    pageUrl,
    latitude:
      place?.latitude ?? undefined,
    longitude:
      place?.longitude ?? undefined,
    elevation
  };
};

// =======================================================================
// 11C. AUTOMATIC IMAGE COLLECTION SEO
// =======================================================================

/**
 * Generates SEO metadata for an entire album_photos[] collection.
 *
 * Used by:
 * - ImageGallery JSON-LD
 * - gallery rendering
 * - image sitemap generation
 * - automatic image metadata
 */
export const buildAutomaticImageCollectionSEO = (
  photos = [],
  place = {}
) => {
  if (!Array.isArray(photos)) {
    return [];
  }

  const uniquePhotos = [
    ...new Set(
      photos
        .filter(Boolean)
        .map((photo) => {
          if (typeof photo === "string") {
            return photo;
          }

          return (
            photo?.url ||
            photo?.src ||
            photo?.image_url ||
            ""
          );
        })
        .filter(Boolean)
    )
  ];

  return uniquePhotos
    .map((url, index) =>
      buildAutomaticImageSEO(
        url,
        index,
        place
      )
    )
    .filter(Boolean);
};

// =======================================================================
// 11D. YOUTUBE URL / ID HELPERS
// =======================================================================

/**
 * Extracts a valid YouTube video ID.
 *
 * Supported:
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/embed/ID
 * - youtube.com/shorts/ID
 * - youtube.com/live/ID
 * - youtube.com/v/ID
 * - youtube-nocookie.com/embed/ID
 * - raw 11-character YouTube IDs
 */
export const getYouTubeId = (
  url
) => {
  if (!url) {
    return null;
  }

  const value =
    String(url).trim();

  if (!value) {
    return null;
  }

  // ---------------------------------------------------------------------
  // Raw 11-character YouTube ID.
  // ---------------------------------------------------------------------

  if (
    /^[A-Za-z0-9_-]{11}$/.test(
      value
    )
  ) {
    return value;
  }

  // ---------------------------------------------------------------------
  // Structured URL parsing.
  // ---------------------------------------------------------------------

  try {
    const parsed = new URL(
      value.includes("://")
        ? value
        : `https://${value}`
    );

    const host =
      parsed.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    // -------------------------------------------------------------------
    // youtu.be/<ID>
    // -------------------------------------------------------------------

    if (host === "youtu.be") {
      const id =
        parsed.pathname
          .split("/")
          .filter(Boolean)[0];

      return /^[A-Za-z0-9_-]{11}$/.test(
        id || ""
      )
        ? id
        : null;
    }

    // -------------------------------------------------------------------
    // youtube.com variants.
    // -------------------------------------------------------------------

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const pathParts =
        parsed.pathname
          .split("/")
          .filter(Boolean);

      // /watch?v=<ID>
      const queryId =
        parsed.searchParams.get("v");

      if (queryId) {
        return /^[A-Za-z0-9_-]{11}$/.test(
          queryId
        )
          ? queryId
          : null;
      }

      // /embed/<ID>
      // /shorts/<ID>
      // /live/<ID>
      // /v/<ID>
      const type =
        pathParts[0]?.toLowerCase();

      if (
        [
          "embed",
          "shorts",
          "live",
          "v"
        ].includes(type)
      ) {
        const id =
          pathParts[1];

        return /^[A-Za-z0-9_-]{11}$/.test(
          id || ""
        )
          ? id
          : null;
      }
    }
  } catch {
    // Fall through to defensive parsing.
  }

  return null;
};

/**
 * Builds a privacy-enhanced YouTube embed URL.
 *
 * Accepts either a raw ID or a YouTube URL.
 */
export const buildYouTubeEmbedUrl = (
  videoIdOrUrl,
  options = {}
) => {
  const youtubeId =
    getYouTubeId(
      videoIdOrUrl
    );

  if (!youtubeId) {
    return null;
  }

  const params =
    new URLSearchParams();

  params.set(
    "rel",
    "0"
  );

  if (options?.autoplay) {
    params.set(
      "autoplay",
      "1"
    );
  }

  if (options?.mute) {
    params.set(
      "mute",
      "1"
    );
  }

  if (options?.controls === false) {
    params.set(
      "controls",
      "0"
    );
  }

  return (
    `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`
  );
};

// =======================================================================
// 11E. AUTOMATIC VIDEO SEO
// =======================================================================

/**
 * Generates SEO metadata directly from an existing hub_videos record.
 *
 * No separate video SEO table is required.
 *
 * If a DB slug exists, it is preserved.
 * If no DB slug exists, an ID suffix is appended to prevent duplicate
 * titles from producing duplicate crawlable URLs.
 */
export const buildAutomaticVideoSEO = (
  video = {},
  index = 0
) => {
  const rawTitle = seoCleanText(
    video?.title ||
    video?.name ||
    (video?.id
      ? `Sri Lanka Backcountry Video ${video.id}`
      : `Sri Lanka Backcountry Video ${Number(index) + 1}`),
    `Sri Lanka Backcountry Video ${Number(index) + 1}`
  );

  // ---------------------------------------------------------------------
  // Stable video slug.
  // ---------------------------------------------------------------------

  const baseVideoSlug =
    generateSlug(rawTitle) ||
    `video-${Number(index) + 1}`;

  const videoSlug =
    generateSlug(video?.id)
      ? `${baseVideoSlug}--${generateSlug(video.id)}`
      : baseVideoSlug;


  // ---------------------------------------------------------------------
  // YouTube ID.
  // ---------------------------------------------------------------------

  const youtubeId =
    video?.youtubeId ||
    getYouTubeId(video?.url);

  // ---------------------------------------------------------------------
  // Thumbnail.
  // ---------------------------------------------------------------------

  const defaultThumbnail = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : "https://www.myjournalview.com/default-video-placeholder.jpg";
  const candidateThumbnail = video?.custom_thumbnail_url || video?.thumbnail_url;
  let thumbnailUrl = defaultThumbnail;
  try {
    const parsedThumbnail = new URL(candidateThumbnail);
    if (["http:", "https:"].includes(parsedThumbnail.protocol)) {
      thumbnailUrl = parsedThumbnail.href;
    }
  } catch {
    // Use the provider thumbnail when a custom URL is invalid.
  }

  // ---------------------------------------------------------------------
  // Upload/publication date.
  // ---------------------------------------------------------------------

  const uploadDate =
    normalizeISODate(
      video?.upload_date ||
      video?.published_at ||
      video?.created_at
    );

  // ---------------------------------------------------------------------
  // Duration.
  // ---------------------------------------------------------------------

  const duration =
    normalizeVideoDuration(
      video?.duration_iso ??
      video?.duration
    );

  // ---------------------------------------------------------------------
  // Description.
  // ---------------------------------------------------------------------

  const description =
    seoCleanText(
      video?.description ||
      video?.meta_description ||
      `Watch ${rawTitle}. A My Journal visual field recording documenting Sri Lanka's backcountry landscapes, trails, terrain and natural attractions.`,
      `Watch ${rawTitle} from My Journal's Sri Lanka backcountry video archive.`
    );

  // ---------------------------------------------------------------------
  // SEO title.
  // ---------------------------------------------------------------------

  const seoTitle =
    /sri\s+lanka/i.test(rawTitle)
      ? rawTitle
      : `${rawTitle} | Sri Lanka Backcountry`;

  // ---------------------------------------------------------------------
  // Privacy-enhanced YouTube embed.
  // ---------------------------------------------------------------------

  const embedUrl =
    video?.embedUrl ||
    (
      youtubeId
        ? buildYouTubeEmbedUrl(
          youtubeId
        )
        : null
    );

  // ---------------------------------------------------------------------
  // Individual crawlable video page.
  // ---------------------------------------------------------------------

  const watchUrl =
    `https://www.myjournalview.com/videos/${videoSlug}`;

  // ---------------------------------------------------------------------
  // Geographic metadata.
  //
  // IMPORTANT:
  // Do not default this to "Sri Lanka". A generic country fallback is
  // appropriate for prose but not for schema.about geographic facts.
  // ---------------------------------------------------------------------

  const locality =
    seoCleanText(
      video?.locality ||
      video?.district ||
      video?.province
    );

  const district =
    seoCleanText(
      video?.district
    );

  const province =
    seoCleanText(
      video?.province
    );

  return {
    ...video,

    seoTitle,

    title:
      rawTitle,

    slug:
      videoSlug,

    seoDescription:
      description,

    thumbnailUrl,

    uploadDate,

    duration,

    youtubeId,

    embedUrl,

    watchUrl,

    channelUrl:
      "https://www.youtube.com/@myjournalview",

    latitude:
      video?.latitude ??
      undefined,

    longitude:
      video?.longitude ??
      undefined,

    locality,

    district,

    province
  };
};

// =======================================================================
// 11F. AUTOMATIC VIDEO COLLECTION SEO
// =======================================================================

/**
 * Generates runtime SEO records for active video records.
 *
 * Duplicate crawlable URLs are removed.
 */
export const buildAutomaticVideoCollectionSEO = (
  videos = []
) => {
  if (!Array.isArray(videos)) {
    return [];
  }

  const seenUrls =
    new Set();

  return videos
    .filter(
      (video) =>
        video &&
        (
          video.url ||
          video.youtubeId ||
          video.embedUrl
        )
    )
    .map(
      (video, index) =>
        buildAutomaticVideoSEO(
          video,
          index
        )
    )
    .filter((video) => {
      if (!video?.watchUrl) {
        return false;
      }

      if (
        seenUrls.has(
          video.watchUrl
        )
      ) {
        return false;
      }

      seenUrls.add(
        video.watchUrl
      );

      return true;
    });
};

// =======================================================================
// 11G. AUTOMATIC VIDEOOBJECT JSON-LD
// =======================================================================

/**
 * Creates a Schema.org VideoObject from an existing hub_videos record.
 *
 * Only supplied or safely derived facts are emitted.
 *
 * Geographic metadata is included only when the source record provides
 * an actual locality or valid coordinates.
 */
export const buildVideoObjectSchema = (
  video = {},
  index = 0
) => {
  const seo =
    buildAutomaticVideoSEO(
      video,
      index
    );

  const schema = {
    "@context":
      "https://schema.org",

    "@type":
      "VideoObject",

    "@id":
      `${seo.watchUrl}#video`,

    name:
      seo.seoTitle ||
      seo.title ||
      "My Journal Video",

    description:
      seo.seoDescription ||
      "Sri Lanka backcountry video from My Journal.",

    thumbnailUrl:
      seo.thumbnailUrl,

    url:
      seo.watchUrl,

    ...(seo.embedUrl
      ? {
        embedUrl:
          seo.embedUrl
      }
      : {}),

    ...(seo.uploadDate
      ? {
        uploadDate:
          seo.uploadDate
      }
      : {}),

    publisher: {
      "@type":
        "Organization",

      name:
        "My Journal",

      url:
        "https://www.myjournalview.com",

      logo: {
        "@type":
          "ImageObject",

        url:
          "https://www.myjournalview.com/my-journal-logo.png"
      }
    },

    creator: {
      "@type":
        "Organization",

      name:
        "My Journal",

      url:
        "https://www.myjournalview.com"
    },

    inLanguage:
      "en",

    isFamilyFriendly:
      true
  };

  // ---------------------------------------------------------------------
  // Duration.
  // ---------------------------------------------------------------------

  if (seo.duration) {
    schema.duration =
      seo.duration;
  }

  // ---------------------------------------------------------------------
  // Geographic information.
  // ---------------------------------------------------------------------

  const latitude =
    Number(seo.latitude);

  const longitude =
    Number(seo.longitude);

  const hasCoordinates =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const locality =
    typeof seo.locality === "string" &&
      seo.locality.trim()
      ? seo.locality.trim()
      : null;

  const district =
    typeof seo.district === "string" &&
      seo.district.trim()
      ? seo.district.trim()
      : null;

  const province =
    typeof seo.province === "string" &&
      seo.province.trim()
      ? seo.province.trim()
      : null;

  const placeName =
    locality ||
    district ||
    province;

  /**
   * Only emit schema.about when there is an actual geographic fact
   * associated with the video.
   *
   * Do NOT fall back to "Sri Lanka" here because that would imply that
   * Sri Lanka itself is the video's specific geographic subject.
   */
  if (
    placeName ||
    hasCoordinates
  ) {
    schema.about = {
      "@type":
        "Place",

      ...(placeName
        ? {
          name:
            placeName
        }
        : {}),

      ...(hasCoordinates
        ? {
          geo: {
            "@type":
              "GeoCoordinates",

            latitude,

            longitude
          }
        }
        : {})
    };
  }

  return schema;
};

// =======================================================================
// 11H. AUTOMATIC VIDEO COLLECTION JSON-LD
// =======================================================================

/**
 * Creates CollectionPage + ItemList structured data for /videos.
 *
 * Schema.org does not require a non-standard "VideoGallery" type.
 * CollectionPage + ItemList + VideoObject is the safer structure.
 */
export const buildVideoCollectionSchema = (
  videos = [],
  canonicalUrl =
    "https://www.myjournalview.com/videos"
) => {
  const automaticVideos =
    buildAutomaticVideoCollectionSEO(
      videos
    );

  const itemListElement =
    automaticVideos.map(
      (video, index) => ({
        "@type":
          "ListItem",

        position:
          index + 1,

        url:
          video.watchUrl,

        item:
          buildVideoObjectSchema(
            video,
            index
          )
      })
    );

  return {
    "@context":
      "https://schema.org",

    "@type":
      "CollectionPage",

    "@id":
      `${canonicalUrl}#video-gallery`,

    url:
      canonicalUrl,

    name:
      "Sri Lanka Backcountry Video Journal | My Journal",

    description:
      "Watch aerial drone perspectives, backcountry video journals, terrain footage, trails, waterfalls and natural landscapes across Sri Lanka.",

    isPartOf: {
      "@type":
        "WebSite",

      "@id":
        "https://www.myjournalview.com/#website",

      name:
        "My Journal",

      url:
        "https://www.myjournalview.com"
    },

    mainEntity: {
      "@type":
        "ItemList",

      "@id":
        `${canonicalUrl}#video-list`,

      numberOfItems:
        itemListElement.length,

      itemListElement
    }
  };
};

// =======================================================================
// 11I. AUTOMATIC MEDIA SITEMAP URL HELPERS
// =======================================================================

/**
 * Canonical gallery URL for a place.
 *
 * Used by the server-side image sitemap.
 */
export const getAutomaticGallerySEOUrl = (
  place = {}
) => {
  return (
    `https://www.myjournalview.com/gallery/` +
    getMediaSEOPlaceSlug(place)
  );
};

/**
 * Canonical video URL for a video.
 *
 * Uses exactly the same slug logic as buildAutomaticVideoSEO().
 */
export const getAutomaticVideoSEOUrl = (
  video = {},
  index = 0
) => {
  return buildAutomaticVideoSEO(
    video,
    index
  ).watchUrl;
};
// =======================================================================
// 12. CONSOLIDATED SEO & SCHEMA MANAGERS
// =======================================================================

/**
 * Centralized JSON-LD injector.
 *
 * Supported states:
 *
 * - WebSite
 * - TouristAttraction
 * - ImageGallery
 * - VideoObject
 * - Video CollectionPage + ItemList
 *
 * This function only manages the JSON-LD script in <head>.
 * Document title, meta tags, canonical URLs, OpenGraph and Twitter
 * metadata are managed by updateSEO() below.
 */
export const injectJSONLDSchema = (
  place = null,
  canonicalUrl = "",
  options = {}
) => {
  const {
    isGallery = false,
    isVideo = false,
    isVideoGallery = false,
    photos = [],
    galleryVideos = [],
    video = null,
    videoIndex = 0
  } = options;

  if (
    typeof document === "undefined"
  ) {
    return;
  }

  // ---------------------------------------------------------------------
  // 12.1 Locate / create JSON-LD script
  // ---------------------------------------------------------------------

  let schemaScript =
    document.getElementById(
      "json-ld-schema"
    );

  if (!schemaScript) {
    schemaScript =
      document.createElement(
        "script"
      );

    schemaScript.id =
      "json-ld-schema";

    schemaScript.setAttribute(
      "type",
      "application/ld+json"
    );

    document.head.appendChild(
      schemaScript
    );
  }

  // ---------------------------------------------------------------------
  // 12.2 Base URL
  // ---------------------------------------------------------------------

  const BASE_URL = (
    import.meta.env.VITE_SITE_URL ||
    "https://www.myjournalview.com"
  ).replace(
    /\/+$/,
    ""
  );

  // ---------------------------------------------------------------------
  // 12.3 Safe JSON-LD serializer
  // ---------------------------------------------------------------------

  const writeSchema = (
    schema
  ) => {
    if (!schema) {
      schemaScript.textContent =
        "";
      return;
    }

    const safeJson =
      JSON.stringify(
        schema
      ).replace(
        /</g,
        "\\u003c"
      );

    schemaScript.textContent =
      safeJson;
  };

  // ---------------------------------------------------------------------
  // 12.4 Individual VideoObject
  // ---------------------------------------------------------------------

  if (
    isVideo &&
    video &&
    typeof video === "object"
  ) {
    const videoSchema =
      buildVideoObjectSchema(
        video,
        videoIndex
      );

    writeSchema(
      videoSchema
    );

    return;
  }

  // ---------------------------------------------------------------------
  // 12.5 Video collection
  // ---------------------------------------------------------------------

  if (
    isVideoGallery
  ) {
    const videoCollectionSchema =
      buildVideoCollectionSchema(
        galleryVideos,
        canonicalUrl ||
        `${BASE_URL}/videos`
      );

    writeSchema(
      videoCollectionSchema
    );

    return;
  }

  // ---------------------------------------------------------------------
  // 12.6 Default WebSite schema
  // ---------------------------------------------------------------------

  if (
    !place ||
    typeof place !== "object" ||
    !place.place_name
  ) {
    const defaultSchema = {
      "@context":
        "https://schema.org",

      "@type":
        "WebSite",

      "@id":
        `${BASE_URL}/#website`,

      name:
        "My Journal",

      url:
        canonicalUrl ||
        BASE_URL,

      description:
        "Explore remote Sri Lankan trails, hidden waterfalls, video journals, photo galleries, travel articles, and backcountry coordinates.",

      abstract:
        "විදිමු , රැකගමු අනාගතය වෙනුවෙන්. Live with care, preserve with love — for the future yet to come.",

      publisher: {
        "@type":
          "Organization",

        name:
          "My Journal",

        url:
          BASE_URL,

        logo: {
          "@type":
            "ImageObject",

          url:
            `${BASE_URL}/my-journal-logo.png`
        }
      },

      sameAs: [
        "https://www.youtube.com/@myjournalview"
      ],

      inLanguage:
        "en"
    };

    writeSchema(
      defaultSchema
    );

    return;
  }

  // ---------------------------------------------------------------------
  // 12.7 Existing article JSONB
  // ---------------------------------------------------------------------

  const article =
    typeof place.ai_article === "object" &&
      place.ai_article !== null
      ? place.ai_article
      : {};

  const legacyStory =
    typeof place.ai_article === "string"
      ? place.ai_article
      : null;

  const metrics =
    article?.metrics &&
      typeof article.metrics === "object"
      ? article.metrics
      : {};

  const about =
    article?.about &&
      typeof article.about === "object"
      ? article.about
      : {};

  const placeName =
    getMediaSEOPlaceName(
      place
    );

  const category =
    getMediaSEOCategory(
      place
    );

  const locality =
    getMediaSEOLocality(
      place
    );

  // ---------------------------------------------------------------------
  // 12.8 Place description
  // ---------------------------------------------------------------------

  const placeDescription =
    seoCleanText(
      about?.overview ||
      article?.story ||
      legacyStory ||
      place.description ||
      (
        locality
          ? `Explore ${placeName} in ${locality}.`
          : `Explore ${placeName} in Sri Lanka.`
      ),
      locality
        ? `Explore ${placeName} in ${locality}.`
        : `Explore ${placeName} in Sri Lanka.`
    );

  // ---------------------------------------------------------------------
  // 12.9 Image Gallery schema
  // ---------------------------------------------------------------------

  if (isGallery) {
    const photosList =
      Array.isArray(photos) &&
        photos.length > 0
        ? photos
        : (
          Array.isArray(
            place.album_photos
          )
            ? place.album_photos
            : (
              Array.isArray(
                place.photos
              )
                ? place.photos
                : []
            )
        );

    const automaticImages =
      buildAutomaticImageCollectionSEO(
        photosList,
        place
      );

    const galleryDescription =
      seoCleanText(
        locality
          ? `High-resolution photo gallery and aerial drone perspectives of ${placeName}, a ${category} in ${locality}, Sri Lanka. Dedicated visual field notes and landscape photography.`
          : `High-resolution photo gallery and aerial drone perspectives of ${placeName}, a ${category} in Sri Lanka. Dedicated visual field notes and landscape photography.`,
        `Photo gallery of ${placeName}, Sri Lanka.`
      );

    const gallerySchema = {
      "@context":
        "https://schema.org",

      "@type":
        "ImageGallery",

      "@id":
        `${canonicalUrl}#gallery`,

      name:
        `${placeName} High-Resolution Photo Gallery & Aerial Perspectives`,

      description:
        galleryDescription,

      url:
        canonicalUrl,

      isPartOf: {
        "@type":
          "WebSite",

        name:
          "My Journal",

        url:
          BASE_URL
      },

      primaryImageOfPage:
        place.cover_photo_url ||
        `${BASE_URL}/my-journal-logo.png`,

      image:
        automaticImages.map(
          (image) => {
            const latitude =
              Number(
                image.latitude
              );

            const longitude =
              Number(
                image.longitude
              );

            const hasCoordinates =
              Number.isFinite(
                latitude
              ) &&
              Number.isFinite(
                longitude
              );

            return {
              "@type":
                "ImageObject",

              "@id":
                `${image.url}#image`,

              url:
                image.optimizedUrl ||
                image.url,

              contentUrl:
                image.contentUrl ||
                image.url,

              name:
                image.name ||
                image.title,

              caption:
                image.caption,

              description:
                image.description,

              representativeOfPage:
                image.index === 1,

              inLanguage:
                "en",

              ...(hasCoordinates
                ? {
                  contentLocation: {
                    "@type":
                      "Place",

                    ...(image.placeName
                      ? {
                        name:
                          image.placeName
                      }
                      : {}),

                    geo: {
                      "@type":
                        "GeoCoordinates",

                      latitude,

                      longitude
                    }
                  }
                }
                : {})
            };
          }
        ),

      about: {
        "@type":
          "TouristAttraction",

        name:
          placeName,

        ...(locality
          ? {
            address: {
              "@type":
                "PostalAddress",

              addressLocality:
                locality,

              addressCountry:
                "LK"
            }
          }
          : {}),

        ...(Number.isFinite(
          Number(place.latitude)
        ) &&
          Number.isFinite(
            Number(place.longitude)
          )
          ? {
            geo: {
              "@type":
                "GeoCoordinates",

              latitude:
                Number(
                  place.latitude
                ),

              longitude:
                Number(
                  place.longitude
                )
            }
          }
          : {})
      }
    };

    writeSchema(
      gallerySchema
    );

    return;
  }

  // ---------------------------------------------------------------------
  // 12.10 TouristAttraction schema
  // ---------------------------------------------------------------------

  const additionalProperty = [];

  if (
    metrics?.difficulty_level
  ) {
    additionalProperty.push({
      "@type":
        "PropertyValue",

      name:
        "Trail Difficulty",

      value:
        metrics.difficulty_level
    });
  }

  if (
    metrics?.trek_distance_km !==
    undefined &&
    metrics?.trek_distance_km !==
    null &&
    metrics?.trek_distance_km !==
    ""
  ) {
    additionalProperty.push({
      "@type":
        "PropertyValue",

      name:
        "Trek Distance",

      value:
        `${metrics.trek_distance_km} km`
    });
  }

  if (
    metrics?.estimated_time_mins !==
    undefined &&
    metrics?.estimated_time_mins !==
    null &&
    metrics?.estimated_time_mins !==
    ""
  ) {
    additionalProperty.push({
      "@type":
        "PropertyValue",

      name:
        "Estimated Time",

      value:
        `${metrics.estimated_time_mins} mins`
    });
  }

  if (
    metrics?.elevation_m !==
    undefined &&
    metrics?.elevation_m !==
    null &&
    metrics?.elevation_m !==
    ""
  ) {
    additionalProperty.push({
      "@type":
        "PropertyValue",

      name:
        "Elevation",

      value:
        `${metrics.elevation_m} m`
    });
  }

  const latitude =
    Number(
      place.latitude
    );

  const longitude =
    Number(
      place.longitude
    );

  const hasCoordinates =
    Number.isFinite(
      latitude
    ) &&
    Number.isFinite(
      longitude
    );

  const touristSchema = {
    "@context":
      "https://schema.org",

    "@type":
      "TouristAttraction",

    "@id":
      `${canonicalUrl}#place`,

    name:
      placeName,

    description:
      placeDescription,

    url:
      canonicalUrl,

    image:
      place.cover_photo_url ||
      `${BASE_URL}/my-journal-logo.png`,

    isPartOf: {
      "@type":
        "WebSite",

      name:
        "My Journal",

      url:
        BASE_URL
    },

    location: {
      "@type":
        "Place",

      ...(locality
        ? {
          name:
            locality,

          address: {
            "@type":
              "PostalAddress",

            addressLocality:
              locality,

            addressCountry:
              "LK"
          }
        }
        : {}),

      ...(hasCoordinates
        ? {
          geo: {
            "@type":
              "GeoCoordinates",

            latitude,

            longitude
          }
        }
        : {}),

      ...(metrics?.elevation_m !==
        undefined &&
        metrics?.elevation_m !==
        null &&
        metrics?.elevation_m !==
        ""
        ? {
          elevation:
            `${metrics.elevation_m} m`
        }
        : {})
    },

    ...(additionalProperty.length > 0
      ? {
        additionalProperty
      }
      : {})
  };

  writeSchema(
    touristSchema
  );
};

// =======================================================================
// 12A. CONSOLIDATED DOCUMENT SEO MANAGER
// =======================================================================

/**
 * Centralized SEO manager for My Journal.
 *
 * Handles:
 *
 * - document title
 * - meta description
 * - robots
 * - canonical URL
 * - OpenGraph
 * - Twitter cards
 * - image gallery SEO
 * - video SEO
 * - video collection SEO
 * - category SEO
 * - search SEO
 * - 404/noindex
 * - JSON-LD
 *
 * IMPORTANT:
 * This is the single document-level SEO owner for application routes.
 *
 * Presentation components such as PhotoGallery, VideoGallery and
 * VideoDetailPage must NOT call updateSEO() themselves.
 */
export const updateSEO = (
  place = null,
  options = {}
) => {
  const normalizedOptions =
    typeof options === "boolean"
      ? {
        isGallery:
          options
      }
      : (
        options &&
          typeof options === "object"
          ? options
          : {}
      );

  const {
    isGallery = false,
    isVideoGallery = false,
    isVideo = false,
    video = null,
    videoIndex = 0,
    galleryPhotos = [],
    galleryVideos = [],
    category = "All",
    searchTerm = "",
    categoryDescriptions = {},
    isNotFound = false,
    isLoading = false
  } = normalizedOptions;

  // ---------------------------------------------------------------------
  // 12A.1 Base URL
  // ---------------------------------------------------------------------

  const BASE_URL = (
    import.meta.env.VITE_SITE_URL ||
    "https://www.myjournalview.com"
  ).replace(
    /\/+$/,
    ""
  );

  const DEFAULT_LOGO =
    `${BASE_URL}/my-journal-logo.png`;

  const BRAND_SUFFIX =
    " | My Journal";

  // ---------------------------------------------------------------------
  // 12A.2 Defaults
  // ---------------------------------------------------------------------

  const PERMANENT_DEFAULT_TITLE =
    "Sri Lanka Backcountry Travel Guide | My Journal";

  const PERMANENT_DEFAULT_OG_TITLE =
    "Sri Lanka Backcountry Travel Guide: Maps, Trails & Media";

  const PERMANENT_DEFAULT_DESC =
    "Explore Sri Lanka's backcountry trails, hidden waterfalls, aerial drone video journals, field notes, and GPS map routes captured by drone and iPhone.";

  let title =
    PERMANENT_DEFAULT_TITLE;

  let ogTitle =
    PERMANENT_DEFAULT_OG_TITLE;

  let description =
    PERMANENT_DEFAULT_DESC;

  let rawCanonicalUrl =
    `${BASE_URL}/`;

  let imageUrl =
    DEFAULT_LOGO;

  let isNoIndex =
    false;

  // ---------------------------------------------------------------------
  // 12A.3 Valid place
  // ---------------------------------------------------------------------

  const hasPlace =
    Boolean(
      place &&
      typeof place === "object" &&
      place.place_name
    );

  // ---------------------------------------------------------------------
  // 12A.4 404 / not found
  // ---------------------------------------------------------------------

  if (
    isNotFound &&
    !isLoading
  ) {
    title =
      `Page Not Found${BRAND_SUFFIX}`;

    ogTitle =
      "404 - Page Not Found";

    description =
      "The requested location, gallery, video, or resource could not be found on My Journal.";

    isNoIndex =
      true;
  }

  // ---------------------------------------------------------------------
  // 12A.5 Individual video
  // ---------------------------------------------------------------------

  else if (
    isVideo &&
    video &&
    typeof video === "object"
  ) {
    const automaticVideo =
      buildAutomaticVideoSEO(
        video,
        videoIndex
      );

    const videoTitle =
      automaticVideo?.title ||
      video?.title ||
      "Sri Lanka Backcountry Video";

    const videoDescription =
      automaticVideo?.seoDescription ||
      video?.description ||
      `Watch ${videoTitle} from My Journal's Sri Lanka backcountry video archive.`;

    title =
      `${videoTitle}${BRAND_SUFFIX}`;

    ogTitle =
      automaticVideo?.seoTitle ||
      videoTitle;

    description =
      truncateText(
        videoDescription,
        155
      );

    rawCanonicalUrl =
      automaticVideo?.watchUrl ||
      `${BASE_URL}/videos/${generateSlug(
        videoTitle
      )}`;

    imageUrl =
      automaticVideo?.thumbnailUrl ||
      DEFAULT_LOGO;
  }

  // ---------------------------------------------------------------------
  // 12A.6 Video gallery / collection
  // ---------------------------------------------------------------------

  else if (
    isVideoGallery
  ) {
    title =
      `Aerial & Video Journal${BRAND_SUFFIX}`;

    ogTitle =
      "Sri Lanka Backcountry Video Journal & Aerial Drone Clips";

    description =
      "Watch aerial drone perspectives, high-resolution video logs, and backcountry terrain footage across Sri Lanka.";

    rawCanonicalUrl =
      `${BASE_URL}/videos`;

    imageUrl =
      DEFAULT_LOGO;
  }

  // ---------------------------------------------------------------------
  // 12A.7 Place / gallery
  // ---------------------------------------------------------------------

  else if (
    hasPlace
  ) {
    const placeName =
      seoCleanText(
        place.place_name
      );

    const categoryName =
      seoCleanText(
        place.category,
        "Attraction"
      );

    const localityValue =
      seoCleanText(
        place.locality
      );

    const localityName =
      localityValue
        ? `, ${localityValue}`
        : "";

    const slug =
      getMediaSEOPlaceSlug(
        place
      );

    // -------------------------------------------------------------------
    // 12A.7.1 Gallery
    // -------------------------------------------------------------------

    if (isGallery) {
      title =
        `${placeName} Photos (${categoryName})${BRAND_SUFFIX}`;

      ogTitle =
        `${placeName} - Aerial Drone & Field Photos`;

      description =
        `Visual field notes, terrain photos, and high-resolution aerial drone photography of ${placeName}${localityName}, Sri Lanka.`;

      rawCanonicalUrl =
        `${BASE_URL}/gallery/${slug}`;
    }

    // -------------------------------------------------------------------
    // 12A.7.2 Place
    // -------------------------------------------------------------------

    else {
      title =
        `${placeName} (${categoryName}) Guide${BRAND_SUFFIX}`;

      ogTitle =
        `${placeName} Trail Guide: GPS Maps & Field Notes`;

      const article =
        typeof place.ai_article === "object" &&
          place.ai_article !== null
          ? place.ai_article
          : {};

      const rawStory =
        article?.story ||
        (
          typeof place.ai_article ===
            "string"
            ? place.ai_article
            : null
        ) ||
        place.description;

      if (rawStory) {
        description =
          truncateText(
            seoCleanText(
              rawStory
            ),
            155
          );
      } else {
        description =
          `Backcountry guide for ${placeName}${localityName}, Sri Lanka. Features mapped GPS coordinates, route paths, terrain telemetry, and photos.`;
      }

      rawCanonicalUrl =
        `${BASE_URL}/place/${slug}`;
    }

    // -------------------------------------------------------------------
    // 12A.7.3 Social image
    // -------------------------------------------------------------------

    if (
      place.cover_photo_url
    ) {
      imageUrl =
        getOptimizedUrl(
          place.cover_photo_url,
          1200,
          82
        );
    }
  }

  // ---------------------------------------------------------------------
  // 12A.8 Category
  // ---------------------------------------------------------------------

  else if (
    category &&
    category !== "All"
  ) {
    const cleanCategory =
      seoCleanText(
        category,
        "Travel"
      );

    title =
      `${cleanCategory} Travel Guide & Maps${BRAND_SUFFIX}`;

    ogTitle =
      `Explore Top ${cleanCategory} Locations in Sri Lanka`;

    const catDesc =
      categoryDescriptions?.[
      category
      ];

    description =
      catDesc
        ? truncateText(
          seoCleanText(
            catDesc
          ),
          155
        )
        : `Explore mapped ${cleanCategory.toLowerCase()} destinations in Sri Lanka with field notes, coordinates, and photo guides.`;

    rawCanonicalUrl =
      `${BASE_URL}/?category=${encodeURIComponent(
        cleanCategory.toLowerCase()
      )}`;
  }

  // ---------------------------------------------------------------------
  // 12A.9 Search
  // ---------------------------------------------------------------------

  else if (
    searchTerm
  ) {
    const cleanSearch =
      seoCleanText(
        searchTerm
      );

    title =
      `Search: ${cleanSearch}${BRAND_SUFFIX}`;

    ogTitle =
      `Search Results for "${cleanSearch}"`;

    description =
      `Explore mapped locations, trails, and field notes matching "${cleanSearch}" on My Journal.`;
  }

  // ---------------------------------------------------------------------
  // 12A.10 Canonical URL normalization
  // ---------------------------------------------------------------------

  let canonicalUrl;

  try {
    const cleanUrl =
      new URL(
        rawCanonicalUrl
      );

    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid"
    ].forEach(
      (parameter) => {
        cleanUrl.searchParams.delete(
          parameter
        );
      }
    );

    canonicalUrl =
      cleanUrl
        .toString()
        .replace(
          /\/+$/,
          ""
        );

    // Preserve root slash.
    if (
      cleanUrl.pathname === "/"
    ) {
      canonicalUrl =
        `${cleanUrl.origin}/`;
    }
  } catch {
    canonicalUrl =
      rawCanonicalUrl;
  }

  // ---------------------------------------------------------------------
  // 12A.11 Clean metadata
  // ---------------------------------------------------------------------

  description =
    truncateText(
      seoCleanText(
        description
      ),
      155
    );

  ogTitle =
    seoCleanText(
      ogTitle,
      title
    );

  // ---------------------------------------------------------------------
  // 12A.12 Title length control
  // ---------------------------------------------------------------------

  if (
    title.length > 60
  ) {
    const brandIndex =
      title.indexOf(
        BRAND_SUFFIX
      );

    if (
      brandIndex > 0
    ) {
      const coreTitle =
        title.substring(
          0,
          brandIndex
        );

      const maxCoreLength =
        60 -
        BRAND_SUFFIX.length;

      let cleanCore =
        coreTitle.slice(
          0,
          maxCoreLength
        );

      cleanCore =
        cleanCore
          .replace(
            /\s+\S+$/,
            ""
          )
          .trim();

      title =
        `${cleanCore}${BRAND_SUFFIX}`;
    } else {
      title =
        title
          .slice(
            0,
            60
          )
          .replace(
            /\s+\S+$/,
            ""
          )
          .trim();
    }
  }

  // ---------------------------------------------------------------------
  // 12A.13 Document title
  // ---------------------------------------------------------------------

  if (
    typeof document !== "undefined"
  ) {
    document.title =
      title;
  }

  // ---------------------------------------------------------------------
  // 12A.14 Canonical link
  // ---------------------------------------------------------------------

  if (
    typeof document !== "undefined"
  ) {
    let canonicalEl =
      document.querySelector(
        'link[rel="canonical"]'
      );

    if (!canonicalEl) {
      canonicalEl =
        document.createElement(
          "link"
        );

      canonicalEl.setAttribute(
        "rel",
        "canonical"
      );

      document.head.appendChild(
        canonicalEl
      );
    }

    canonicalEl.setAttribute(
      "href",
      canonicalUrl
    );
  }

  // ---------------------------------------------------------------------
  // 12A.15 Meta / OpenGraph / Twitter
  // ---------------------------------------------------------------------

  if (
    typeof document !== "undefined"
  ) {
    const metaTags = {
      "fb:app_id":
        "966242223397117",

      robots:
        isNoIndex
          ? "noindex, follow"
          : "index, follow, max-image-preview:large",

      description:
        description,

      "og:title":
        ogTitle,

      "og:description":
        description,

      "og:image":
        imageUrl,

      "og:url":
        canonicalUrl,

      "og:type":
        isVideo
          ? "video.other"
          : (
            hasPlace
              ? "article"
              : "website"
          ),

      "og:site_name":
        "My Journal",

      "og:locale":
        "en_US",

      "twitter:card":
        "summary_large_image",

      "twitter:title":
        ogTitle,

      "twitter:description":
        description,

      "twitter:image":
        imageUrl
    };

    Object.entries(
      metaTags
    ).forEach(
      ([key, content]) => {
        const isProperty =
          key.startsWith("og:") ||
          key.startsWith("fb:");

        const selector =
          isProperty
            ? `meta[property="${key}"]`
            : `meta[name="${key}"]`;

        let el =
          document.querySelector(
            selector
          );

        if (!el) {
          el =
            document.createElement(
              "meta"
            );

          el.setAttribute(
            isProperty
              ? "property"
              : "name",
            key
          );

          document.head.appendChild(
            el
          );
        }

        el.setAttribute(
          "content",
          content || ""
        );
      }
    );

    // -------------------------------------------------------------------
    // 12A.16 Remove stale video OpenGraph tags
    // -------------------------------------------------------------------

    const existingVideoTags =
      document.querySelectorAll(
        'meta[data-myjournal-video-meta="true"]'
      );

    existingVideoTags.forEach(
      (el) => el.remove()
    );

    // -------------------------------------------------------------------
    // 12A.17 Video-specific OpenGraph tags
    // -------------------------------------------------------------------

    if (
      isVideo &&
      video &&
      typeof video === "object"
    ) {
      const automaticVideo =
        buildAutomaticVideoSEO(
          video,
          videoIndex
        );

      const videoMeta = {
        "og:video":
          automaticVideo?.embedUrl,

        "og:video:type":
          "text/html",

        "og:video:secure_url":
          automaticVideo?.embedUrl,

        "og:video:width":
          "1280",

        "og:video:height":
          "720"
      };

      Object.entries(
        videoMeta
      ).forEach(
        ([key, content]) => {
          if (!content) {
            return;
          }

          const el =
            document.createElement(
              "meta"
            );

          el.setAttribute(
            "property",
            key
          );

          el.setAttribute(
            "content",
            content
          );

          el.setAttribute(
            "data-myjournal-video-meta",
            "true"
          );

          document.head.appendChild(
            el
          );
        }
      );
    }
  }

  // ---------------------------------------------------------------------
  // 12A.18 JSON-LD
  // ---------------------------------------------------------------------

  if (
    !isNoIndex &&
    typeof injectJSONLDSchema ===
    "function"
  ) {
    injectJSONLDSchema(
      place,
      canonicalUrl,
      {
        isGallery,

        isVideo,

        isVideoGallery,

        photos:
          galleryPhotos,

        galleryVideos,

        video,

        videoIndex
      }
    );
  } else if (
    typeof document !== "undefined"
  ) {
    const schemaScript =
      document.getElementById(
        "json-ld-schema"
      );

    if (schemaScript) {
      schemaScript.remove();
    }
  }

  // ---------------------------------------------------------------------
  // 12A.19 Return SEO state
  // ---------------------------------------------------------------------

  return {
    title,

    ogTitle,

    description,

    canonicalUrl,

    imageUrl,

    isNoIndex,

    isGallery,

    isVideo,

    isVideoGallery
  };
};

// =======================================================================
// 13. TELEMETRY, ANALYTICS & GEOLOCATION
// =======================================================================

/**
 * Initializes Microsoft Clarity analytics tracker.
 */
export const initClarity = () => {
  if (
    typeof window === 'undefined' ||
    document.getElementById('dynamic-clarity')
  ) {
    return;
  }

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };

    t = l.createElement(r);
    t.id = 'dynamic-clarity';
    t.async = 1;
    t.src = `https://www.clarity.ms/tag/${i}?ref=bwt`;

    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(
    window,
    document,
    'clarity',
    'script',
    'wogn225m7r'
  );
};

/**
 * Invokes the Supabase telemetry Edge Function.
 *
 * IMPORTANT:
 * Do not perform IP/geolocation lookups from the browser.
 * The track-visit Edge Function is the single server-side telemetry
 * endpoint and is responsible for obtaining the request IP and any
 * server-side geolocation metadata required by the event.
 *
 * Supported event types:
 *   - visit
 *   - like
 *   - unlike
 *   - share
 *   - comment
 *
 * The Edge Function should return the appropriate event result.
 */
export const invokeInteractionEvent = async (
  eventType,
  payload = {}
) => {
  if (!supabaseClient) {
    throw new Error('Supabase client is unavailable.');
  }

  if (typeof window === 'undefined') {
    throw new Error('Telemetry requires a browser environment.');
  }

  const { data, error } =
    await supabaseClient.functions.invoke(
      'track-visit',
      {
        body: {
          event_type: eventType,
          page_path: window.location.pathname || '/',
          user_agent: navigator.userAgent || '',
          referrer: document.referrer
            ? document.referrer.toLowerCase()
            : '',
          is_webdriver: Boolean(navigator.webdriver),
          ...payload,
        },
      }
    );

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Logs a page visit through the Supabase backend tracking function.
 *
 * IP address and visitor geolocation are intentionally NOT obtained
 * in the browser. The track-visit Edge Function handles those values
 * server-side from the incoming request.
 */
export const logVisit = async (path = null) => {
  // -------------------------------------------------------------------
  // 1. Localhost / development exclusion
  // -------------------------------------------------------------------

  if (typeof window === 'undefined') {
    return;
  }

  const host = window.location.hostname;

  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '192.168.8.176'
  ) {
    return;
  }

  // -------------------------------------------------------------------
  // 2. Owner mode bypass
  // -------------------------------------------------------------------

  const urlParams = new URLSearchParams(
    window.location.search
  );

  if (urlParams.get('mode') === 'owner') {
    localStorage.setItem(
      'owner_auth_token',
      'owner'
    );
  }

  if (
    localStorage.getItem('owner_auth_token') === 'owner' ||
    !supabaseClient
  ) {
    return;
  }

  // -------------------------------------------------------------------
  // 3. Safe URL decoding helper
  // -------------------------------------------------------------------

  const safeDecode = (value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  // -------------------------------------------------------------------
  // 4. Extract QR / UTM parameters and normalize route
  // -------------------------------------------------------------------

  const utmSource = (
    urlParams.get('utm_source') || ''
  ).toLowerCase();

  const rawPath =
    path || window.location.pathname || '/';

  const trimmedPath = String(rawPath).trim();

  const normalizedPath = trimmedPath.startsWith('/')
    ? trimmedPath
    : `/${trimmedPath}`;

  const lowerPath =
    normalizedPath.toLowerCase();

  let loggingPath = null;

  // Main page
  if (
    lowerPath === '/' ||
    lowerPath === '/main page' ||
    lowerPath === ''
  ) {
    loggingPath = 'Main Page';

    // Video routes
  } else if (
    lowerPath === '/video gallery' ||
    lowerPath === '/video hub' ||
    lowerPath === '/videos' ||
    lowerPath.startsWith('/videos/') ||
    lowerPath === '/video-gallery' ||
    lowerPath.startsWith('/video-gallery/')
  ) {
    loggingPath = 'Video Hub';

    // Add / suggest functions
  } else if (
    lowerPath === '/add function' ||
    lowerPath === '/add'
  ) {
    loggingPath = 'Add Function';

  } else if (
    lowerPath === '/suggest-spot' ||
    lowerPath === '/suggest spot'
  ) {
    loggingPath = 'Suggest Spot';

    // Plan function
  } else if (
    lowerPath === '/plan function' ||
    lowerPath === '/plan' ||
    lowerPath === '/route-planner'
  ) {
    loggingPath = 'Plan Function';

    // Place detail
  } else if (
    /^\/place\/[^/]+\/?$/i.test(normalizedPath)
  ) {
    const slug = normalizedPath
      .slice('/place/'.length)
      .split('?')[0]
      .replace(/\/+$/, '');

    const formattedSlug = safeDecode(slug)
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/-/g, ' ');

    loggingPath = `place/${formattedSlug}`;

    // Photo gallery
  } else if (
    /^\/gallery\/[^/]+\/?$/i.test(normalizedPath)
  ) {
    const slug = normalizedPath
      .slice('/gallery/'.length)
      .split('?')[0]
      .replace(/\/+$/, '');

    const formattedSlug = safeDecode(slug)
      .toLowerCase()
      .trim()
      .replace(/['’]/g, '')
      .replace(/-/g, ' ');

    loggingPath = `gallery/${formattedSlug}`;

  }

  // Only record the public page types that are useful visit metrics.
  // Unknown routes (such as legal pages) are intentionally
  // excluded instead of being added as arbitrary page_visit rows.
  if (!loggingPath) {
    return;
  }

  // Send one event for each explicit page opening. The owning route/view
  // effects guard against duplicate triggers; a time-based key here would
  // incorrectly hide a fast but legitimate revisit to the same feature.

  try {
    await invokeInteractionEvent(
      'visit',
      {
        page_path: loggingPath,
        utm_source: utmSource,
      }
    );
  } catch (err) {
    console.error(
      'Logging failed:',
      err
    );
  }
};

/**
 * Real-time browser geolocation watcher.
 *
 * NOTE:
 * This is different from IP geolocation.
 *
 * - IP address / IP-based country/city:
 *     handled server-side by track-visit.
 *
 * - Device GPS/location:
 *     handled here through the browser Geolocation API.
 */
export const getUserLocation = (
  setUserCoords
) => {
  if (
    typeof navigator === 'undefined' ||
    !navigator.geolocation
  ) {
    console.warn(
      'Geolocation is not supported by this browser.'
    );

    setUserCoords(DEFAULT_LOCATION);

    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      setUserCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      console.warn(
        'Geolocation tracking error:',
        error
      );

      setUserCoords(
        (previousCoords) =>
          previousCoords || DEFAULT_LOCATION
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    }
  );
};

// =======================================================================
// 14.EN-ROUTE CORRIDOR FILTERING
// =======================================================================
export const getPlacesAlongRoute = (places, routeCoordinates, maxDistanceKm = 15) => {
  if (!routeCoordinates || routeCoordinates.length === 0 || !places.length) return [];

  // Subsample route coordinates for performance
  const step = Math.max(1, Math.floor(routeCoordinates.length / 80));
  const sampledCoords = routeCoordinates.filter((_, idx) => idx % step === 0);

  return places.filter(place => {
    const pLat = place.latitude ?? place.lat;
    const pLng = place.longitude ?? place.lng;
    if (!pLat || !pLng) return false;

    // Find distance to the closest point along the route
    for (let i = 0; i < sampledCoords.length; i++) {
      const rCoord = sampledCoords[i];
      const dist = calculateDistance(pLat, pLng, rCoord.lat, rCoord.lng);
      if (dist <= maxDistanceKm) return true;
    }
    return false;
  });
};

// =======================================================================
// 15.MEAL & STAY MILESTONE GENERATOR
// =======================================================================
export const calculateMealAndStayMilestones = (routeData) => {
  if (!routeData || !routeData.coordinates || routeData.coordinates.length === 0) return null;

  const totalDist = parseFloat(routeData.distance) || 0;
  const coords = routeData.coordinates;

  const getPointAtFraction = (fraction) => {
    const idx = Math.min(coords.length - 1, Math.floor(coords.length * fraction));
    return coords[idx];
  };

  return {
    breakfast: {
      title: "Breakfast Stop",
      timeEstimate: "~1.5–2 hrs into drive",
      coord: getPointAtFraction(0.20),
      distanceMark: (totalDist * 0.20).toFixed(1)
    },
    lunch: {
      title: "Lunch Stop",
      timeEstimate: "Midway (~3–4 hrs)",
      coord: getPointAtFraction(0.50),
      distanceMark: (totalDist * 0.50).toFixed(1)
    },
    dinner: {
      title: "Dinner Stop",
      timeEstimate: "Near Destination / Evening",
      coord: getPointAtFraction(0.80),
      distanceMark: (totalDist * 0.80).toFixed(1)
    },
    staying: {
      title: "Overnight Accommodation",
      timeEstimate: "Destination Area",
      coord: coords[coords.length - 1],
      distanceMark: totalDist.toFixed(1)
    }
  };
};

// =======================================================================
// 16. GEMINI AI TRANSLATION SERVICE
// =======================================================================

const SUPPORTED_LANGUAGES = {
  'ar': 'Arabic', 'de': 'German', 'en': 'English', 'es': 'Spanish',
  'fr': 'French', 'he': 'Hebrew', 'hi': 'Hindi', 'id': 'Indonesian', 'it': 'Italian',
  'ja': 'Japanese', 'ko': 'Korean', 'nl': 'Dutch', 'pl': 'Polish',
  'pt': 'Portuguese', 'ru': 'Russian', 'si': 'Sinhala', 'sr': 'Serbian',
  'sv': 'Swedish', 'th': 'Thai', 'tr': 'Turkish', 'uk': 'Ukrainian', 'zh': 'Chinese'
};

// In-memory cache store
const translationCache = new Map();

export const translateContentService = async (ai_article, targetLangCode, articleId) => {
  if (!ai_article) return ai_article;

  const baseLang = targetLangCode?.split('-')[0].toLowerCase() || 'en';

  // 1. Instant return for default English content (No AI call required)
  if (baseLang === 'en') {
    return ai_article;
  }

  const sourceFields = JSON.stringify(ai_article);
  const cacheKey = "v6:" + baseLang + ":" + String(articleId || "article") + ":" + sourceFields;

  // 2. Cache hit check
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const response = await fetch("/api/translate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ article: ai_article, targetLangCode: baseLang }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error || `Translation service returned ${response.status}.`);
    }
    if (!payload?.translation || typeof payload.translation !== "object") {
      throw new Error("Translation service returned an invalid response.");
    }

    const finalResult = { ...ai_article, ...payload.translation, language: baseLang };
    translationCache.set(cacheKey, finalResult);
    if (translationCache.size > 100) {
      translationCache.delete(translationCache.keys().next().value);
    }
    return finalResult;

  } catch (error) {
    console.error("Translation request failed.", error);
    throw error;
  }
};

// =======================================================================
// 17. UI COMPONENTS
// =======================================================================

export const WeatherIcon = ({ condition, className = "" }) => {
  const c = (condition || '').toLowerCase();
  let Icon = Cloud;
  let defaultColor = 'text-slate-400';

  if (c.includes('clear') || c.includes('sun')) {
    Icon = Sun;
    defaultColor = 'text-amber-500';
  } else if (c.includes('thunderstorm') || c.includes('lightning')) {
    Icon = CloudLightning;
    defaultColor = 'text-yellow-500';
  } else if (c.includes('rain')) {
    Icon = CloudRain;
    defaultColor = 'text-blue-500';
  } else if (c.includes('drizzle')) {
    Icon = CloudDrizzle;
    defaultColor = 'text-cyan-500';
  } else if (c.includes('snow')) {
    Icon = Snowflake;
    defaultColor = 'text-sky-300';
  } else if (c.includes('mist') || c.includes('haze') || c.includes('fog') || c.includes('smoke')) {
    Icon = CloudFog;
    defaultColor = 'text-slate-300';
  } else if (c.includes('dust') || c.includes('wind')) {
    Icon = Wind;
    defaultColor = 'text-orange-300';
  } else if (c.includes('cloud')) {
    Icon = Cloud;
    defaultColor = 'text-slate-400';
  }

  const hasCustomWidth = /\bw-\d+/.test(className);
  const hasCustomHeight = /\bh-\d+/.test(className);
  const hasCustomColor = /\btext-/.test(className);

  const finalClassName = [
    !hasCustomWidth && 'w-3.5',
    !hasCustomHeight && 'h-3.5',
    !hasCustomColor && defaultColor,
    'shrink-0',
    className
  ].filter(Boolean).join(' ');

  return <Icon className={finalClassName} strokeWidth={2.25} />;
};



export const RestrictionBadge = ({ level }) => {
  const { t } = useTranslation();
  const normalizedLevel = String(level || '').trim().toLowerCase();

  const config = {
    'open': {
      color: 'text-green-500 bg-green-50',
      icon: <CheckCircle2 size={14} />,
      label: t('restriction.public')
    },
    'permit required': {
      color: 'text-orange-600 bg-orange-50',
      icon: <AlertCircle size={14} />,
      label: t('restriction.permit')
    },
    'guide mandatory': {
      color: 'text-blue-600 bg-blue-50',
      icon: <UserCheck size={14} />,
      label: t('restriction.guide')
    },
    'restricted': {
      color: 'text-red-600 bg-red-50',
      icon: <Lock size={14} />,
      label: t('restriction.restricted')
    },
    'high': {
      color: 'text-red-600 bg-red-50',
      icon: <Lock size={14} />,
      label: t('restriction.restricted')
    },
  };

  const { color, icon, label } = config[normalizedLevel] || config['open'];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

export const RouteWeatherBadge = ({ weatherData, placeId, lat, lng }) => {
  // Determine the key based on how the place was saved
  const key = placeId || `${lat?.toFixed(4)},${lng?.toFixed(4)}`;
  const weather = weatherData[key];

  if (!weather) {
    // Optional: Return a loading skeleton or null while data is fetching
    return (
      <div className="animate-pulse bg-slate-100 dark:bg-slate-800 h-8 w-32 rounded-lg"></div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 w-max shadow-sm">
      {/* Current Weather */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-bold tracking-wider uppercase text-[9px]">
          Now
        </span>
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs">
          <WeatherIcon condition={weather.current.condition} className="w-3.5 h-3.5" />
          <span>{weather.current.temp}°</span>
        </div>
      </div>

      <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600"></div>

      {/* Next Day Weather */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-bold tracking-wider uppercase text-[9px]">
          Tmw
        </span>
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs" title={weather.nextDay.description}>
          <WeatherIcon condition={weather.nextDay.condition} className="w-3.5 h-3.5" />
          <span>{weather.nextDay.temp}°</span>
        </div>
      </div>
    </div>
  );
};


export const GoogleBottomAd = ({
  adClient = import.meta.env?.VITE_ADSENSE_CLIENT_ID || "ca-pub-XXXXXXXXXXXXXXXX",
  adSlot = import.meta.env?.VITE_ADSENSE_SLOT_ID || "XXXXXXXXXX"
}) => {
  const adRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPushedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const timer = setTimeout(() => {
      try {
        // Verify component mount status, DOM element visibility, and single-push execution before pushing
        if (
          isMountedRef.current &&
          !isPushedRef.current &&
          adRef.current &&
          adRef.current.offsetParent !== null &&
          typeof window !== 'undefined'
        ) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isPushedRef.current = true;
        }
      } catch (e) {
        console.error("AdSense Error:", e);
      }
    }, 1000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="my-8 flex justify-center w-full min-h-[280px] md:min-h-[90px] overflow-hidden bg-slate-50/50 rounded-xl">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        ref={adRef}
      />
    </div>
  );
};


export const RenderDynamicIcon = ({ iconName, className }) => {
  const IconMap = {
    'camera': Camera,
    'video': Video,
    'map': MapIcon,
    'book-open': BookOpen,
    'image': ImageIcon
  };

  const IconComponent = IconMap[iconName] || Info;

  return (
    <IconComponent
      className={className}
      aria-hidden="true"
      strokeWidth={2.5}
    />
  );
};

const MapSelectionComponent = React.memo(({ onLocationSelect, initialCoords, onMapReady }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // STABILITY GUARD: If map exists, do nothing.
    if (mapInstance.current || !mapRef.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialCoords?.lat || 7.8731, initialCoords?.lng || 80.7718], 8);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }).addTo(mapInstance.current);

    // Pass the Leaflet instance back to App.jsx so Autocomplete can sync with it
    if (onMapReady) {
      onMapReady(mapInstance.current);
    }

    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng).addTo(mapInstance.current);
      }
      onLocationSelect(lat.toFixed(6), lng.toFixed(6));
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off();
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initialCoords, onLocationSelect, onMapReady]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
});

/*
 * ============================================================
 * PHOTO GALLERY
 * ============================================================
 *
 * AUTOMATIC SEO ARCHITECTURE
 * --------------------------
 *
 * Image SEO is generated at runtime from:
 *
 *   selectedLocation
 *   +
 *   album_photos[]
 *   +
 *   image array index
 *
 * No image SEO database table is required.
 *
 * Section 11 helpers expected:
 *
 *   generateSlug()
 *   getOptimizedUrl()
 *   buildAutomaticImageSEO()
 *   buildAutomaticImageCollectionSEO()
 *   getAutomaticGallerySEOUrl()
 *
 * MASTER SEO OWNERSHIP:
 *
 *   Section 34
 *       ↓
 *   owns document-level SEO
 *
 *   Section 11
 *       ↓
 *   owns automatic image SEO/schema helpers
 *
 *   PhotoGallery
 *       ↓
 *   presentation + gallery URL lifecycle only
 *
 * IMPORTANT:
 *
 * This component deliberately does NOT:
 *
 *   - call updateSEO()
 *   - inject JSON-LD
 *   - remove JSON-LD
 *   - modify document.title
 *   - modify meta tags
 *
 * The automatically generated image SEO data is available to the
 * presentation layer and is supplied to the master SEO controller
 * by the parent/controller architecture.
 *
 * This component owns:
 *
 *   - gallery presentation
 *   - lightbox
 *   - slideshow
 *   - keyboard controls
 *   - gallery URL lifecycle
 *   - image accessibility metadata
 *   - Pinterest sharing
 *
 * It does NOT create persistent SEO records.
 * ============================================================
 */


export const PhotoGallery = React.memo(
  ({
    photos,
    onClose,
    placeName,
    selectedLocation,
    onShare,
    handleShareEvent
  }) => {

    // ==========================================================
    // STATE
    // ==========================================================

    const [activeIndex, setActiveIndex] =
      useState(null);

    const [isSlideshowActive, setIsSlideshowActive] =
      useState(false);


    // ==========================================================
    // NORMALIZED LOCATION
    // ==========================================================

    const locationObj = useMemo(() => {
      if (selectedLocation) {
        return selectedLocation;
      }

      if (placeName) {
        return {
          place_name: placeName
        };
      }

      return null;
    }, [
      selectedLocation,
      placeName
    ]);


    // ==========================================================
    // NORMALIZED PHOTOS
    // ==========================================================

    const normalizedPhotos = useMemo(() => {
      if (!Array.isArray(photos)) {
        return [];
      }

      return [
        ...new Set(
          photos.filter(Boolean)
        )
      ];
    }, [photos]);


    // ==========================================================
    // SEO PLACE
    // ==========================================================
    //
    // Presentation-safe fallback only.
    //
    // This does NOT create a persistent SEO record and does not
    // directly control document-level SEO.
    //
    // ==========================================================

    const gallerySEOPlace = useMemo(
      () =>
        locationObj || {
          place_name:
            placeName ||
            "Sri Lanka Backcountry Location"
        },
      [
        locationObj,
        placeName
      ]
    );


    // ==========================================================
    // AUTOMATIC IMAGE SEO
    // ==========================================================
    //
    // Used by:
    //
    //   - gallery rendering
    //   - alt text
    //   - semantic image context
    //   - lightbox image metadata
    //
    // Document-level SEO remains owned by Section 34.
    //
    // ==========================================================

    const imageSEOCollection = useMemo(() => {

      if (
        typeof buildAutomaticImageCollectionSEO ===
        "function"
      ) {
        return buildAutomaticImageCollectionSEO(
          normalizedPhotos,
          gallerySEOPlace
        );
      }

      /*
       * Defensive fallback.
       *
       * Section 11 normally provides the automatic helper.
       */

      return normalizedPhotos.map(
        (url, index) => ({
          url,

          optimizedUrl:
            typeof getOptimizedUrl ===
              "function"
              ? getOptimizedUrl(
                url,
                1200,
                82
              )
              : url,

          index: index + 1,

          placeName:
            gallerySEOPlace?.place_name ||
            placeName ||
            "Sri Lanka Backcountry Location",

          category:
            gallerySEOPlace?.category ||
            "natural attraction",

          locality:
            gallerySEOPlace?.locality ||
            "Sri Lanka"
        })
      );

    }, [
      normalizedPhotos,
      gallerySEOPlace,
      placeName
    ]);


    // ==========================================================
    // ACTIVE IMAGE SEO
    // ==========================================================

    const activeImageSEO =
      activeIndex !== null
        ? imageSEOCollection[
        activeIndex
        ] || null
        : null;


    // ==========================================================
    // DRAG SCROLL
    // ==========================================================

    const gridScrollRef = useDragScroll();

    const lightboxScrollRef = useDragScroll();


    // ==========================================================
    // GALLERY SLUG
    // ==========================================================

    const gallerySlug = useMemo(() => {

      const rawName =
        gallerySEOPlace?.place_name ||
        placeName ||
        "gallery";

      if (
        typeof generateSlug ===
        "function"
      ) {
        return gallerySEOPlace?.place_name || gallerySEOPlace?.slug
          ? getMediaSEOPlaceSlug(gallerySEOPlace)
          : generateSlug(rawName);
      }

      return encodeURIComponent(
        String(rawName)
          .toLowerCase()
          .trim()
      );

    }, [
      gallerySEOPlace,
      placeName
    ]);


    // ==========================================================
    // CANONICAL GALLERY PATH
    // ==========================================================

    const galleryPath =
      `/gallery/${gallerySlug}`;


    // ==========================================================
    // CLOSE GALLERY
    // ==========================================================
    //
    // This function owns gallery UI/history state only.
    //
    // It deliberately does NOT call updateSEO().
    //
    // Section 34 observes the resulting application state and
    // restores the appropriate document SEO.
    //
    // ==========================================================

    const handleCloseGallery =
      useCallback(
        (e) => {

          if (e) {
            e.stopPropagation();
          }

          setActiveIndex(null);
          setIsSlideshowActive(false);

          if (
            window.location.pathname.startsWith(
              "/gallery/"
            )
          ) {

            const state =
              window.history.state;

            if (
              state?.modalOpen === true &&
              state?.gallery === true
            ) {

              window.history.back();

            } else if (
              window.history.length > 1
            ) {

              /*
               * Compatibility fallback for older gallery
               * history entries.
               */

              window.history.back();

            } else {

              window.history.replaceState(
                {
                  modalOpen: false
                },
                "",
                "/"
              );

            }

          }

          if (
            typeof onClose ===
            "function"
          ) {
            onClose();
          }

        },
        [onClose]
      );


    // ==========================================================
    // COPY PROTECTION
    // ==========================================================

    const preventCopy =
      useCallback((e) => {
        e.preventDefault();
        return false;
      }, []);


    // ==========================================================
    // IMAGE NAVIGATION
    // ==========================================================

    const nextImage =
      useCallback(
        (e) => {

          if (e) {
            e.stopPropagation();
          }

          if (
            normalizedPhotos.length === 0
          ) {
            return;
          }

          setActiveIndex(
            (previous) => {

              if (
                previous === null
              ) {
                return 0;
              }

              return (
                previous + 1
              ) %
                normalizedPhotos.length;

            }
          );

        },
        [
          normalizedPhotos.length
        ]
      );


    const prevImage =
      useCallback(
        (e) => {

          if (e) {
            e.stopPropagation();
          }

          if (
            normalizedPhotos.length === 0
          ) {
            return;
          }

          setActiveIndex(
            (previous) => {

              if (
                previous === null
              ) {
                return (
                  normalizedPhotos.length -
                  1
                );
              }

              return (
                previous -
                1 +
                normalizedPhotos.length
              ) %
                normalizedPhotos.length;

            }
          );

        },
        [
          normalizedPhotos.length
        ]
      );


    // ==========================================================
    // MASTER SEO
    // ==========================================================
    //
    // IMPORTANT:
    //
    // PhotoGallery does NOT call updateSEO().
    //
    // Section 34 remains the single document-SEO owner.
    //
    // ==========================================================


    // ==========================================================
    // MODAL + URL LIFECYCLE
    // ==========================================================

    useEffect(() => {

      if (!locationObj) {
        return undefined;
      }

      const scrollY =
        window.scrollY;

      document.body.classList.add(
        "modal-open"
      );

      /*
       * Only create the gallery history entry
       * when the current URL is not already the
       * canonical gallery URL.
       */

      if (
        window.location.pathname !==
        galleryPath
      ) {

        window.history.pushState(
          {
            ...(window.history.state || {}),

            modalOpen: true,

            gallery: true,

            placeId:
              locationObj.id ||
              null,

            gallerySlug,

            galleryOrigin:
              window.location.pathname
          },
          "",
          galleryPath
        );

      }


      const handlePopState =
        () => {

          if (
            typeof onClose ===
            "function"
          ) {
            onClose();
          }

        };


      window.addEventListener(
        "popstate",
        handlePopState
      );


      return () => {

        document.body.classList.remove(
          "modal-open"
        );

        window.scrollTo(
          0,
          scrollY
        );

        window.removeEventListener(
          "popstate",
          handlePopState
        );

      };

    }, [
      locationObj,
      galleryPath,
      gallerySlug,
      onClose
    ]);


    // ==========================================================
    // SLIDESHOW
    // ==========================================================

    useEffect(() => {

      if (
        !isSlideshowActive ||
        activeIndex === null ||
        normalizedPhotos.length <= 1
      ) {
        return undefined;
      }

      const timer =
        window.setTimeout(
          () => {
            nextImage();
          },
          5000
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };

    }, [
      isSlideshowActive,
      activeIndex,
      normalizedPhotos.length,
      nextImage
    ]);


    // ==========================================================
    // KEYBOARD CONTROLS
    // ==========================================================

    useEffect(() => {

      const handleKeyDown =
        (e) => {

          if (
            activeIndex === null
          ) {
            return;
          }

          if (
            e.key ===
            "ArrowRight"
          ) {

            nextImage();

            setIsSlideshowActive(
              false
            );

            return;

          }

          if (
            e.key ===
            "ArrowLeft"
          ) {

            prevImage();

            setIsSlideshowActive(
              false
            );

            return;

          }

          if (
            e.key ===
            "Escape"
          ) {

            setActiveIndex(
              null
            );

            setIsSlideshowActive(
              false
            );

            return;

          }

          if (
            e.key ===
            " "
          ) {

            e.preventDefault();

            if (
              normalizedPhotos.length >
              1
            ) {

              setIsSlideshowActive(
                (previous) =>
                  !previous
              );

            }

          }

        };


      window.addEventListener(
        "keydown",
        handleKeyDown
      );


      return () => {

        window.removeEventListener(
          "keydown",
          handleKeyDown
        );

      };

    }, [
      activeIndex,
      normalizedPhotos.length,
      nextImage,
      prevImage
    ]);


    // ==========================================================
    // PINTEREST
    // ==========================================================

    const handlePinterestSave =
      useCallback(
        (
          e,
          imageUrl,
          locationData
        ) => {

          e.stopPropagation();

          const locationName =
            locationData?.place_name ||
            placeName ||
            "New Discovery";

          const rawSlugOrName =
            locationData?.slug ||
            locationName;

          const rawCategory =
            locationData?.category ||
            "Location";

          const baseUrl =
            "https://www.myjournalview.com";


          const formattedLocation =
            typeof generateSlug ===
              "function"
              ? generateSlug(
                rawSlugOrName
              )
              : encodeURIComponent(
                String(
                  rawSlugOrName
                ).toLowerCase()
              );


          const sourceUrl =
            `${baseUrl}/gallery/` +
            `${formattedLocation}` +
            `?utm_source=pinterest_save_btn`;


          const mandatoryHashtags = [
            "MyJournal",
            "SriLanka",
            "VisitSriLanka",
            "TravelSriLanka",
            "WanderlustSriLanka",
            "BeautifulSriLanka",
            "HiddenGemsSriLanka",
            "SriLankaDiaries",
            "ChasingWaterfalls",
            "HikingAdventures",
            "CampingLife",
            "MountainViews",
            "NatureSeekers",
            "AdventureSriLanka",
            "ExploreSriLanka",
            "TravelPhotography",
            "TravelDiaries",
            "IslandParadise",
            "ProtectNature",
            "CeylonVibes"
          ];


          const categoryMap = {

            Waterfall: [
              "Waterfalls",
              "Nature"
            ],

            Mountain: [
              "Mountains",
              "Peaks",
              "Hiking"
            ],

            Trail: [
              "Trekking",
              "Adventure"
            ],

            Viewpoint: [
              "ScenicViews",
              "Landscape"
            ],

            Beach: [
              "Coastal",
              "OceanVibes",
              "BeachLife"
            ],

            Park: [
              "NationalPark",
              "Wildlife"
            ],

            Plateaus: [
              "Highlands",
              "Plains"
            ],

            "Reserved Forest": [
              "Rainforest",
              "EcoTravel"
            ],

            Monastery: [
              "Spiritual",
              "BuddhistTemple",
              "Serenity"
            ],

            Archaeology: [
              "AncientHistory",
              "Heritage",
              "HistoricalSites"
            ],

            Reservoir: [
              "Lakes",
              "WaterViews"
            ],

            Pool: [
              "NaturalPool",
              "Swimming"
            ],

            Stream: [
              "Rivers",
              "Streams"
            ],

            Location: [
              "Travel",
              "Explore"
            ]

          };


          const uniqueHashtags =
            new Set(
              mandatoryHashtags
            );


          const locationHashtag =
            locationName.replace(
              /[^a-zA-Z0-9]/g,
              ""
            );


          if (
            locationHashtag
          ) {
            uniqueHashtags.add(
              locationHashtag
            );
          }


          const dynamicTags =
            categoryMap[
            rawCategory
            ] || [];


          dynamicTags.forEach(
            (tag) => {
              uniqueHashtags.add(
                tag
              );
            }
          );


          const hashtagString =
            Array.from(
              uniqueHashtags
            )
              .map(
                (tag) =>
                  `#${tag}`
              )
              .join(" ");


          const protectedDescription =
            `New Adventure: ${locationName} (${rawCategory}) 🏔️ | ` +
            `Experience breathtaking views and cinematic highlights. ` +
            `See the full gallery on My Journal! © Hasitha Gunasekera\n\n` +
            hashtagString;


          const pinterestUrl =
            `https://www.pinterest.com/pin/create/button/?` +
            `url=${encodeURIComponent(
              sourceUrl
            )}` +
            `&media=${encodeURIComponent(
              imageUrl
            )}` +
            `&description=${encodeURIComponent(
              protectedDescription
            )}`;


          window.open(
            pinterestUrl,
            "_blank",
            "noopener,noreferrer,width=600,height=700,scrollbars=yes,resizable=yes"
          );

        },
        [
          placeName
        ]
      );


    // ==========================================================
    // SAFETY CHECK
    // ==========================================================

    if (
      normalizedPhotos.length === 0
    ) {
      return null;
    }


    // ==========================================================
    // RENDER
    // ==========================================================

    return (
      <div
        className="fixed inset-0 z-[10000] bg-white/95 backdrop-blur-3xl flex flex-col animate-in fade-in duration-200 select-none"
        style={{
          height: "100dvh"
        }}
        onClick={(e) =>
          e.stopPropagation()
        }
        onContextMenu={
          preventCopy
        }
      >

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">

          <div>

            <h3 className="text-slate-600 font-black uppercase tracking-widest text-xs">

              {placeName
                ? `${placeName} Gallery`
                : "Location Gallery"}

            </h3>

            <p className="text-[10px] text-indigo-400 font-bold uppercase">

              {normalizedPhotos.length}{" "}
              Total Images

            </p>

          </div>


          <div className="flex items-center gap-3">

            {/* =================================================
                SHARE
            ================================================== */}

            <button
              type="button"
              onClick={(e) => {

                e.stopPropagation();

                if (
                  selectedLocation?.id &&
                  typeof handleShareEvent ===
                  "function"
                ) {

                  handleShareEvent(
                    selectedLocation.id,
                    "gallery"
                  );

                }

                if (
                  typeof onShare ===
                  "function"
                ) {

                  onShare(
                    e,
                    selectedLocation
                  );

                }

              }}
              aria-label="Share Gallery"
              className="w-12 h-12 flex items-center justify-center bg-slate-800/10 text-slate-700 hover:bg-blue-500 hover:text-white rounded-full transition-all shadow-sm"
            >

              <Share2
                className="w-5 h-5"
                aria-hidden="true"
              />

            </button>


            {/* =================================================
                CLOSE
            ================================================== */}

            <button
              type="button"
              onClick={
                handleCloseGallery
              }
              aria-label="Close photo gallery"
              className="w-12 h-12 flex items-center justify-center bg-gray-600/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            >

              <X
                className="w-5 h-5"
                aria-hidden="true"
              />

            </button>

          </div>

        </header>


        {/* =====================================================
            CRAWLER-ACCESSIBLE SEMANTIC GALLERY CONTEXT
        ====================================================== */}

        {locationObj && (
          <div
            className="sr-only"
            itemScope
            itemType="https://schema.org/ImageGallery"
          >

            <h2 itemProp="name">

              Visual Field Notes and Photography
              Archive:{" "}
              {locationObj.place_name ||
                placeName}

            </h2>


            <p itemProp="description">

              Welcome to the dedicated photo
              gallery and visual repository for{" "}
              {locationObj.place_name ||
                placeName}
              , categorized as a{" "}
              {locationObj.category ||
                "natural attraction"} in{" "}
              {locationObj.locality ||
                "Sri Lanka"}.
              This visual field archive documents
              the landscape, terrain and
              geographical character of the
              location.

            </p>


            <p>

              This gallery contains{" "}
              {normalizedPhotos.length}{" "}
              photographs documenting{" "}
              {locationObj.place_name ||
                placeName}{" "}
              and its surrounding{" "}
              {locationObj.category ||
                "natural attraction"} landscape
              in{" "}
              {locationObj.locality ||
                "Sri Lanka"}.

            </p>


            {locationObj?.ai_article?.metrics
              ?.elevation_m !==
              undefined &&
              locationObj?.ai_article?.metrics
                ?.elevation_m !== null && (

                <p>

                  The mapped area features a
                  baseline elevation of approximately{" "}
                  {
                    locationObj
                      .ai_article
                      .metrics
                      .elevation_m
                  }{" "}
                  metres.

                </p>

              )}


            {locationObj?.ai_article?.metrics
              ?.difficulty_level && (

                <p>

                  The approach terrain corresponds
                  to a{" "}
                  {
                    locationObj
                      .ai_article
                      .metrics
                      .difficulty_level
                  }{" "}
                  difficulty level.

                </p>

              )}


            {imageSEOCollection.map(
              (
                image,
                index
              ) => (

                <figure
                  key={
                    image.url ||
                    `image-${index}`
                  }
                  itemProp="associatedMedia"
                  itemScope
                  itemType="https://schema.org/ImageObject"
                >

                  <meta
                    itemProp="contentUrl"
                    content={
                      image.url
                    }
                  />

                  <meta
                    itemProp="name"
                    content={
                      image.title ||
                      image.name ||
                      `Photo ${index + 1}`
                    }
                  />

                  <meta
                    itemProp="description"
                    content={
                      image.description ||
                      image.caption ||
                      image.title ||
                      ""
                    }
                  />

                  <meta
                    itemProp="caption"
                    content={
                      image.caption ||
                      image.title ||
                      ""
                    }
                  />

                </figure>

              )
            )}

          </div>
        )}


        {/* =====================================================
            PHOTO GRID
        ====================================================== */}

        <main
          ref={gridScrollRef}
          className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y p-4 md:p-10 custom-scrollbar"
        >

          <div className="max-w-5xl mx-auto mb-6 text-sm text-slate-500">
            <Breadcrumbs
              items={[
                { label: "My Journal", href: "/" },
                { label: "Destinations", href: "/#destinations" },
                {
                  label: getMediaSEOPlaceName(gallerySEOPlace),
                  href: `/place/${gallerySlug}`,
                },
                { label: "Gallery" },
              ]}
            />
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {normalizedPhotos.map(
              (
                url,
                index
              ) => {

                const imageSEO =
                  imageSEOCollection[
                  index
                  ] ||
                  (
                    typeof buildAutomaticImageSEO ===
                      "function"
                      ? buildAutomaticImageSEO(
                        url,
                        index,
                        gallerySEOPlace
                      )
                      : null
                  );


                const optimizedUrl =
                  imageSEO?.optimizedUrl ||
                  (
                    typeof getOptimizedUrl ===
                      "function"
                      ? getOptimizedUrl(
                        url,
                        400,
                        60
                      )
                      : url
                  );


                const altText =
                  imageSEO?.alt ||
                  `${placeName || "Sri Lanka"} ${locationObj?.category
                    ? `(${locationObj.category})`
                    : ""
                  } in ${locationObj?.locality ||
                  "Sri Lanka"
                  } - landscape photograph ${index + 1
                  }`;


                return (
                  <article
                    key={
                      `${imageSEO?.slug ||
                      gallerySlug ||
                      "photo"
                      }-${index}`
                    }
                    onClick={() =>
                      setActiveIndex(
                        index
                      )
                    }
                    className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-800 border border-white/5 shadow-2xl cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                  >

                    <img
                      src={optimizedUrl}
                      className="w-full h-full object-cover select-none pointer-events-none"
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      fetchPriority={
                        index === 0
                          ? "high"
                          : "auto"
                      }
                      decoding="async"
                      draggable={false}
                      alt={altText}
                    />


                    {imageSEO?.caption && (
                      <span className="sr-only">
                        {
                          imageSEO.caption
                        }
                      </span>
                    )}

                  </article>
                );

              }
            )}

          </div>

        </main>


        {/* =====================================================
            LIGHTBOX
        ====================================================== */}

        {activeIndex !== null &&
          normalizedPhotos[
          activeIndex
          ] && (

            <div
              className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-2xl flex flex-col animate-in zoom-in-95 duration-200"
              onContextMenu={
                preventCopy
              }
            >

              {/* =================================================
                  SLIDESHOW PROGRESS
              ================================================== */}

              {isSlideshowActive && (
                <div className="absolute top-0 left-0 h-1 bg-indigo-500 z-[12001] animate-[progress_5s_linear_infinite]" />
              )}


              {/* =================================================
                  LIGHTBOX CONTROLS
              ================================================== */}

              <div className="absolute top-6 right-6 flex gap-3 z-[12000]">

                {/* PINTEREST */}
                <button
                  type="button"
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-[#E60023] text-white rounded-full transition-all shadow-lg"
                  onClick={(e) =>
                    handlePinterestSave(
                      e,
                      normalizedPhotos[activeIndex],
                      locationObj
                    )
                  }
                  aria-label="Save to Pinterest"

                >

                  <svg
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"

                  >

                    ```
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.158 9.429 7.613 11.176-.105-.949-.2-2.412.042-3.451.219-.94 1.41-5.986 1.41-5.986s-.36-.72-.36-1.785c0-1.672.97-2.922 2.177-2.922 1.026 0 1.522.771 1.522 1.695 0 1.032-.657 2.574-.996 4.003-.284 1.196.601 2.174 1.785 2.174 2.142 0 3.789-2.258 3.789-5.521 0-2.886-2.074-4.904-5.035-4.904-3.429 0-5.442 2.572-5.442 5.229 0 1.036.399 2.148.896 2.753.098.119.112.224.083.344l-.334 1.374c-.053.22-.175.267-.403.162-1.503-.699-2.443-2.895-2.443-4.658 0-3.789 2.75-7.271 7.93-7.271 4.162 0 7.397 2.965 7.397 6.93 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.033-1.002 2.324-1.492 3.121 1.12.345 2.3.533 3.524.533 6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                    ```

                  </svg>
                </button>



                {/* SLIDESHOW */}

                <button
                  type="button"
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isSlideshowActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  onClick={(e) => {

                    e.stopPropagation();

                    if (
                      normalizedPhotos.length >
                      1
                    ) {

                      setIsSlideshowActive(
                        (previous) =>
                          !previous
                      );

                    }

                  }}
                  aria-label={
                    isSlideshowActive
                      ? "Pause Slideshow"
                      : "Start Slideshow"
                  }
                >

                  {isSlideshowActive ? (
                    <Pause
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                  ) : (
                    <Play
                      className="w-5 h-5"
                      aria-hidden="true"
                    />
                  )}

                </button>


                {/* CLOSE LIGHTBOX */}

                <button
                  type="button"
                  className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all"
                  onClick={() => {

                    setActiveIndex(
                      null
                    );

                    setIsSlideshowActive(
                      false
                    );

                  }}
                  aria-label="Close image"
                >

                  <X
                    className="w-5 h-5"
                    aria-hidden="true"
                  />

                </button>

              </div>


              {/* =================================================
                  PREVIOUS
              ================================================== */}

              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white rounded-full transition-all z-[12000]"
                onClick={(e) => {

                  prevImage(e);

                  setIsSlideshowActive(
                    false
                  );

                }}
                aria-label="Previous image"
              >

                <ChevronLeft
                  className="w-8 h-8"
                  aria-hidden="true"
                />

              </button>


              {/* =================================================
                  NEXT
              ================================================== */}

              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/20 text-white rounded-full transition-all z-[12000]"
                onClick={(e) => {

                  nextImage(e);

                  setIsSlideshowActive(
                    false
                  );

                }}
                aria-label="Next image"
              >

                <ChevronRight
                  className="w-8 h-8"
                  aria-hidden="true"
                />

              </button>


              {/* =================================================
                  LIGHTBOX IMAGE
              ================================================== */}

              <div
                ref={lightboxScrollRef}
                className="photo-gallery-scroll native-scroll-y flex-1 w-full overflow-y-auto p-4 no-scrollbar"
                onClick={() =>
                  setActiveIndex(
                    null
                  )
                }
              >

                <div className="min-h-full w-full flex items-center justify-center">

                  <div
                    className="relative w-fit h-fit"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >

                    <img
                      key={
                        normalizedPhotos[
                        activeIndex
                        ]
                      }
                      src={
                        activeImageSEO?.optimizedUrl ||
                        (
                          typeof getOptimizedUrl ===
                            "function"
                            ? getOptimizedUrl(
                              normalizedPhotos[
                              activeIndex
                              ],
                              1200,
                              85
                            )
                            : normalizedPhotos[
                            activeIndex
                            ]
                        )
                      }
                      className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500"
                      alt={
                        activeImageSEO?.alt ||
                        `${placeName || "Sri Lanka"} featured landscape photograph ${activeIndex + 1
                        }`
                      }
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      draggable={false}
                    />

                    {/* =================================================
                        NO VISIBLE IMAGE CAPTION
                    ================================================== */}

                    {/*
                     * Intentionally removed.
                     *
                     * activeImageSEO.caption remains available in
                     * semantic metadata above, but is not rendered
                     * over the fullscreen/lightbox image.
                     */}

                    {/* =================================================
                        WATERMARK
                    ================================================== */}

                    <div className="absolute bottom-6 right-6 pointer-events-none select-none">

                      <div className="flex flex-col items-end drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">

                        <span className="text-[10px] md:text-xs font-light tracking-[0.4em] text-white/70 uppercase border-b border-white/30 pb-0.5">

                          My Journal

                        </span>

                        <div className="w-4 h-[0.5px] bg-white/30 mt-0.5" />

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  COUNTER
              ================================================== */}

              <footer className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 px-6 py-2 rounded-full border border-white/10 z-[12000]">

                <p className="text-white text-[10px] font-black tracking-[0.2em] uppercase">

                  {activeIndex + 1}
                  {" / "}
                  {normalizedPhotos.length}

                </p>

              </footer>

            </div>

          )}


        {/* =====================================================
            STYLES
        ====================================================== */}

        <style>{`

          @keyframes progress {
            from {
              width: 0%;
            }

            to {
              width: 100%;
            }
          }

          .modal-open {
            overflow: hidden !important;
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }

        `}</style>

      </div>
    );

  }
);



// =======================================================================
// VIDEO GALLERY + INDEXABLE VIDEO DETAIL PAGE
// =======================================================================
//
// AUTOMATIC VIDEO SEO ARCHITECTURE
// --------------------------------
//
// Source of truth:
//
//     hub_videos
//
// Existing fields:
//
//     id
//     url
//     title
//     custom_thumbnail_url
//
// Optional existing fields:
//
//     created_at
//     published_at
//     upload_date
//     duration
//     duration_iso
//     latitude
//     longitude
//     locality
//     district
//     province
//     description
//     meta_description
//     slug
//     display_order
//     is_active
//
// SEO metadata is generated automatically at runtime.
//
// NO separate video SEO table is required.
//
// Section 11 provides:
//
//     getYouTubeId()
//     buildYouTubeEmbedUrl()
//     buildAutomaticVideoSEO()
//     buildAutomaticVideoCollectionSEO()
//     buildVideoObjectSchema()
//     getAutomaticVideoSEOUrl()
//     generateSlug()
//
// Section 12 provides:
//
//     normalizeVideoRecords()
//     normalizeVideoSEORecords()
//     shuffleVideoRecords()
//     getVideoPageUrl()
//     VideoDetailPage
//     VideoGallery
//
// IMPORTANT ARCHITECTURE:
//
//     hub_videos
//          ↓
//     fetchVideoLibrary()
//          ↓
//     normalizeVideoRecords()
//          ↓
//     buildAutomaticVideoSEO()
//          ↓
//     ┌───────────────────────────────┐
//     │                               │
//     ↓                               ↓
// /videos/<slug>                 /videos
// crawlable detail page          visual gallery
//
// IMPORTANT SEO OWNERSHIP:
//
//     Section 34
//          ↓
//     owns document-level SEO
//
//     Section 11G
//          ↓
//     owns VideoObject JSON-LD
//
//     buildAutomaticVideoSEO()
//          ↓
//     owns normalized video SEO identity
//
//     VideoDetailPage / VideoGallery
//          ↓
//     presentation only
//
// Neither presentation component calls updateSEO().
// =======================================================================



// =======================================================================
// VIDEO RECORD NORMALIZATION
// =======================================================================
//
// Accepts:
//
//     string
//     array
//     hub_videos records
//
// Existing metadata is preserved.
//
// Invalid YouTube records are removed before they reach the player.
//
// =======================================================================

export const normalizeVideoRecords = (
  videos
) => {
  const source =
    Array.isArray(videos)
      ? videos
      : videos
        ? [videos]
        : [];

  return source
    .flatMap((item) => {

      // ---------------------------------------------------------------
      // Plain string
      // ---------------------------------------------------------------

      if (
        typeof item === "string"
      ) {
        return item
          .split(/[\s,;|]+/)
          .filter(Boolean);
      }


      // ---------------------------------------------------------------
      // Existing database record
      // ---------------------------------------------------------------

      if (
        item &&
        typeof item === "object" &&
        typeof item.url === "string"
      ) {
        const urls =
          item.url
            .split(/[\s,;|]+/)
            .filter(Boolean);

        if (
          urls.length > 1
        ) {
          return urls.map(
            (url) => ({
              ...item,
              url
            })
          );
        }
      }

      return item;
    })


    // -----------------------------------------------------------------
    // Convert plain strings into records
    // -----------------------------------------------------------------

    .map((item) => {
      if (
        typeof item === "string"
      ) {
        return {
          url: item.trim(),
          title: "",
          custom_thumbnail_url: ""
        };
      }

      return item;
    })


    // -----------------------------------------------------------------
    // Basic record validation
    // -----------------------------------------------------------------

    .filter((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return false;
      }

      return Boolean(
        String(
          item.url || ""
        ).trim()
      );
    })


    // -----------------------------------------------------------------
    // YouTube ID validation
    // -----------------------------------------------------------------

    .filter((item) => {
      const youtubeId =
        getYouTubeId(
          item.url
        );

      if (!youtubeId) {
        console.warn(
          "Skipping invalid YouTube video URL:",
          item.url
        );

        return false;
      }

      return true;
    });
};



// =======================================================================
// VIDEO SEO NORMALIZATION
// =======================================================================
//
// Converts normalized hub_videos records into the same automatic SEO
// representation used by:
//
//     VideoDetailPage
//     VideoGallery
//     VideoObject JSON-LD
//     Video sitemap generation
//
// =======================================================================

export const normalizeVideoSEORecords = (
  records = []
) => {
  if (
    !Array.isArray(records)
  ) {
    return [];
  }

  return records
    .map(
      (video, index) =>
        buildAutomaticVideoSEO(
          video,
          index
        )
    )
    .filter(Boolean);
};



// =======================================================================
// RANDOM VIDEO SHUFFLE
// =======================================================================
//
// Presentation only.
//
// SEO identity does NOT depend on this order.
//
// IMPORTANT:
//
// Never use the shuffled index to construct a permanent URL.
//
// =======================================================================

export const shuffleVideoRecords = (
  records
) => {
  if (
    !Array.isArray(records) ||
    records.length === 0
  ) {
    return [];
  }

  const shuffled =
    records.map(
      (record) => ({
        ...record
      })
    );

  for (
    let i = shuffled.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    const temp =
      shuffled[i];

    shuffled[i] =
      shuffled[j];

    shuffled[j] =
      temp;
  }

  return shuffled;
};



// =======================================================================
// VIDEO PAGE URL
// =======================================================================
//
// All internal video links must use the same automatic SEO URL builder.
//
// This guarantees:
//
//     sitemap URL
//     detail-page URL
//     gallery link
//     related-video link
//
// all resolve to the same canonical URL.
//
// IMPORTANT:
//
// The index is only supplied for compatibility with the automatic SEO
// helper. Permanent URL identity must come from the video record itself,
// preferably its database slug or stable ID-derived fallback.
//
// =======================================================================

export const getVideoPageUrl = (
  video,
  index = 0
) => {
  return getAutomaticVideoSEOUrl(
    video,
    index
  );
};



// =======================================================================
// INDEXABLE VIDEO DETAIL PAGE
// =======================================================================
//
// Public URL:
//
//     /videos/<slug>
//
// This page is intentionally separate from the visual modal gallery.
//
// Responsibilities:
//
//     - Render crawlable <h1> content
//     - Render textual video description
//     - Render breadcrumb navigation
//     - Render crawlable related-video links
//     - Render the YouTube player
//     - Render available video metadata
//
// SEO ownership:
//
//     - Master Section 34 owns document SEO
//     - buildVideoObjectSchema() owns VideoObject JSON-LD
//     - buildAutomaticVideoSEO() owns normalized video SEO data
//
// IMPORTANT:
//
// This component deliberately does NOT:
//
//     - call updateSEO()
//     - inject JSON-LD
//     - remove JSON-LD
//     - modify document.title
//     - modify document meta tags
//
// =======================================================================

export const VideoDetailPage = React.memo(
  ({
    video,
    allVideos = [],
  }) => {

    // -----------------------------------------------------------------
    // Automatic SEO representation
    // -----------------------------------------------------------------

    const seo = useMemo(
      () =>
        buildAutomaticVideoSEO(
          video || {},
          0
        ),
      [video]
    );


    // -----------------------------------------------------------------
    // Validated YouTube ID
    // -----------------------------------------------------------------

    const videoId =
      seo?.youtubeId ||
      getYouTubeId(
        seo?.url ||
        video?.url
      );


    // -----------------------------------------------------------------
    // Guaranteed safe embed URL
    // -----------------------------------------------------------------

    const embedUrl =
      videoId
        ? buildYouTubeEmbedUrl(
          videoId,
          {
            autoplay: false,
            rel: false,
          }
        )
        : null;


    // -----------------------------------------------------------------
    // NOT FOUND
    // -----------------------------------------------------------------

    if (!video) {
      return (
        <main className="min-h-screen bg-slate-950 text-white p-10">
          <div className="max-w-4xl mx-auto">

            <Breadcrumbs
              className="mb-8 text-sm text-white/60"
              items={[
                { label: "My Journal", href: "/" },
                { label: "Videos", href: "/videos" },
                { label: "Video not found" },
              ]}
            />


            <h1 className="text-3xl font-black">
              Video not found
            </h1>


            <p className="mt-4 text-white/60">
              The requested video could not
              be found in the My Journal
              video archive.
            </p>


            <a
              href="/videos"
              className="inline-block mt-6 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20"
            >
              Browse Videos
            </a>

          </div>
        </main>
      );
    }


    // -----------------------------------------------------------------
    // RENDER
    // -----------------------------------------------------------------

    return (
      <main className="min-h-screen bg-slate-950 text-white">

        <article className="max-w-6xl mx-auto px-5 py-10">

          {/* =========================================================
              BREADCRUMB
          ========================================================= */}

          <Breadcrumbs
            className="mb-6 text-sm text-white/60"
            items={[
              { label: "My Journal", href: "/" },
              { label: "Videos", href: "/videos" },
              { label: seo?.title || "Video" },
            ]}
          />


          {/* =========================================================
              HEADER
          ========================================================= */}

          <header className="mb-8">

            <h1 className="text-3xl md:text-5xl font-black">
              {seo?.seoTitle ||
                seo?.title ||
                "Sri Lanka Backcountry Video | My Journal"}
            </h1>


            <p className="mt-4 text-white/70 max-w-3xl">
              {seo?.seoDescription ||
                "Sri Lanka backcountry video from My Journal."}
            </p>

          </header>


          {/* =========================================================
              VIDEO PLAYER
          ========================================================= */}

          <section
            aria-label="Video player"
            className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-2xl"
          >

            {videoId && embedUrl ? (
              <iframe
                key={videoId}
                src={embedUrl}
                title={
                  seo?.seoTitle ||
                  seo?.title ||
                  "My Journal Video"
                }
                className="absolute inset-0 w-full h-full"
                loading="eager"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                Video unavailable
              </div>
            )}

          </section>


          {/* =========================================================
              VIDEO INFORMATION
          ========================================================= */}

          <section className="mt-8 grid gap-8 md:grid-cols-3">

            <div className="md:col-span-2">

              <h2 className="text-2xl font-bold mb-4">
                About this video
              </h2>


              <p className="text-white/75 leading-8">
                {seo?.seoDescription ||
                  "Sri Lanka backcountry video from My Journal."}
              </p>

            </div>


            <aside className="rounded-2xl bg-white/5 p-5">

              <h2 className="font-bold mb-4">
                Video information
              </h2>


              <dl className="space-y-3 text-sm">

                {/* -------------------------------------------------
                    Location
                ------------------------------------------------- */}

                {(seo?.locality ||
                  seo?.district ||
                  seo?.province) && (
                    <div>
                      <dt className="text-white/50">
                        Location
                      </dt>

                      <dd>
                        {[
                          seo?.locality,
                          seo?.district,
                          seo?.province,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </dd>
                    </div>
                  )}


                {/* -------------------------------------------------
                    Published
                ------------------------------------------------- */}

                {seo?.uploadDate && (
                  <div>
                    <dt className="text-white/50">
                      Published
                    </dt>

                    <dd>
                      {new Date(
                        seo.uploadDate
                      ).toLocaleDateString()}
                    </dd>
                  </div>
                )}


                {/* -------------------------------------------------
                    Duration
                ------------------------------------------------- */}

                {seo?.duration && (
                  <div>
                    <dt className="text-white/50">
                      Duration
                    </dt>

                    <dd>
                      {seo.duration}
                    </dd>
                  </div>
                )}

              </dl>

            </aside>

          </section>


          {/* =========================================================
              MORE VIDEOS
          ========================================================= */}

          {Array.isArray(allVideos) &&
            allVideos.length > 1 && (
              <section className="mt-12">

                <h2 className="text-2xl font-bold mb-5">
                  More Sri Lanka videos
                </h2>


                <div className="grid md:grid-cols-3 gap-5">

                  {allVideos
                    .filter(
                      (item) =>
                        item &&
                        item.id !== video.id
                    )
                    .slice(0, 6)
                    .map(
                      (item, index) => {

                        const itemSEO =
                          buildAutomaticVideoSEO(
                            item,
                            index
                          );


                        const itemUrl =
                          getVideoPageUrl(
                            itemSEO,
                            index
                          );


                        const itemVideoId =
                          itemSEO?.youtubeId ||
                          getYouTubeId(
                            itemSEO?.url ||
                            item?.url
                          );


                        const itemThumbnail =
                          itemSEO?.thumbnailUrl ||
                          (
                            itemVideoId
                              ? `https://img.youtube.com/vi/${itemVideoId}/hqdefault.jpg`
                              : "/default-video-placeholder.jpg"
                          );


                        return (
                          <a
                            key={
                              item.id ||
                              item.url ||
                              `related-video-${index}`
                            }
                            href={itemUrl}
                            className="group"
                          >

                            <img
                              src={itemThumbnail}
                              alt={
                                itemSEO?.seoTitle ||
                                itemSEO?.title ||
                                `Sri Lanka video ${index + 1}`
                              }
                              title={
                                itemSEO?.seoTitle ||
                                itemSEO?.title ||
                                `Sri Lanka video ${index + 1}`
                              }
                              loading="lazy"
                              decoding="async"
                              className="w-full aspect-video object-cover rounded-xl"
                            />


                            <h3 className="mt-3 font-bold group-hover:underline">
                              {itemSEO?.seoTitle ||
                                itemSEO?.title ||
                                `Sri Lanka Video ${index + 1}`}
                            </h3>

                          </a>
                        );
                      }
                    )}

                </div>

              </section>
            )}

        </article>
      </main>
    );
  }
);



// =======================================================================
// VIDEO GALLERY
// =======================================================================
//
// Visual/modal gallery:
//
//     /videos
//
// Individual crawlable pages:
//
//     /videos/<slug>
//
// IMPORTANT:
//
// The modal is a presentation layer.
//
// The:
//
//     <a href="/videos/<slug">...</a>
//
// links remain crawlable.
//
// The player itself ALWAYS uses:
//
//     getYouTubeId()
//          ↓
//     buildYouTubeEmbedUrl()
//
// IMPORTANT SEO RULE:
//
// This component does NOT call updateSEO().
//
// Section 34 is the single owner of document-level video/gallery SEO.
//
// =======================================================================

export const VideoGallery =
  React.memo(
    ({
      videos,
      initialIndex = 0,
      onClose
    }) => {

      // -----------------------------------------------------------------
      // Normalize + SEO
      // -----------------------------------------------------------------

      const videoList =
        useMemo(
          () => {
            const normalized =
              normalizeVideoRecords(
                videos
              );

            return normalizeVideoSEORecords(
              normalized
            );
          },
          [videos]
        );


      // -----------------------------------------------------------------
      // Active index
      // -----------------------------------------------------------------

      const [
        activeIndex,
        setActiveIndex
      ] = useState(
        Math.max(
          0,
          Number(initialIndex) || 0
        )
      );


      const safeActiveIndex = videoList.length > 0
        ? activeIndex % videoList.length
        : 0;


      // -----------------------------------------------------------------
      // Current video
      // -----------------------------------------------------------------

      const currentVideo = videoList[safeActiveIndex];


      // -----------------------------------------------------------------
      // Current video SEO
      // -----------------------------------------------------------------

      const currentVideoSEO =
        currentVideo
          ? buildAutomaticVideoSEO(
            currentVideo,
            safeActiveIndex
          )
          : null;


      // -----------------------------------------------------------------
      // Validated YouTube ID
      // -----------------------------------------------------------------

      const videoId =
        currentVideoSEO?.youtubeId ||
        getYouTubeId(
          currentVideoSEO?.url ||
          currentVideo?.url
        );


      // -----------------------------------------------------------------
      // Safe embed URL
      // -----------------------------------------------------------------

      const embedUrl =
        videoId
          ? buildYouTubeEmbedUrl(
            videoId,
            {
              autoplay: true,
              rel: false
            }
          )
          : null;


      // -----------------------------------------------------------------
      // Close handler
      // -----------------------------------------------------------------
      //
      // IMPORTANT:
      //
      // updateSEO() is intentionally NOT called here.
      //
      // Section 34 reacts to the controller state after onClose()
      // and restores the appropriate document SEO.
      //
      // -----------------------------------------------------------------

      const handleClose =
        useCallback(
          (event) => {
            if (event) {
              event.stopPropagation();
            }

            if (
              window.location.pathname ===
              "/videos"
            ) {
              if (
                window.history.length >
                1
              ) {
                window.history.back();
              } else {
                window.history.replaceState(
                  {
                    modalOpen: false
                  },
                  "",
                  "/"
                );
              }
            }

            if (
              typeof onClose ===
              "function"
            ) {
              onClose();
            }
          },
          [onClose]
        );


      // -----------------------------------------------------------------
      // Gallery lifecycle
      // -----------------------------------------------------------------

      useEffect(() => {
        const scrollY =
          window.scrollY;

        document.body.classList.add(
          "modal-open"
        );


        // ---------------------------------------------------------------
        // IMPORTANT:
        //
        // Only push /videos when opening the modal from another route.
        //
        // Never overwrite:
        //
        //     /videos/<slug>
        //
        // ---------------------------------------------------------------

        if (
          window.location.pathname !==
          "/videos"
        ) {
          window.history.pushState(
            {
              modalOpen: true,
              videoGallery: true
            },
            "",
            "/videos"
          );
        }


        const handleKeyDown =
          (event) => {

            if (
              event.key ===
              "Escape"
            ) {
              handleClose();
              return;
            }


            if (
              event.key ===
              "ArrowRight" &&
              videoList.length > 1
            ) {
              setActiveIndex(
                (previous) =>
                  ((previous % videoList.length) + 1) % videoList.length
              );
            }


            if (
              event.key ===
              "ArrowLeft" &&
              videoList.length > 1
            ) {
              setActiveIndex(
                (previous) =>
                  ((previous % videoList.length) - 1 + videoList.length) % videoList.length
              );
            }
          };


        const handlePopState =
          () => {
            if (
              typeof onClose ===
              "function"
            ) {
              onClose();
            }
          };


        window.addEventListener(
          "keydown",
          handleKeyDown
        );

        window.addEventListener(
          "popstate",
          handlePopState
        );


        return () => {
          document.body.classList.remove(
            "modal-open"
          );

          window.scrollTo(
            0,
            scrollY
          );

          window.removeEventListener(
            "keydown",
            handleKeyDown
          );

          window.removeEventListener(
            "popstate",
            handlePopState
          );
        };
      }, [
        handleClose,
        onClose,
        videoList.length
      ]);


      // -----------------------------------------------------------------
      // IMPORTANT SEO CHANGE
      // -----------------------------------------------------------------
      //
      // Removed the old local updateSEO() effect.
      //
      // Section 34 now owns:
      //
      //     isVideoGallery
      //     galleryVideos
      //
      // This prevents:
      //
      //     component SEO
      //          ↓
      //     master SEO
      //          ↓
      //     cleanup race
      //          ↓
      //     stale/empty document metadata
      //
      // -----------------------------------------------------------------


      // -----------------------------------------------------------------
      // Empty state
      // -----------------------------------------------------------------

      if (
        videoList.length === 0
      ) {
        return null;
      }


      // -----------------------------------------------------------------
      // Render
      // -----------------------------------------------------------------

      return (
        <div className="fixed inset-0 z-[10000] bg-slate-900/98 backdrop-blur-3xl flex flex-col animate-in fade-in duration-200 select-none">

          {/* ===========================================================
              HEADER
          =========================================================== */}

          <header className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">

            <div className="min-w-0">

              <Breadcrumbs
                className="mb-2 text-[10px] text-white/60"
                items={[
                  { label: "My Journal", href: "/" },
                  { label: "Videos" },
                ]}
              />

              <h3 className="text-white font-black uppercase tracking-widest text-xs">
                Video Journal
              </h3>

              <p className="text-[10px] text-indigo-400 font-bold uppercase">
                {safeActiveIndex + 1}{" "}
                of{" "}
                {videoList.length}{" "}
                Clips
              </p>

            </div>


            <div className="flex items-center gap-3">

              <a
                href="https://www.youtube.com/@myjournalview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm"
              >
                <Video className="w-4 h-4" />

                <span>
                  Visit Channel
                </span>
              </a>


              <button
                type="button"
                onClick={handleClose}
                aria-label="Close video gallery"
                className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-white"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

          </header>


          {/* ===========================================================
              CRAWLER-ACCESSIBLE VIDEO CONTEXT
          =========================================================== */}

          <div
            className="sr-only"
            itemScope
            itemType="https://schema.org/VideoGallery"
          >

            <h2 itemProp="name">
              Video Journal and Aerial Highlights Archive
            </h2>


            <p itemProp="description">
              Explore the My Journal video archive
              featuring Sri Lanka backcountry landscapes,
              trails, natural attractions, aerial perspectives
              and field recordings.
              This collection contains{" "}
              {videoList.length}{" "}
              video entries.
            </p>


            {videoList.map(
              (video, index) => {

                const seo =
                  buildAutomaticVideoSEO(
                    video,
                    index
                  );


                const videoPageUrl =
                  getVideoPageUrl(
                    video,
                    index
                  );


                const seoVideoId =
                  seo?.youtubeId ||
                  getYouTubeId(
                    seo?.url
                  );


                const seoEmbedUrl =
                  seoVideoId
                    ? buildYouTubeEmbedUrl(
                      seoVideoId
                    )
                    : null;


                return (
                  <article
                    key={
                      video.id ||
                      video.url ||
                      `seo-video-${index}`
                    }
                    itemScope
                    itemProp="video"
                    itemType="https://schema.org/VideoObject"
                  >

                    <h3 itemProp="name">
                      {seo?.seoTitle ||
                        seo?.title ||
                        `Sri Lanka Backcountry Video ${index + 1}`}
                    </h3>


                    <a
                      itemProp="url"
                      href={videoPageUrl}
                    >
                      View video:{" "}
                      {seo?.title ||
                        `Video ${index + 1}`}
                    </a>


                    <meta
                      itemProp="description"
                      content={
                        seo?.seoDescription ||
                        `Sri Lanka backcountry video ${index + 1}.`
                      }
                    />


                    {seo?.thumbnailUrl && (
                      <meta
                        itemProp="thumbnailUrl"
                        content={
                          seo.thumbnailUrl
                        }
                      />
                    )}


                    {seo?.uploadDate && (
                      <meta
                        itemProp="uploadDate"
                        content={
                          new Date(
                            seo.uploadDate
                          ).toISOString()
                        }
                      />
                    )}


                    {seo?.duration && (
                      <meta
                        itemProp="duration"
                        content={
                          seo.duration
                        }
                      />
                    )}


                    {seoEmbedUrl && (
                      <meta
                        itemProp="embedUrl"
                        content={
                          seoEmbedUrl
                        }
                      />
                    )}

                  </article>
                );
              }
            )}

          </div>


          {/* ===========================================================
              MAIN CONTENT
          =========================================================== */}

          <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 overflow-hidden">

            {/* =========================================================
                ACTIVE PLAYER
            ========================================================= */}

            <div className="flex-none lg:flex-1 w-full flex items-center justify-center relative min-h-[40vh] lg:min-h-0">

              <div className="relative w-full max-w-5xl aspect-video rounded-[2rem] overflow-hidden bg-black border border-white/10 shadow-2xl">

                {videoId &&
                  embedUrl ? (
                  <iframe
                    key={videoId}
                    src={embedUrl}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={
                      currentVideoSEO?.seoTitle ||
                      currentVideoSEO?.title ||
                      "My Journal Video Player"
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/50 text-sm px-6 text-center">

                    <span>
                      Invalid or Unsupported Video URL
                    </span>


                    {currentVideoSEO?.url && (
                      <span className="mt-2 text-xs text-white/30 break-all">
                        Unable to extract a YouTube video ID.
                      </span>
                    )}

                  </div>
                )}

              </div>

            </div>


            {/* =========================================================
                PLAYLIST
            ========================================================= */}

            <aside className="w-full lg:w-80 flex-1 lg:flex-none flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-20 lg:pb-0 min-h-0">

              <h4 className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2 px-1">
                More Videos
              </h4>


              {videoList.map(
                (item, index) => {

                  const itemSEO =
                    buildAutomaticVideoSEO(
                      item,
                      index
                    );


                  const listVideoId =
                    itemSEO?.youtubeId ||
                    getYouTubeId(
                      itemSEO?.url ||
                      item?.url
                    );


                  const thumbnailUrl =
                    itemSEO?.thumbnailUrl ||
                    (
                      listVideoId
                        ? `https://img.youtube.com/vi/${listVideoId}/hqdefault.jpg`
                        : "/default-video-placeholder.jpg"
                    );


                  const isActive =
                    safeActiveIndex ===
                    index;


                  const videoPageUrl =
                    getVideoPageUrl(
                      item,
                      index
                    );


                  return (
                    <a
                      key={
                        item.id ||
                        item.url ||
                        index
                      }
                      href={videoPageUrl}
                      onClick={(event) => {

                        /*
                         * Preserve the existing modal playlist UX.
                         *
                         * The href remains crawlable for:
                         *
                         *     search engines
                         *     right-click/open-new-tab
                         *     accessibility
                         *
                         * Normal left-click changes the active
                         * modal video instead of navigating away.
                         */

                        event.preventDefault();

                        setActiveIndex(
                          index
                        );
                      }}
                      className={`group flex items-start gap-3 w-full text-left p-2 rounded-xl transition-all ${isActive
                        ? "bg-white/10 border border-indigo-500"
                        : "hover:bg-white/5 border border-transparent"
                        }`}
                      aria-current={
                        isActive
                          ? "true"
                          : undefined
                      }
                    >

                      {/* =================================================
                          THUMBNAIL
                      ================================================= */}

                      <div className="relative w-24 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">

                        <img
                          src={thumbnailUrl}
                          alt={
                            itemSEO?.seoTitle ||
                            itemSEO?.title ||
                            `Video thumbnail for ${itemSEO?.locality ||
                            "Sri Lanka"
                            }`
                          }
                          title={
                            itemSEO?.seoTitle ||
                            itemSEO?.title ||
                            `Sri Lanka video ${index + 1}`
                          }
                          loading={
                            index < 3
                              ? "eager"
                              : "lazy"
                          }
                          decoding="async"
                          className={`w-full h-full object-cover transition-opacity ${isActive
                            ? "opacity-100"
                            : "opacity-70 group-hover:opacity-100"
                            }`}
                          onError={(event) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              "/default-video-placeholder.jpg";
                          }}
                        />


                        {isActive && (
                          <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">

                            <Play className="w-4 h-4 text-white fill-white" />

                          </div>
                        )}

                      </div>


                      {/* =================================================
                          TITLE
                      ================================================= */}

                      <div className="flex-1 overflow-hidden">

                        <p
                          className={`text-xs font-semibold line-clamp-2 ${isActive
                            ? "text-white"
                            : "text-slate-300"
                            }`}
                        >
                          {itemSEO?.title ||
                            "Journal Entry"}
                        </p>


                        {itemSEO?.locality && (
                          <p className="text-[10px] text-slate-500 mt-1 truncate">
                            {itemSEO.locality}
                          </p>
                        )}

                      </div>

                    </a>
                  );
                }
              )}

            </aside>

          </main>

        </div>
      );
    }
  );

/**
 * ============================================================
 * MAP COMPONENT
 * ============================================================
 */


export const MapComponent = ({
  places = [],
  nearbyAttractions = [],
  routeAmenities = { gas_stations: [], restaurants: [], lodgings: [] },
  userCoords,
  selectedRoute = [],
  hoveredPlaceId,
  setHoveredPlaceId,
  fetchAttractions,
  setRouteDistance,
  setRouteData,
  mapInstanceRef,
  handleOpenArticle,

  isNearbySearchEnabled = false,

}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRegistryRef = useRef({});
  const userMarkerRef = useRef(null);

  // Active Polyline Ref
  const routeLineRef = useRef(null);

  // OpenRouteService API Key from environment variables
  const ORS_KEY = import.meta.env.VITE_ORS_KEY;

  // Debounce user coordinates for routing to prevent API rate limits (HTTP 429)
  const debouncedUserCoords = useDebounce(userCoords, 3000);

  // Helper for Category Hex Colors
  const getCategoryHex = (category) => {
    const categoryColors = {
      gas_station: '#e11d48',
      restaurant: '#f59e0b',
      lodging: '#8b5cf6',
      attraction: '#06b6d4',
      Location: '#64748b'
    };

    return categoryColors[category] || '#64748b';
  };

  const getSlug = (item) => {
    const text = item.slug || item.place_name || item.name || '';
    return generateSlug(text);
  };

  // Helper to standardise line rendering across services
  const renderPolyline = (
    pathCoords,
    color = '#ef4444',
    dashArray = null
  ) => {
    if (routeLineRef.current && mapInstance.current) {
      mapInstance.current.removeLayer(routeLineRef.current);
    }

    if (mapInstance.current && window.L) {
      routeLineRef.current = window.L.polyline(pathCoords, {
        color,
        weight: color === '#ef4444' ? 6 : 4,
        opacity: 0.9,
        lineJoin: 'round',
        ...(dashArray && { dashArray })
      }).addTo(mapInstance.current);

      mapInstance.current.fitBounds(
        routeLineRef.current.getBounds(),
        { padding: [50, 50] }
      );
    }
  };

  // Helper to update state metrics
  const updateRouteMetrics = useCallback((
    distKm,
    durationMins,
    pathCoords = []
  ) => {
    if (setRouteDistance) {
      setRouteDistance(distKm);
    }

    if (setRouteData) {
      setRouteData({
        active: true,
        distance: distKm,
        duration: durationMins,
        coordinates: pathCoords
      });
    }
  }, [setRouteDistance, setRouteData]);

  // -------------------------------------------------------------
  // 1. Initialize Map & User Location Marker
  // -------------------------------------------------------------
  useEffect(() => {
    const L = window.L;

    if (!L) return;

    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView(
        [
          userCoords?.lat || 7.0777,
          userCoords?.lng || 79.8924
        ],
        10
      );

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri'
        }
      ).addTo(mapInstance.current);

      if (mapInstanceRef) {
        mapInstanceRef.current = mapInstance.current;
      }
    }

    if (
      mapInstance.current &&
      userCoords?.lat &&
      userCoords?.lng
    ) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker(
          [
            userCoords.lat,
            userCoords.lng
          ],
          {
            radius: 10,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 3,
            fillOpacity: 0.9,
            zIndexOffset: 1000
          }
        )
          .addTo(mapInstance.current)
          .bindTooltip('You are here');
      } else {
        userMarkerRef.current.setLatLng([
          userCoords.lat,
          userCoords.lng
        ]);
      }
    }
  }, [userCoords, mapInstanceRef]);

  // -------------------------------------------------------------
  // 2. Dynamic Marker Management
  //
  // Nearby Places remain controlled ONLY by
  // isNearbySearchEnabled.
  //
  // "+ Maps" has NO effect on this section.
  // -------------------------------------------------------------
  useEffect(() => {
    const L = window.L;

    if (!mapInstance.current || !L) return;

    // -----------------------------------------------------------
    // Normalize Saved Places
    // -----------------------------------------------------------
    const normalizedPlaces = (places || [])
      .filter(
        p =>
          !p.isNearby ||
          [
            'gas_station',
            'restaurant',
            'lodging',
            'Gas Station',
            'Restaurant',
            'Lodging'
          ].includes(p.category)
      )
      .map(p => {
        let mappedCategory = p.category || 'Location';
        let registryPrefix = 'place';

        if (
          p.category === 'Gas Station' ||
          p.category === 'gas_station'
        ) {
          mappedCategory = 'gas_station';
          registryPrefix = 'gas';
        } else if (
          p.category === 'Restaurant' ||
          p.category === 'restaurant'
        ) {
          mappedCategory = 'restaurant';
          registryPrefix = 'rest';
        } else if (
          p.category === 'Lodging' ||
          p.category === 'lodging'
        ) {
          mappedCategory = 'lodging';
          registryPrefix = 'hotel';
        }

        return {
          ...p,
          category: mappedCategory,
          lat: p.latitude ?? p.lat,
          lng: p.longitude ?? p.lng,
          title:
            p.place_name ||
            p.name ||
            'Location',
          registryKey:
            `${registryPrefix}-${p.id}`,
          isSavedPlace: true
        };
      });

    // -----------------------------------------------------------
    // Nearby Attractions
    //
    // CONTROLLED ONLY BY isNearbySearchEnabled
    // -----------------------------------------------------------
    const normalizedAttractions =
      isNearbySearchEnabled
        ? (nearbyAttractions || []).map(a => ({
          ...a,
          category: 'attraction',
          lat: a.lat,
          lng: a.lng,
          title: a.name || 'Attraction',
          registryKey: `attr-${a.id}`,
        }))
        : [];

    // -----------------------------------------------------------
    // Nearby Gas Stations
    //
    // CONTROLLED ONLY BY isNearbySearchEnabled
    // -----------------------------------------------------------
    const normalizedGas =
      isNearbySearchEnabled
        ? (routeAmenities?.gas_stations || []).map(g => ({
          ...g,
          category: 'gas_station',
          lat: g.lat,
          lng: g.lng,
          title: g.name || 'Fuel Station',
          registryKey: `gas-${g.id}`,
        }))
        : [];

    // -----------------------------------------------------------
    // Nearby Restaurants
    //
    // CONTROLLED ONLY BY isNearbySearchEnabled
    // -----------------------------------------------------------
    const normalizedRestaurants =
      isNearbySearchEnabled
        ? (routeAmenities?.restaurants || []).map(r => ({
          ...r,
          category: 'restaurant',
          lat: r.lat,
          lng: r.lng,
          title: r.name || 'Restaurant',
          registryKey: `rest-${r.id}`,
        }))
        : [];

    // -----------------------------------------------------------
    // Nearby Lodgings
    //
    // CONTROLLED ONLY BY isNearbySearchEnabled
    // -----------------------------------------------------------
    const normalizedLodgings =
      isNearbySearchEnabled
        ? (routeAmenities?.lodgings || []).map(h => ({
          ...h,
          category: 'lodging',
          lat: h.lat,
          lng: h.lng,
          title: h.name || 'Hotel/Lodging',
          registryKey: `hotel-${h.id}`,
        }))
        : [];

    // -----------------------------------------------------------
    // Combine all active layers
    // -----------------------------------------------------------
    const allItems = [
      ...normalizedPlaces,
      ...normalizedAttractions,
      ...normalizedGas,
      ...normalizedRestaurants,
      ...normalizedLodgings
    ];

    const currentKeys = new Set(
      allItems.map(item => item.registryKey)
    );

    // -----------------------------------------------------------
    // Cleanup markers removed when toggle turns OFF
    // or state updates
    // -----------------------------------------------------------
    Object.keys(
      markerRegistryRef.current
    ).forEach(key => {
      if (!currentKeys.has(key)) {
        mapInstance.current.removeLayer(
          markerRegistryRef.current[key]
        );

        delete markerRegistryRef.current[key];
      }
    });

    // -----------------------------------------------------------
    // Render & Update Active Markers
    // -----------------------------------------------------------
    allItems.forEach(item => {
      if (
        item.lat == null ||
        item.lng == null
      ) {
        return;
      }

      const isSelected =
        selectedRoute.some(
          p => p.id === item.id
        );

      const isHovered =
        hoveredPlaceId === item.id;

      let markerColor =
        getCategoryHex(item.category);

      if (item.status === 'pending') {
        markerColor = '#f97316';
      } else if (item.status === 'done') {
        markerColor = '#10b981';
      }

      if (isSelected) {
        markerColor = '#3b82f6';
      } else if (isHovered) {
        markerColor = '#10b981';
      }

      const radius =
        (isSelected || isHovered)
          ? 9
          : 6;

      const slug = getSlug(item);

      const isPublished =
        item.status === 'done';

      const placeUrl =
        isPublished
          ? `/place/${slug}`
          : null;

      const popupContent = `
        <div class="map-popup-node">
          <a
            ${isPublished
          ? `href="${placeUrl}"`
          : `href="javascript:void(0);"`
        }
            class="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
          >
            ${item.title}
          </a>
        </div>
      `;

      let marker =
        markerRegistryRef.current[
        item.registryKey
        ];

      if (!marker) {
        marker = L.circleMarker(
          [
            item.lat,
            item.lng
          ],
          {
            radius,
            fillColor: markerColor,
            color: '#ffffff',
            weight: 2,
            fillOpacity: 1,
            pane: 'markerPane'
          }
        );

        if (item.isSavedPlace) {
          marker.bindPopup(
            popupContent
          );
        } else {
          marker.bindTooltip(
            item.title
          );
        }

        marker.addTo(
          mapInstance.current
        );

        markerRegistryRef.current[
          item.registryKey
        ] = marker;
      } else {
        marker.setStyle({
          fillColor: markerColor,
          radius
        });

        if (item.isSavedPlace) {
          marker.setPopupContent(
            popupContent
          );
        } else {
          marker.setTooltipContent(
            item.title
          );
        }
      }

      // ---------------------------------------------------------
      // Refresh Click Handlers
      // ---------------------------------------------------------
      marker.off('click');

      marker.on('click', () => {
        if (setHoveredPlaceId) {
          setHoveredPlaceId(item.id);
        }

        // -------------------------------------------------------
        // Nearby Places action
        //
        // STRICTLY controlled by isNearbySearchEnabled.
        // "+ Maps" does NOT affect this.
        // -------------------------------------------------------
        if (
          item.isSavedPlace &&
          fetchAttractions &&
          isNearbySearchEnabled
        ) {
          fetchAttractions(
            item.lat,
            item.lng
          );
        }

        if (
          typeof handleOpenArticle ===
          'function'
        ) {
          handleOpenArticle(item);
        } else if (
          isPublished &&
          placeUrl
        ) {
          window.history.pushState(
            { placeId: item.id },
            '',
            placeUrl
          );
        }
      });

      // ---------------------------------------------------------
      // Intercept Popup Links for SPA Navigation
      // ---------------------------------------------------------
      if (item.isSavedPlace) {
        marker.off('popupopen');

        marker.on(
          'popupopen',
          (e) => {
            const popupNode =
              e.popup.getElement();

            const anchor =
              popupNode?.querySelector(
                'a'
              );

            if (anchor) {
              anchor.onclick = (
                evt
              ) => {
                evt.preventDefault();

                if (
                  typeof handleOpenArticle ===
                  'function'
                ) {
                  handleOpenArticle(
                    item
                  );
                } else if (
                  isPublished &&
                  placeUrl
                ) {
                  window.history.pushState(
                    { placeId: item.id },
                    '',
                    placeUrl
                  );
                }
              };
            }
          }
        );
      }
    });
  }, [
    places,
    nearbyAttractions,
    routeAmenities,
    selectedRoute,
    hoveredPlaceId,
    fetchAttractions,
    setHoveredPlaceId,
    handleOpenArticle,

    // Nearby Places dependency ONLY
    isNearbySearchEnabled
  ]);

  // -------------------------------------------------------------
  // 3. Routing Engine
  //
  // Tiered Strategy:
  // OpenRouteService → Google Directions API
  // → Straight-line fallback
  //
  // This remains independent of both search toggles.
  // -------------------------------------------------------------
  useEffect(() => {
    if (
      !mapInstance.current ||
      !debouncedUserCoords
    ) {
      return;
    }

    if (selectedRoute.length === 0) {
      if (routeLineRef.current) {
        mapInstance.current.removeLayer(
          routeLineRef.current
        );

        routeLineRef.current = null;
      }

      if (setRouteDistance) {
        setRouteDistance(0);
      }

      if (setRouteData) {
        setRouteData(null);
      }

      return;
    }

    const destinationPlace =
      selectedRoute[
      selectedRoute.length - 1
      ];

    const destLat =
      destinationPlace?.latitude ??
      destinationPlace?.lat;

    const destLng =
      destinationPlace?.longitude ??
      destinationPlace?.lng;

    if (
      destLat == null ||
      destLng == null
    ) {
      console.warn(
        'Invalid destination coordinates for route calculation.'
      );

      return;
    }

    // -----------------------------------------------------------
    // Final Fallback: Dashed Straight Line
    // -----------------------------------------------------------
    const renderStraightLineFallback =
      () => {
        console.warn(
          'Rendering straight-line fallback.'
        );

        const fallbackCoords = [
          [
            debouncedUserCoords.lat,
            debouncedUserCoords.lng
          ],
          ...selectedRoute
            .map(p => [
              p.latitude ?? p.lat,
              p.longitude ?? p.lng
            ])
            .filter(
              ([lat, lng]) =>
                lat != null &&
                lng != null
            )
        ];

        renderPolyline(
          fallbackCoords,
          '#6366f1',
          '8, 8'
        );
      };

    // -----------------------------------------------------------
    // 2. Fallback Service: Google Directions API
    // -----------------------------------------------------------
    const calculateGoogleDirections =
      () => {
        if (
          !window.google ||
          !window.google.maps
        ) {
          console.warn(
            'Google Maps API unavailable; using straight-line fallback.'
          );

          renderStraightLineFallback();
          return;
        }

        const directionsService =
          new window.google.maps.DirectionsService();

        const origin =
          new window.google.maps.LatLng(
            debouncedUserCoords.lat,
            debouncedUserCoords.lng
          );

        const destination =
          new window.google.maps.LatLng(
            destLat,
            destLng
          );

        const waypoints =
          selectedRoute
            .slice(0, -1)
            .reduce(
              (acc, p) => {
                const lat =
                  p.latitude ?? p.lat;

                const lng =
                  p.longitude ?? p.lng;

                if (
                  lat != null &&
                  lng != null
                ) {
                  acc.push({
                    location:
                      new window.google.maps.LatLng(
                        lat,
                        lng
                      ),
                    stopover: true
                  });
                }

                return acc;
              },
              []
            );

        directionsService.route(
          {
            origin,
            destination,
            waypoints,
            optimizeWaypoints: false,
            travelMode:
              window.google.maps
                .TravelMode.DRIVING
          },
          (
            response,
            status
          ) => {
            if (
              status === 'OK' &&
              response?.routes?.[0]
            ) {
              const route =
                response.routes[0];

              const pathCoords =
                route.overview_path.map(
                  p => [
                    p.lat(),
                    p.lng()
                  ]
                );

              let totalDistMeters = 0;
              let totalTimeSecs = 0;

              route.legs.forEach(
                leg => {
                  totalDistMeters +=
                    leg.distance.value;

                  totalTimeSecs +=
                    leg.duration.value;
                }
              );

              const distKm =
                (
                  totalDistMeters /
                  1000
                ).toFixed(1);

              renderPolyline(
                pathCoords
              );

              updateRouteMetrics(
                distKm,
                Math.round(
                  totalTimeSecs /
                  60
                ),
                pathCoords
              );
            } else {
              console.warn(
                'Google Directions Request failed:',
                status
              );

              renderStraightLineFallback();
            }
          }
        );
      };

    // -----------------------------------------------------------
    // 1. Primary Service: OpenRouteService (Free)
    // -----------------------------------------------------------
    const calculateORS =
      async () => {
        try {
          const coordsList = [
            [
              debouncedUserCoords.lng,
              debouncedUserCoords.lat
            ]
          ];

          selectedRoute.forEach(
            p => {
              const lat =
                p.latitude ?? p.lat;

              const lng =
                p.longitude ?? p.lng;

              if (
                lat != null &&
                lng != null
              ) {
                coordsList.push([
                  lng,
                  lat
                ]);
              }
            }
          );

          const response =
            await fetch(
              'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
              {
                method: 'POST',
                headers: {
                  'Authorization':
                    ORS_KEY,
                  'Content-Type':
                    'application/json'
                },
                body: JSON.stringify({
                  coordinates:
                    coordsList
                })
              }
            );

          if (!response.ok) {
            throw new Error(
              `ORS HTTP Error: ${response.status}`
            );
          }

          const data =
            await response.json();

          const route =
            data.features[0];

          const pathCoords =
            route.geometry.coordinates.map(
              coord => [
                coord[1],
                coord[0]
              ]
            );

          const distKm =
            (
              route.properties
                .summary.distance /
              1000
            ).toFixed(1);

          const durationMins =
            Math.round(
              route.properties
                .summary.duration /
              60
            );

          renderPolyline(
            pathCoords
          );

          updateRouteMetrics(
            distKm,
            durationMins,
            pathCoords
          );
        } catch (error) {
          console.warn(
            'OpenRouteService failed. Falling back to Google Directions API...',
            error
          );

          calculateGoogleDirections();
        }
      };

    // -----------------------------------------------------------
    // Trigger primary service if key exists;
    // otherwise jump to secondary fallback
    // -----------------------------------------------------------
    if (ORS_KEY) {
      calculateORS();
    } else {
      calculateGoogleDirections();
    }
  }, [
    selectedRoute,
    debouncedUserCoords,
    setRouteData,
    setRouteDistance,
    ORS_KEY,
    updateRouteMetrics,
  ]);

  return (
    <div
      ref={mapRef}
      className="h-full w-full z-0"
    />
  );
};





export const NewsletterSubscribe = ({ supabaseClient }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabaseClient.from('subscribers').insert([{ email }]);
      if (error) {
        if (error.code === '23505') {
          toast.error("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Successfully subscribed to the journal!");
        setEmail('');
      }
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-10 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">
          Field Log Newsletter
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">
        Get notified instantly when a new backcountry location is fully mapped, verified, and updated from pending to complete.
      </p>
      <form onSubmit={handleSubscribe} className="relative">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address..."
          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-4 pr-12 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const LegalAndAboutModal = ({ isOpen, onClose, currentView, setView }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[11000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl h-[85vh] md:h-[75vh] rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs md:text-sm">
              {currentView === 'about' ? t('about.about_title', 'About Platform & Explorer') : t(`legal.${currentView}_title`, 'Legal Info')}
            </h2>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-0.5">
              {t('about.subtitle', 'My Journal Sri Lanka')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-500 hover:text-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y p-8 custom-scrollbar space-y-8 text-slate-600 dark:text-slate-300">
          <Breadcrumbs
            className="text-xs text-slate-500 dark:text-slate-400"
            items={[
              { label: t('common.title', 'My Journal'), href: '/' },
              {
                label: currentView === 'about'
                  ? t('footer.about', 'About')
                  : t(`legal.${currentView}_title`, currentView === 'terms' ? 'Terms of Service' : 'Privacy Policy'),
              },
            ]}
          />
          {currentView === 'about' ? (
            <>
              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Camera className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.myself_title', 'About Myself')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.myself_body', "Hi, I'm Hasitha Gunasekera. I'm an explorer, road-tripper, and outdoor photographer dedicated to tracking down unknown spaces across Sri Lanka. My true passion lies in backcountry trekking, remote high-altitude wilderness camping, and exploring uncharted waterfall cascades tucked deep within mountain ranges.")}
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.site_title', 'About the Site')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.site_body', "My Journal serves as a specialized, technical field log detailing remote coordinates, spatial records, and trail notes across Sri Lanka. Engineered to integrate backcountry mapping indicators, weather monitors, and route telemetry, it aims to connect adventure travelers safely to hidden destinations while establishing strict environmental safety standards.")}
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-700">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <MapIcon className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.spots_title', 'Sri Lankan Natural Attractions')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.spots_body', "Sri Lanka houses phenomenal geographic biodiversity, stretching from the dense mountain ridges of the Knuckles Forest Reserve to pristine cascade clusters like Bambarakanda and Diyaluma Falls. This open ledger indexes mountain plain tablelands, deep natural pools, and historic forest hermitages to showcase raw island terrain while advocating for strict nature preserve conservation metrics.")}
                </p>
              </section>

              <hr className="border-slate-100 dark:border-slate-800" />

              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-900">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
                  <h3 className="font-black uppercase tracking-widest text-xs">
                    {t('about.media_title', 'Media & Copyright')}
                  </h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed font-medium">
                  {t('about.media_body', "All photographic content featured on this platform is captured personally by me using my iPhone and Drone. Images undergo only light, mobile-device editing to preserve their raw, authentic essence. All rights to every photo are strictly reserved under my name, Hasitha Gunasekera. Unauthorized reproduction or commercial use is prohibited.")}
                </p>
              </section>
            </>
          ) : (
            <div className="space-y-6 text-sm leading-relaxed">
              {currentView === 'privacy' ? (
                <>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.privacy_s1_title')}</h3>
                    <p>{t('legal.privacy_s1_desc')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.privacy_s2_title')}</h3>
                    <p>{t('legal.privacy_s2_desc')}</p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.terms_s1_title')}</h3>
                    <p>{t('legal.terms_s1_desc')}</p>
                  </section>
                  <section>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-widest mb-2">{t('legal.terms_s2_title')}</h3>
                    <p>{t('legal.terms_s2_desc')}</p>
                  </section>
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center items-center gap-2 shrink-0">
          <button
            onClick={() => setView('privacy')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'privacy' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
          >
            {t('legal.btn_privacy', 'Privacy')}
          </button>
          <button
            onClick={() => setView('terms')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'terms' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
          >
            {t('legal.btn_terms', 'Terms')}
          </button>
          <button
            onClick={() => setView('about')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'about' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
          >
            {t('legal.btn_about', 'About Journal')}
          </button>
        </div>
      </div>
    </div>
  );
};


function SafetyOverlay({ location, isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  if (!isOpen || !location) return null;

  const restrictionLevel = String(location.restriction_level || "").trim().toLowerCase();
  const isHighRisk = ["high", "restricted"].includes(restrictionLevel);
  const currentLang = i18n.language || "en";
  const placeName = getLocalizedValue(location, "place_name", currentLang);
  const locality = getLocalizedValue(location, "locality", currentLang);
  const governingOrg = location.governing_org || t("safety_overlay.default_authority", {
    defaultValue: "local administrative departments",
  });

  const theme = {
    headerBg: isHighRisk ? "bg-orange-500" : "bg-blue-600",
    cardStyles: isHighRisk
      ? "bg-orange-50 border-orange-100 text-orange-900 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-300"
      : "bg-slate-50 border-slate-100 text-slate-800 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-300",
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all scale-100">
        <div className={`p-4 flex items-center justify-between text-white ${theme.headerBg}`}>
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span className="font-black uppercase text-xs tracking-widest">{t("safety_overlay.title")}</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors active:scale-95" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white leading-snug">{placeName}</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{locality}</p>
            <div className="mt-3"><RestrictionBadge level={location.restriction_level} /></div>
          </div>
          <div className="space-y-4 text-sm">
            <div className={`p-4 rounded-xl border leading-relaxed ${theme.cardStyles}`}>
              <p className="font-bold mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
                <ShieldCheck size={16} className={isHighRisk ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"} />
                {t("safety_overlay.notice_title")}
              </p>
              <p className="text-sm">
                {placeName} {t("safety_overlay.jurisdiction")} <span className="font-bold text-slate-900 dark:text-white">{governingOrg}</span>.
                {isHighRisk
                  ? <span className="block mt-2 font-medium">{t("safety_overlay.controlled")}</span>
                  : <span className="block mt-2 font-medium">{t("safety_overlay.guidelines")}</span>}
              </p>
            </div>
            <p className="text-[10px] leading-relaxed italic text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              {t("safety_overlay.footer_disclaimer")}
            </p>
          </div>
          <button onClick={onClose} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all duration-150 shadow-sm">
            {t("safety_overlay.button")}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [initialRouteState] = useState(getInitialAppRouteState);
  const initialPath = typeof window === 'undefined'
    ? '/'
    : window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const initialAddVisitType = initialRouteState.isAddOpen
    ? initialPath === '/add'
      ? 'Add Function'
      : 'Suggest Spot'
    : null;
  const [locationRevision, setLocationRevision] = useState(0);

  // ============================================================================
  // 18. MUTABLE APPLICATION REFERENCES (DOM & MAP INSTANCE REGISTRIES)
  // ============================================================================
  const lastLoggedArticleRef = useRef(null);
  const lastLoggedGalleryRef = useRef(null);
  const mapRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const markerRegistryRef = useRef({});
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const nearbyMarkersRef = useRef([]);
  const hasHandledDeepLink = useRef(false);
  const hasLoggedAddOpen = useRef(false);
  const hasLoggedPlanOpen = useRef(false);
  const pendingAddVisitTypeRef = useRef(initialAddVisitType);
  const hasLoggedMainPageRef = useRef(false);
  const pendingRouteRef = useRef({ type: null, slug: null });
  const sentinelRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLineRef = useRef(null);

  // ============================================================================
  // 19. TRANSLATION, LOCALIZATION, COOKIE CONSENT & PROMPTS
  // ============================================================================

  const { t, i18n } = useTranslation();

  const [translatedContent, setTranslatedContent] =
    useState(null);


  // ============================================================================
  // PERSISTENT CLIENT STORAGE: COOKIE CONSENT TRACKING
  // ============================================================================

  const [showCookieBanner, setShowCookieBanner] =
    useState(() => {
      if (typeof window !== 'undefined') {
        return (
          localStorage.getItem(
            'myjournal_cookie_consent'
          ) === null
        );
      }

      return false;
    });


  // ============================================================================
  // OS THEME TRACKER
  // ============================================================================
  //
  // The application follows the user's operating-system/browser theme.
  //
  // Light OS
  //     ↓
  // remove .dark
  //
  // Dark OS
  //     ↓
  // add .dark
  //
  // Existing Tailwind `dark:` classes remain active.
  //
  // Theme preference is intentionally NOT stored in localStorage.
  // This prevents an old "dark"/"light" value from overriding the
  // user's current operating-system preference.
  //
  // The MediaQueryList listener also allows the application to react
  // immediately when the OS/browser theme changes while the app is open.
  // ============================================================================

  // ============================================================================
  // OS THEME SYNCHRONIZATION
  // ============================================================================

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );

    // --------------------------------------------------------------------------
    // Apply theme to the document root.
    // --------------------------------------------------------------------------

    const applyTheme = (darkMode) => {
      const root = document.documentElement;

      if (darkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Keep browser-native controls aligned with the active theme.
      root.style.colorScheme = darkMode
        ? 'dark'
        : 'light';
    };

    // --------------------------------------------------------------------------
    // Initial synchronization.
    // --------------------------------------------------------------------------

    applyTheme(mediaQuery.matches);

    // --------------------------------------------------------------------------
    // React to operating-system/browser theme changes.
    // --------------------------------------------------------------------------

    const handleThemeChange = (event) => {
      const darkMode = event.matches;

      applyTheme(darkMode);
    };

    mediaQuery.addEventListener(
      'change',
      handleThemeChange
    );

    // --------------------------------------------------------------------------
    // Cleanup.
    // --------------------------------------------------------------------------

    return () => {
      mediaQuery.removeEventListener(
        'change',
        handleThemeChange
      );
    };
  }, []);


  // ============================================================================
  // NEWSLETTER PROMPT TRACKING
  // ============================================================================

  const [showNewsletterPrompt, setShowNewsletterPrompt] =
    useState(false);

  const [newsletterEmail, setNewsletterEmail] =
    useState('');

  const [isNewsletterSubmitting, setIsNewsletterSubmitting] =
    useState(false);


  // ============================================================================
  // 20. CORE UI, MODALS & OVERLAYS STATE
  // ============================================================================
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [viewingArticle, setviewingArticle] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingData, setSharingData] = useState(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(initialRouteState.isPrivacyOpen);
  const [legalView, setLegalView] = useState(initialRouteState.legalView);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // ============================================================================
  // 21. DATA LISTS, FILTERING & PAGINATION STATE
  // ============================================================================
  const [places, setPlaces] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState(() =>
    typeof window === "undefined" ? "All" : getCategoryFromSearch(window.location.search),
  );
  const statusFilter = 'done';
  const [sortBy, setSortBy] = useState('recent');
  const [selectedLocation, setSelectedLocation] = useState(null);


  // ============================================================================
  // 22. ADVENTURE ENGINE & ROUTE PLANNER STATE
  // ============================================================================
  const [isEngineOpen, setIsEngineOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(initialRouteState.isPlannerOpen);
  const [isPlannerExpanded, setIsPlannerExpanded] = useState(false);
  const [plannerSearch, setPlannerSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [userCoords, setUserCoords] = useState(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState(null);
  const [isNearbySearchEnabled, setIsNearbySearchEnabled] = useState(false);
  const [includeGooglePlaces, setIncludeGooglePlaces] = useState(false);

  // Data states for the markers
  const [routeAmenities, setRouteAmenities] = useState({
    gas_stations: [],
    restaurants: [],
    lodgings: []
  });

  // ============================================================================
  // 23. CONTENT CREATION & NEW LOCATION FORM STATE
  // ============================================================================
  const [isAddOpen, setIsAddOpen] = useState(initialRouteState.isAddOpen);
  const [addMapInstance, setAddMapInstance] = useState(null);

  const [formData, setFormData] = useState({
    place_name: '',
    locality: '',
    latitude: '',
    longitude: '',
    map_url: '',
    image_url: 'https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/my-journal-logo.png',
    status: 'backlog',
    category: 'Waterfall'
  });

  // ============================================================================
  // 24. SOCIAL INTERACTIONS & ENGAGEMENT STATE
  // ============================================================================
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [likes, setLikes] = useState({});
  const [shares, setShares] = useState(0);
  const [comments, setComments] = useState({});
  const [newCommentText, setnewCommentText] = useState('');

  // ============================================================================
  // 25. UI EXPANSION & ACTION NAVIGATION CONTROLS (FABs)
  // ============================================================================
  const locationGridScrollRef = useDragScroll();
  const articleWindowScrollRef = useDragScroll();

  // ============================================================================
  // 26. EXTERNAL METRIC UTILITIES (WEATHER, MAP POIs)
  // ============================================================================
  const [weatherData, setWeatherData] = useState({});
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const fetchedWeatherKeys = useRef(new Set());

  // ============================================================================
  // 27. VIDEO LIBRARY & MEDIA HUB STATE
  // ============================================================================

  const [videoLibrary, setVideoLibrary] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeVideos, setActiveVideos] = useState([]);

  // ---------------------------------------------------------------------------
  // Video detail / deep-link state
  // ---------------------------------------------------------------------------

  const [activeVideo, setActiveVideo] = useState(null);
  const [isVideoDetailOpen, setIsVideoDetailOpen] = useState(false);
  const [hasLoadedVideoLibrary, setHasLoadedVideoLibrary] = useState(false);

  const isVideoDetailRoute =
    typeof window !== "undefined" &&
    /^\/videos\/[^/]+$/i.test(
      window.location.pathname.replace(/\/+$/, "")
    );

  // ---------------------------------------------------------------------------
  // Fetch video library
  // ---------------------------------------------------------------------------

  const fetchVideoLibrary = useCallback(async () => {
    if (!supabaseClient) {
      setVideoLibrary([]);
      setHasLoadedVideoLibrary(true);
      return [];
    }

    try {
      const { data, error } = await supabaseClient
        .from("hub_videos")
        .select(`
        id,
        url,
        title,
        custom_thumbnail_url
      `)
        .eq("is_active", true)
        .order("display_order", {
          ascending: false,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error loading video library:",
          error
        );

        setVideoLibrary([]);

        return [];
      }

      const videos = Array.isArray(data)
        ? data
        : [];

      setVideoLibrary(videos);

      return videos;
    } catch (error) {
      console.error(
        "Error loading video library:",
        error
      );

      setVideoLibrary([]);

      return [];
    } finally {
      setHasLoadedVideoLibrary(true);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Load video library
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) void fetchVideoLibrary();
    });
    return () => {
      isMounted = false;
    };
  }, [fetchVideoLibrary]);

  // ---------------------------------------------------------------------------
  // Photo gallery close handler
  // ---------------------------------------------------------------------------

  const handleClosePhotoGallery = useCallback(() => {
    setActiveId(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Video gallery close handler
  // ---------------------------------------------------------------------------

  const handleCloseVideoGallery = useCallback(() => {
    setActiveVideos([]);
  }, []);


  // ============================================================================
  // 28. PERFORMANCE OPTIMIZATION & DEBOUNCED / DERIVED STATE
  // ============================================================================
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedPlannerSearch = useDebounce(plannerSearch, 300);

  /**
   * Data Pipeline Step 1: Distance calculation for saved places
   */
  const placesWithDistance = useMemo(() => {
    return (places || []).map(place => ({
      ...place,
      currentDistance: userCoords
        ? calculateDistance(userCoords.lat, userCoords.lng, place.latitude, place.longitude)
        : Infinity
    }));
  }, [places, userCoords]);

  /**
   * Data Pipeline Step 2: Combine and Deduplicate
   * Merges saved places with fetched Google places ONLY when nearby search is active.
   */
  const allPlaces = useMemo(() => {
    const DUPLICATE_THRESHOLD_KM = 0.5; // 500 meters

    // Strictly skip API data arrays when the toggle is OFF
    const combinedAPIPlaces = isNearbySearchEnabled
      ? [
        ...(nearbyAttractions || []),
        ...(routeAmenities?.gas_stations || []),
        ...(routeAmenities?.restaurants || []),
        ...(routeAmenities?.lodgings || [])
      ]
      : [];

    const normalizedNearby = combinedAPIPlaces.map(place => {
      const pLat = place.lat ?? place.latitude;
      const pLng = place.lng ?? place.longitude;
      return {
        ...place,
        id: place.id,
        place_name: place.name || place.place_name,
        category: place.category || 'Location',
        status: place.status || 'nearby',
        isNearby: true,
        latitude: pLat,
        longitude: pLng,
        cover_photo_url: place.image || place.cover_photo_url,
        currentDistance: userCoords
          ? calculateDistance(userCoords.lat, userCoords.lng, pLat, pLng)
          : Infinity
      };
    });

    const finalPlaces = [...placesWithDistance];
    const seenIds = new Set(finalPlaces.map(p => p.id));

    normalizedNearby.forEach(nearby => {
      if (!nearby.id || seenIds.has(nearby.id)) return;

      const isDuplicate = placesWithDistance.some(saved => {
        if (!saved.latitude || !saved.longitude || !nearby.latitude || !nearby.longitude) return false;
        const dist = calculateDistance(nearby.latitude, nearby.longitude, saved.latitude, saved.longitude);
        return dist < DUPLICATE_THRESHOLD_KM;
      });

      if (!isDuplicate) {
        finalPlaces.push(nearby);
        seenIds.add(nearby.id);
      }
    });

    return finalPlaces;
  }, [placesWithDistance, nearbyAttractions, routeAmenities, userCoords, isNearbySearchEnabled]);

  /**
   * Data Pipeline Step 3: Search, Filter, and Sort (Main List View)
   */
  const filteredPlaces = useMemo(() => {
    const search = (debouncedSearch || "").toLowerCase().trim();
    const searchTokens = search ? search.split(/\s+/) : [];

    const filtered = allPlaces.filter(place => {
      const matchesStatus =
        statusFilter === 'All' ||
        place.status === statusFilter ||
        (statusFilter === 'nearby' && place.isNearby);
      const matchesCategory = filterTag === 'All' || place.category === filterTag;

      if (!matchesStatus || !matchesCategory) return false;
      if (searchTokens.length === 0) return true;

      const searchableFields = [
        place.place_name,
        place.locality,
        place.category
      ].filter(Boolean).map(f => f.toLowerCase());

      return searchTokens.every(token =>
        searchableFields.some(field => field.includes(token))
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        if (a.isNearby && !b.isNearby) return -1;
        if (!a.isNearby && b.isNearby) return 1;

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

        if (dateA === 0 && dateB === 0) {
          return (a.place_name || "").localeCompare(b.place_name || "");
        }
        return dateB - dateA;
      }

      if (sortBy === 'distance') {
        const distA = a.currentDistance ?? Infinity;
        const distB = b.currentDistance ?? Infinity;
        return distA - distB;
      }

      return (a.place_name || "").localeCompare(b.place_name || "");
    });
  }, [allPlaces, statusFilter, filterTag, debouncedSearch, sortBy]);

  /**
   * Data Pipeline Step 4: Route Planner Multi-Tier Sorting & Corridor Filtering
   */
  const plannerFilteredPlaces = useMemo(() => {
    const search = (debouncedPlannerSearch || "").toLowerCase().trim();
    const tokens = search ? search.split(/\s+/) : [];

    const baseList = allPlaces.filter(p =>
      ['done', 'pending', 'backlog', 'bucket', 'nearby', 'gas_station', 'restaurant', 'lodging'].includes(p.status) ||
      ['gas_station', 'restaurant', 'lodging'].includes(p.category) ||
      p.isNearby
    );

    const searchedList = tokens.length === 0 ? baseList : baseList.filter(place => {
      const searchableFields = [
        place.place_name,
        place.locality,
        place.category
      ].filter(Boolean).map(f => f.toLowerCase());

      return tokens.every(token =>
        searchableFields.some(field => field.includes(token))
      );
    });

    const routeCoords = routeData?.coordinates || [];
    const MAX_CORRIDOR_DIST_KM = 15;

    // Calculate proximity to the route corridor
    const placesWithRouteProximity = searchedList.map(place => {
      const pLat = place.latitude ?? place.lat;
      const pLng = place.longitude ?? place.lng;

      let minDistanceToRoute = Infinity;

      if (routeCoords.length > 0 && pLat != null && pLng != null) {
        const step = Math.max(1, Math.floor(routeCoords.length / 80));
        for (let i = 0; i < routeCoords.length; i += step) {
          const rCoord = routeCoords[i];
          const rLat = Array.isArray(rCoord) ? rCoord[0] : rCoord.lat;
          const rLng = Array.isArray(rCoord) ? rCoord[1] : rCoord.lng;

          const dist = calculateDistance(pLat, pLng, rLat, rLng);
          if (dist < minDistanceToRoute) {
            minDistanceToRoute = dist;
          }
        }
      }

      return {
        ...place,
        minDistanceToRoute,
        isEnRoute: minDistanceToRoute <= MAX_CORRIDOR_DIST_KM
      };
    });

    // Multi-tier Sorting Logic
    return placesWithRouteProximity.sort((a, b) => {
      // 1. Route Priority: En-Route locations sit at top
      if (a.isEnRoute && !b.isEnRoute) return -1;
      if (!a.isEnRoute && b.isEnRoute) return 1;

      // 2. Saved Bucket List Priority
      const isBucketA = a.status === 'bucket';
      const isBucketB = b.status === 'bucket';
      if (isBucketA && !isBucketB) return -1;
      if (!isBucketA && isBucketB) return 1;

      // 3. Attractions Priority (Pushes fetched Google places higher than general backlog)
      if (a.isNearby && !b.isNearby) return -1;
      if (!a.isNearby && b.isNearby) return 1;

      // 4. Distance Priority
      if (a.isEnRoute && b.isEnRoute) {
        return a.minDistanceToRoute - b.minDistanceToRoute;
      }
      const distA = a.currentDistance ?? Infinity;
      const distB = b.currentDistance ?? Infinity;
      return distA - distB;
    });
  }, [allPlaces, debouncedPlannerSearch, routeData]);

  /**
   * Data Pipeline Step 5: Pagination Slice
   */
  const displayedPlaces = useMemo(() => {
    return filteredPlaces.slice(0, visibleCount);
  }, [filteredPlaces, visibleCount]);

  // ============================================================================
  // 29. EVENT HANDLERS & BUSINESS LOGIC
  // ============================================================================

  // ---------------------------------------------------------------------------
  // A. Localization, Prompts & Newsletter Handlers
  // ---------------------------------------------------------------------------
  const changeLanguage = (e) => {
    setTranslatedContent(null);
    i18n.changeLanguage(e.target.value);
  };

  const handleDismissNewsletterPrompt = () => {
    setShowNewsletterPrompt(false);
    localStorage.setItem('myjournal_newsletter_prompted', 'dismissed');
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const sanitizedEmail = newsletterEmail.trim();
    if (!sanitizedEmail) return;

    if (!supabaseClient) {
      toast.error("Database layer is not initialized.");
      return;
    }

    setIsNewsletterSubmitting(true);
    try {
      const { data: existingSubscriber, error: checkError } = await supabaseClient
        .from('subscribers')
        .select('email')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingSubscriber) {
        toast.error(t('newsletter.duplicate_message', "You are already subscribed to this expedition list!"));
        return;
      }

      const { error: insertError } = await supabaseClient
        .from('subscribers')
        .insert([{ email: sanitizedEmail }]);

      if (insertError) {
        if (insertError.code === '23505') {
          toast.error(t('newsletter.duplicate_message', "You are already subscribed to this expedition list!"));
          return;
        }
        throw insertError;
      }

      toast.success(t('newsletter.success_message', 'Welcome aboard! Subscription successful.'));
      setNewsletterEmail('');
      setShowNewsletterPrompt(false);
      localStorage.setItem('myjournal_newsletter_prompted', 'subscribed');

    } catch (err) {
      console.error("Supabase Newsletter Pipeline Failure:", err);
      if (err.code === '23505' || (err.message && err.message.includes('unique constraint'))) {
        toast.error(t('newsletter.duplicate_message', "You are already subscribed to this expedition list!"));
      } else {
        toast.error(err.message || "Subscription failed. Please try again.");
      }
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // B. Database & Content Management Handlers (Supabase)
  // ---------------------------------------------------------------------------
  const fetchPlaces = useCallback(async () => {
    try {
      const { data, error } = await supabaseClient
        .from('travel_bucket_list')
        .select(`
        id, 
        created_at,
        slug,
        place_name,
        locality, 
        category, 
        status, 
        cover_photo_url, 
        latitude, 
        longitude, 
        google_maps_url, 
        album_photos,
        restriction_level,
        governing_org,
        ai_article_preview:ai_article->story 
      `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const optimizedData = data.map(p => ({
        ...p,
        restriction_level: p.restriction_level || 'Open',
        hasArticle: !!p.ai_article_preview,
        ai_article: p.ai_article_preview ? { story: p.ai_article_preview.substring(0, 100) } : null
      }));

      setPlaces(optimizedData);
    } catch (err) {
      console.error("Fetch Error:", err.message);
      toast.error("Failed to load locations");
    }
  }, []);

  const handleOpenArticle = useCallback(async (place) => {
    if (!place) return;

    setTranslatedContent(null);
    const isPublished = place.status === 'done';
    const slug = getMediaSEOPlaceSlug(place);

    if (isPublished) {
      window.history.pushState({ placeId: place.id }, '', `/place/${slug}`);
      updateSEO(place, { isGallery: false });
    }

    setviewingArticle(place);
    setIsArticleOpen(true);

    if (place.ai_article?.isFullContent) return;

    try {
      const { data, error } = await supabaseClient
        .from('travel_bucket_list')
        .select('ai_article, restriction_level, governing_org')
        .eq('id', place.id)
        .single();

      if (error) throw error;

      if (data) {
        const hydratedPlace = {
          ...place,
          restriction_level: data.restriction_level || place.restriction_level || 'Open',
          governing_org: data.governing_org || place.governing_org || 'Department of Wildlife Conservation / Local Authority',
          ai_article: {
            ...data.ai_article,
            isFullContent: true
          }
        };

        setviewingArticle(hydratedPlace);
        setPlaces(prev => prev.map(p => (p.id === place.id ? hydratedPlace : p)));

        if (isPublished) {
          updateSEO(hydratedPlace, { isGallery: false });
        }
      }
    } catch (err) {
      console.error("Content Fetch Failure:", err);
      toast.error("Error loading article content");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // C. Social Interactions Handlers (Likes & Comments)
  // ---------------------------------------------------------------------------

  const invokeInteractionEvent = async (eventType, payload = {}) => {
    if (!supabaseClient) {
      throw new Error("Supabase client is unavailable.");
    }

    const { data, error } = await supabaseClient.functions.invoke(
      "track-visit",
      {
        body: {
          event_type: eventType,
          page_path: window.location.pathname,
          user_agent: navigator.userAgent || "",
          referrer: document.referrer
            ? document.referrer.toLowerCase()
            : "",
          is_webdriver: Boolean(navigator.webdriver),
          ...payload,
        },
      }
    );

    if (error) {
      throw error;
    }

    return data;
  };

  // ---------------------------------------------------------------------------
  // Fetch likes, comments and shares
  // ---------------------------------------------------------------------------
  //

  const fetchInteractions = useCallback(async () => {
    try {
      if (!supabaseClient) return;

      const [
        likesResponse,
        commentsResponse,
        sharesResponse,
      ] = await Promise.all([
        supabaseClient
          .from("location_likes")
          .select("location_id, ip_address"),

        supabaseClient
          .from("location_comments")
          .select("*")
          .order("created_at", {
            ascending: true,
          }),

        supabaseClient
          .from("location_shares")
          .select("location_id"),
      ]);

      if (likesResponse.error) {
        throw likesResponse.error;
      }

      if (commentsResponse.error) {
        throw commentsResponse.error;
      }

      if (sharesResponse.error) {
        throw sharesResponse.error;
      }

      // -----------------------------------------------------------------------
      // Structure likes
      //

      const structuredLikes = (
        likesResponse.data || []
      ).reduce((acc, curr) => {
        const locId = curr.location_id;

        if (!acc[locId]) {
          acc[locId] = {
            count: 0,
            isUserLiked: false,
          };
        }

        acc[locId].count += 1;

        return acc;
      }, {});

      // -----------------------------------------------------------------------
      // Group comments by location ID
      // -----------------------------------------------------------------------

      const groupedComments = (
        commentsResponse.data || []
      ).reduce((acc, curr) => {
        if (!acc[curr.location_id]) {
          acc[curr.location_id] = [];
        }

        acc[curr.location_id].push(curr);

        return acc;
      }, {});

      // -----------------------------------------------------------------------
      // Count shares by location ID
      // -----------------------------------------------------------------------

      const structuredShares = (
        sharesResponse.data || []
      ).reduce((acc, curr) => {
        const locId = curr.location_id;

        acc[locId] = (acc[locId] || 0) + 1;

        return acc;
      }, {});

      // -----------------------------------------------------------------------
      // Update component state
      // -----------------------------------------------------------------------

      setLikes(structuredLikes);
      setComments(groupedComments);
      setShares(structuredShares);

    } catch (err) {
      console.error(
        "Interaction Fetch Error:",
        err
      );
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Like / Unlike
  // ---------------------------------------------------------------------------
  //

  const handleLike = async (locationId) => {
    if (!locationId || !supabaseClient) return;

    const currentStatus =
      likes[locationId] || {
        count: 0,
        isUserLiked: false,
      };

    try {
      const result = await invokeInteractionEvent(
        currentStatus.isUserLiked
          ? "unlike"
          : "like",
        {
          location_id: locationId,
        }
      );

      const nextIsUserLiked =
        typeof result?.isUserLiked === "boolean"
          ? result.isUserLiked
          : !currentStatus.isUserLiked;

      const nextCount =
        Number.isFinite(Number(result?.count))
          ? Number(result.count)
          : currentStatus.isUserLiked
            ? Math.max(0, currentStatus.count - 1)
            : currentStatus.count + 1;

      setLikes((prev) => ({
        ...prev,
        [locationId]: {
          count: nextCount,
          isUserLiked: nextIsUserLiked,
        },
      }));

    } catch (err) {
      console.error(
        "Like interaction failed:",
        err
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Share event
  // ---------------------------------------------------------------------------
  //
  // IP / country / city are resolved server-side by track-visit.
  // ---------------------------------------------------------------------------

  const handleShareEvent = async (
    locationId,
    shareType = "article"
  ) => {
    // Localhost exclusion
    const host = window.location.hostname;

    if (
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      return;
    }

    // Owner mode exclusion
    const urlParams =
      new URLSearchParams(
        window.location.search
      );

    if (urlParams.get("mode") === "owner") {
      localStorage.setItem(
        "owner_auth_token",
        "owner"
      );
    }

    if (
      localStorage.getItem(
        "owner_auth_token"
      ) === "owner" ||
      !supabaseClient ||
      !locationId
    ) {
      return;
    }

    try {
      await invokeInteractionEvent(
        "share",
        {
          location_id: locationId,
          share_type: shareType,
        }
      );

      // Keep the local share counter immediately responsive.
      setShares((prev) => ({
        ...prev,
        [locationId]:
          (prev[locationId] || 0) + 1,
      }));

    } catch (err) {
      console.error(
        `[Analytics] Failed to log ${shareType} share event:`,
        err
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Open comments
  // ---------------------------------------------------------------------------

  const handleOpenComments = async (place) => {
    await handleOpenArticle(place);

    setTimeout(() => {
      const commentsSection =
        document.getElementById(
          "comments-discussion-section"
        );

      if (commentsSection) {
        commentsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 400);
  };

  // ---------------------------------------------------------------------------
  // Submit comment
  // ---------------------------------------------------------------------------
  //
  // The comment itself is submitted through the Edge Function so that
  // country/city/IP remain server-side.
  //
  // ---------------------------------------------------------------------------

  const submitComment = async (
    locationId,
    text
  ) => {
    if (
      !locationId ||
      !text?.trim() ||
      !supabaseClient
    ) {
      return;
    }

    try {
      const result =
        await invokeInteractionEvent(
          "comment",
          {
            location_id: locationId,
            comment_text: text.trim(),
          }
        );

      // The Edge Function should return the newly-created comment.
      const newComment =
        result?.comment || result?.data;

      if (newComment) {
        setComments((prev) => ({
          ...prev,
          [locationId]: [
            ...(prev[locationId] || []),
            newComment,
          ],
        }));
      } else {
        // Reload interaction state when the server does not return
        // the inserted comment.
        await fetchInteractions();
      }

    } catch (err) {
      console.error(
        "Comment submission failed:",
        err
      );
    }
  };

  // ===========================================================================
  // 30. Map, Route Planner & External Service Handlers
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 1. Core Map Callbacks & Memoized Components
  // ---------------------------------------------------------------------------
  const handleLocationSelect = useCallback((lat, lng, dist) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      locality: dist || prev.locality
    }));
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selectedRoute);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSelectedRoute(items); // Updates state and triggers map redraw
  };

  const MemoizedAddMap = useMemo(() => (
    <Suspense fallback={<div className="w-full h-full bg-slate-200 animate-pulse" />}>
      <MapSelectionComponent
        onMapReady={(map) => setAddMapInstance(map)}
        onLocationSelect={handleLocationSelect}
      />
    </Suspense>
  ), [handleLocationSelect]);

  // ---------------------------------------------------------------------------
  // 2. Data Fetching & External Service API Calls
  // ---------------------------------------------------------------------------

  const fetchRoutePlaceData = useCallback(async (coordsOrLat, optionalLng) => {
    let normalizedCoords;

    // 1. Normalize Route Coordinates
    if (Array.isArray(coordsOrLat)) {
      normalizedCoords = coordsOrLat
        .map(c => {
          if (Array.isArray(c)) return { lat: c[0], lng: c[1] };
          return { lat: c?.lat ?? c?.latitude, lng: c?.lng ?? c?.longitude };
        })
        .filter(c => c.lat != null && c.lng != null);
    } else if (typeof coordsOrLat === 'number' && typeof optionalLng === 'number') {
      normalizedCoords = [{ lat: coordsOrLat, lng: optionalLng }];
    } else {
      setNearbyAttractions([]);
      setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
      return;
    }

    if (normalizedCoords.length === 0) {
      setNearbyAttractions([]);
      setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
      return;
    }

    try {
      // Graceful fallback when Google Maps API / Places library is absent
      if (!window.google || !window.google.maps) {
        console.warn("Google Maps API unavailable; skipping route place fetch.");
        setNearbyAttractions([]);
        setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
        return;
      }

      const { PlacesService, PlacesServiceStatus } = await window.google.maps.importLibrary("places");
      if (!window.placesService) {
        window.placesService = new PlacesService(document.createElement('div'));
      }

      // 2. Sample Points along the Corridor (Up to 12 corridor points)
      const maxRequests = 12;
      const step = Math.max(1, Math.floor(normalizedCoords.length / maxRequests));
      const sampledPoints = normalizedCoords.filter((_, idx) => idx % step === 0).slice(0, maxRequests);

      // 3. Define Search Tasks (Radius set to 5000m corridor)
      const searchTasks = [
        { key: 'attractions', types: ['natural_feature', 'park'], radius: 5000 },
        { key: 'gas_stations', types: ['gas_station'], radius: 5000 },
        { key: 'restaurants', types: ['restaurant', 'cafe', 'food'], radius: 5000 },
        { key: 'lodgings', types: ['lodging', 'hotel'], radius: 5000 }
      ];

      // Slug helper fallback
      const createSlug = (text) => generateSlug(text);

      // Helper mapper for formatting place objects cleanly with consistent URL slugs
      const mapPlaceData = (place, categoryType) => {
        const pLat = place.geometry?.location?.lat ? place.geometry.location.lat() : null;
        const pLng = place.geometry?.location?.lng ? place.geometry.location.lng() : null;

        return {
          id: place.place_id,
          name: place.name || 'Unknown Location',
          slug: createSlug(place.name),
          category: categoryType,
          lat: pLat,
          lng: pLng,
          image: place.photos && place.photos.length > 0
            ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
            : 'https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/my-journal-logo.png',
          rating: place.rating || 0
        };
      };

      // Helper to sort by rating, cap strictly to 10 items max, and format objects
      const processCategoryResults = (items, category) => {
        return (items || [])
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)
          .map(p => mapPlaceData(p, category))
          .filter(p => p.lat != null && p.lng != null);
      };

      // 4. Run Concurrent Requests for each Task across sampled points
      const categoryResults = {};

      for (const task of searchTasks) {
        const searchPromises = sampledPoints.flatMap(point => {
          const location = new window.google.maps.LatLng(point.lat, point.lng);

          return task.types.map(targetType => {
            return new Promise((resolve) => {
              window.placesService.nearbySearch({
                location: location,
                radius: task.radius,
                type: targetType
              }, (results, status) => {
                if (status === PlacesServiceStatus.OK && results) {
                  resolve(results);
                } else {
                  console.warn(`Places API failed for ${targetType} with status: ${status}`);
                  resolve([]);
                }
              });
            });
          });
        });

        const allResultsArrays = await Promise.all(searchPromises);

        // Deduplicate results by place_id
        const uniqueMap = new Map();
        allResultsArrays.flat().forEach(place => {
          if (place && place.place_id && !uniqueMap.has(place.place_id)) {
            uniqueMap.set(place.place_id, place);
          }
        });

        categoryResults[task.key] = Array.from(uniqueMap.values());
      }

      // 5. Process & Filter Nature Attractions
      if (categoryResults.attractions) {
        const natureWords = new Set([
          'waterfall', 'viewpoint', 'peak', 'mountain', 'forest', 'reserve',
          'reservoir', 'lake', 'dam', 'river', 'falls', 'rock', 'cave',
          'beach', 'lagoon', 'conservation', 'stream', 'plateau', 'gorge', 'gap',
          'canyon', 'bay', 'cove', 'peninsula', 'island', 'reef', 'spring', 'sanctuary',
          'national', 'nature', 'biosphere', 'wilderness',
          'ella', 'kanda', 'gala', 'wewa', 'oya', 'ganga', 'kelle', 'hela', 'aranya', 'pokuna'
        ]);

        const commercialWords = new Set([
          'hotel', 'resort', 'villa', 'restaurant', 'cafe', 'bistro', 'inn', 'lodge',
          'stay', 'guesthouse', 'home', 'cottage', 'cabana', 'shop', 'store', 'bar',
          'spa', 'center', 'centre', 'suites', 'pvt', 'ltd', 'factory', 'ticket',
          'tours', 'agency', 'museum', 'gallery', 'boutique', 'retreat', 'glamping',
          'camp', 'safari', 'spice', 'gem', 'wood', 'rent', 'rental', 'club', 'pub',
          'lounge', 'mart', 'supermarket', 'studio', 'photography', 'inc', 'llc',
          'company', 'holdings', 'enterprises', 'estate', 'plantation', 'bungalow',
          'chalet', 'rooms', 'homestay', 'motel', 'tavern', 'jeep', 'cab', 'taxi',
          'tuktuk', 'skincare', 'bridal', 'sports', 'adventure', 'salon', 'beauty',
          'wellness', 'wedding', 'apparel', 'fashion', 'tailor', 'parlour', 'parlor',
          'fitness', 'gym', 'rafting', 'services', 'consultancy', 'care', 'clinic',
          'pharmacy', 'hardware', 'children', 'childrens', 'child', 'kids', 'kid',
          'playground', 'play', 'playarea', 'municipal', 'urban', 'memorial', 'jogging',
          'walking', 'recreation', 'recreational', 'amusement', 'town', 'city', 'public',
          'leisure', 'fun', 'waterpark'
        ]);

        const excludedTypes = [
          'store', 'restaurant', 'lodging', 'hotel', 'cafe', 'bar', 'shopping_mall',
          'taxi_stand', 'transit_station', 'bus_station', 'gas_station', 'car_repair',
          'finance', 'bank', 'atm', 'amusement_park', 'playground', 'place_of_worship',
          'church', 'hindu_temple', 'mosque', 'food', 'travel_agency', 'museum', 'casino',
          'bowling_alley', 'stadium', 'sports_complex', 'zoo', 'aquarium', 'art_gallery',
          'campground', 'rv_park', 'spa', 'gym', 'health', 'beauty_salon', 'hair_care',
          'laundry', 'real_estate_agency', 'school', 'university', 'library', 'hospital'
        ];

        const filteredAttractions = categoryResults.attractions.filter(place => {
          const rawName = (place.name || '').toLowerCase();
          const types = place.types || [];

          const nameTokens = rawName
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);

          const hasCommercialWord = nameTokens.some(token => commercialWords.has(token));
          if (hasCommercialWord) return false;

          const isCommercialCategory = types.some(t => excludedTypes.includes(t));
          if (isCommercialCategory) return false;

          const isNaturalType = types.includes('natural_feature');
          const hasNatureWord = nameTokens.some(token => natureWords.has(token));

          const isNatureSpot = isNaturalType || hasNatureWord;
          const hasGoodRating = place.rating === undefined || place.rating >= 3.0;

          return isNatureSpot && hasGoodRating;
        });

        // Filtered & capped strictly to top 10 nature attractions
        setNearbyAttractions(processCategoryResults(filteredAttractions, 'attraction'));
      } else {
        setNearbyAttractions([]);
      }

      // 6. Update Route Amenities State (Strictly capped to top 10 items per category)
      setRouteAmenities({
        gas_stations: processCategoryResults(categoryResults.gas_stations, 'gas_station'),
        restaurants: processCategoryResults(categoryResults.restaurants, 'restaurant'),
        lodgings: processCategoryResults(categoryResults.lodgings, 'lodging')
      });

    } catch (e) {
      console.error("Failed to fetch route places:", e);
      setNearbyAttractions([]);
      setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
    }
  }, [setNearbyAttractions, setRouteAmenities]);


  // ---------------------------------------------------------------------------
  // Weather Service Handler
  // ---------------------------------------------------------------------------

  // 1. Define the callback at the TOP LEVEL of the component
  const fetchRouteWeather = useCallback(async () => {
    if (!selectedRoute || selectedRoute.length === 0 || !CONFIG.API_KEYS.WEATHER) return;

    const fetchPromises = selectedRoute.map(async (place) => {
      const lat = place.latitude ?? place.lat;
      const lng = place.longitude ?? place.lng;
      if (!lat || !lng) return null;

      const placeKey = place.id || `${lat.toFixed(4)},${lng.toFixed(4)}`;

      if (fetchedWeatherKeys.current.has(placeKey)) return null;

      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${CONFIG.API_KEYS.WEATHER}&units=metric`
        );

        if (!res.ok) throw new Error("API Error");

        const data = await res.json();
        fetchedWeatherKeys.current.add(placeKey);

        const current = data.list[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        let nextDay = data.list.find(item => {
          const d = new Date(item.dt * 1000);
          return d.getDate() === tomorrow.getDate() && d.getHours() >= 12;
        });

        if (!nextDay) nextDay = data.list[8];

        return {
          key: placeKey,
          data: {
            current: {
              temp: Math.round(current.main.temp),
              condition: current.weather[0].main,
              description: current.weather[0].description
            },
            nextDay: {
              temp: Math.round(nextDay.main.temp),
              condition: nextDay.weather[0].main,
              description: nextDay.weather[0].description
            }
          }
        };
      } catch (e) {
        console.warn(`Weather fetch failed for ${placeKey}:`, e);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);
    const newWeather = {};
    let hasUpdates = false;

    results.forEach(res => {
      if (res) {
        newWeather[res.key] = res.data;
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      setWeatherData(prev => ({ ...prev, ...newWeather }));
    }
  }, [selectedRoute]);

  // 1. Debounced Weather Fetching
  useEffect(() => {
    if (!selectedRoute || selectedRoute.length === 0 || !CONFIG.API_KEYS.WEATHER) return;

    // 800ms debounce to prevent rapid firing when adding multiple locations quickly
    const timer = setTimeout(fetchRouteWeather, 800);
    return () => clearTimeout(timer);
  }, [selectedRoute, fetchRouteWeather]);

  // 2. Attraction and En-Route Place Fetching
  useEffect(() => {
    // GUARD: Stop API calls if user has disabled nearby search
    if (!isNearbySearchEnabled) return;

    if (!routeData?.coordinates?.length) return;
    let isCurrent = true;
    queueMicrotask(() => {
      if (isCurrent) void fetchRoutePlaceData(routeData.coordinates);
    });
    return () => {
      isCurrent = false;
    };
  }, [routeData, isNearbySearchEnabled, fetchRoutePlaceData]);

  // ---------------------------------------------------------------------------
  // 3. Effects & Autocomplete Initialization [ LOCATION SEARCH GOOGLE MAPS GATE]
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let placeChangedListener = null;

    const destroyPlannerAutocomplete = () => {
      if (placeChangedListener) {
        try {
          placeChangedListener.remove?.();
        } catch {
          // Safe cleanup
        }
        placeChangedListener = null;
      }

      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(
              autocompleteRef.current
            );
          }
        } catch {
          // Safe cleanup
        }

        autocompleteRef.current = null;
      }
    };

    const initPlannerAutocomplete = async () => {
      // -------------------------------------------------------------
      // HARD GATE:
      // Google Maps Places Autocomplete belongs ONLY to the
      // Location Search "+ Maps" toggle.
      //
      // This is intentionally NOT tied to nearby-search state.
      // -------------------------------------------------------------
      if (
        !isPlannerOpen ||
        !includeGooglePlaces ||
        !window.google?.maps ||
        !searchInputRef.current ||
        !(searchInputRef.current instanceof HTMLInputElement)
      ) {
        destroyPlannerAutocomplete();
        return;
      }

      // Prevent duplicate instances
      if (autocompleteRef.current) {
        return;
      }

      try {
        const { Autocomplete } =
          await window.google.maps.importLibrary("places");

        // Re-check after async library loading.
        // The user may have switched the toggle OFF while
        // Google Places was loading.
        if (
          !isPlannerOpen ||
          !includeGooglePlaces ||
          !searchInputRef.current
        ) {
          return;
        }

        autocompleteRef.current = new Autocomplete(
          searchInputRef.current,
          {
            fields: [
              "place_id",
              "geometry",
              "name",
              "formatted_address"
            ],
            componentRestrictions: {
              country: "lk"
            }
          }
        );

        placeChangedListener =
          autocompleteRef.current.addListener(
            "place_changed",
            () => {
              // Ignore stale Google callbacks if the toggle
              // was switched OFF before the callback fired.
              if (!includeGooglePlaces) {
                return;
              }

              const place =
                autocompleteRef.current?.getPlace();

              if (!place?.geometry) {
                return;
              }

              const lat =
                place.geometry.location.lat();

              const lng =
                place.geometry.location.lng();

              const newWaypoint = {
                id: crypto.randomUUID(),
                place_id: place.place_id,
                place_name: place.name,
                lat,
                lng,
                latitude: lat,
                longitude: lng,
              };

              setSelectedRoute(prev => [
                ...prev,
                newWaypoint
              ]);

              if (searchInputRef.current) {
                searchInputRef.current.value = "";
              }

              setPlannerSearch("");
            }
          );

      } catch (error) {
        console.error(
          "Failed to initialize Google Places Autocomplete:",
          error
        );

        destroyPlannerAutocomplete();
      }
    };

    // -------------------------------------------------------------
    // Toggle / Planner State
    // -------------------------------------------------------------
    if (isPlannerOpen && includeGooglePlaces) {
      initPlannerAutocomplete();
    } else {
      // IMPORTANT:
      // Turning "+ Maps" OFF immediately destroys the existing
      // Google Autocomplete instance.
      destroyPlannerAutocomplete();
    }

    return () => {
      destroyPlannerAutocomplete();
    };

  }, [
    isPlannerOpen,
    includeGooglePlaces,
    setSelectedRoute,
    setPlannerSearch
  ]);

  // ---------------------------------------------------------------------------
  // 4. Route Planning & Management Handlers
  // ---------------------------------------------------------------------------

  const handleViewLocation = useCallback((location) => {
    setSelectedLocation(location);
    const level = String(location.restriction_level || "").trim().toLowerCase();
    const shouldShowModal = ["high", "restricted"].includes(level);
    if (shouldShowModal) setShowSafetyModal(true);
  }, []);

  const toggleRoutePlace = useCallback((place) => {
    if (!place || !place.id) return;

    const isCurrentlySelected = (selectedRoute || []).some(p => p.id === place.id);
    const level = String(place.restriction_level || '').trim().toLowerCase();
    const isRestrictedEntry = ['high', 'restricted'].includes(level);

    // Trigger location preview/modal if selecting a restricted place
    if (!isCurrentlySelected && isRestrictedEntry && typeof handleViewLocation === 'function') {
      handleViewLocation(place);
    }

    setSelectedRoute(prev => {
      const currentList = prev || [];
      const exists = currentList.some(p => p.id === place.id);
      const selectionPool = exists
        ? currentList.filter(p => p.id !== place.id)
        : [...currentList, place];

      if (selectionPool.length === 0) return [];
      if (!userCoords?.lat || !userCoords?.lng) return selectionPool;

      // Nearest Neighbor Route Optimization starting from user coordinates
      const optimizedRoute = [];
      const remainingOptions = [...selectionPool];
      let currentPoint = { lat: userCoords.lat, lng: userCoords.lng };

      while (remainingOptions.length > 0) {
        let nearestIndex = 0;
        let shortestDistance = Infinity;

        for (let i = 0; i < remainingOptions.length; i++) {
          const item = remainingOptions[i];
          const itemLat = item.latitude ?? item.lat;
          const itemLng = item.longitude ?? item.lng;

          if (itemLat == null || itemLng == null) continue;

          // Assumes calculateDistance helper is defined in scope
          const distance = calculateDistance(
            currentPoint.lat,
            currentPoint.lng,
            itemLat,
            itemLng
          );

          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestIndex = i;
          }
        }

        const nextStop = remainingOptions.splice(nearestIndex, 1)[0];
        optimizedRoute.push(nextStop);

        const nextLat = nextStop?.latitude ?? nextStop?.lat;
        const nextLng = nextStop?.longitude ?? nextStop?.lng;
        if (nextLat != null && nextLng != null) {
          currentPoint = { lat: nextLat, lng: nextLng };
        }
      }

      return optimizedRoute;
    });
  }, [selectedRoute, userCoords, handleViewLocation, setSelectedRoute]);


  const handleReset = useCallback(() => {
    // 1. Reset Inputs, Selections & UI Interactivity
    if (setPlannerSearch) setPlannerSearch('');
    if (setHoveredPlaceId) setHoveredPlaceId(null);
    if (setSelectedLocation) setSelectedLocation(null);

    // 2. Reset Route Data & Metrics
    if (setSelectedRoute) setSelectedRoute([]);
    if (setRouteData) setRouteData(null);
    if (setRouteDistance) setRouteDistance(0);

    // 3. Reset Extracted Spatial Data & Amenities
    if (setRouteAmenities) setRouteAmenities({ gas_stations: [], restaurants: [], lodgings: [] });
    if (setNearbyAttractions) setNearbyAttractions([]);

    // 4. Map Layer & Ref Cleanup
    const targetMap = mapInstanceRef?.current || mapRef?.current;
    if (!targetMap) return;

    // Clear active route polyline if present
    if (routeLineRef?.current) {
      if (targetMap.hasLayer(routeLineRef.current)) {
        targetMap.removeLayer(routeLineRef.current);
      }
      routeLineRef.current = null;
    }

    // Clear registered dynamic markers from Map Registry
    if (markerRegistryRef?.current) {
      const targetPrefixes = ['gas-', 'rest-', 'hotel-', 'attr-', 'nearby-', 'route-'];

      Object.keys(markerRegistryRef.current).forEach((key) => {
        if (targetPrefixes.some((prefix) => key.startsWith(prefix))) {
          const marker = markerRegistryRef.current[key];
          if (marker && targetMap.hasLayer(marker)) {
            targetMap.removeLayer(marker);
          }
          delete markerRegistryRef.current[key];
        }
      });
    }

    // Clear legacy nearby markers array
    if (nearbyMarkersRef?.current) {
      nearbyMarkersRef.current.forEach((item) => {
        const markerObj = item?.marker || item;
        if (markerObj && targetMap.hasLayer(markerObj)) {
          targetMap.removeLayer(markerObj);
        }
      });
      nearbyMarkersRef.current = [];
    }
  }, [
    setPlannerSearch,
    setHoveredPlaceId,
    setSelectedLocation,
    setSelectedRoute,
    setRouteData,
    setRouteDistance,
    setRouteAmenities,
    setNearbyAttractions,
    mapInstanceRef,
    mapRef,
    routeLineRef,
    markerRegistryRef,
    nearbyMarkersRef
  ]);

  // ---------------------------------------------------------------------------
  // 5. Route Sharing, Exporting & QR Code Generator
  // ---------------------------------------------------------------------------
  const generateGoogleMapsUrl = (points) => {
    if (!points || points.length === 0) return "";
    const baseUrl = "https://www.google.com/maps/dir/";
    const stops = points.map(p => `${p.latitude},${p.longitude}`).join('/');
    return `${baseUrl}${stops}`;
  };

  const shareRoute = () => {
    if (selectedRoute.length < 2) return;
    const origin = `${selectedRoute[0].latitude},${selectedRoute[0].longitude}`;
    const destination = `${selectedRoute[selectedRoute.length - 1].latitude},${selectedRoute[selectedRoute.length - 1].longitude}`;
    const waypoints = selectedRoute.slice(1, -1).map(p => `${p.latitude},${p.longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showQRCode = (points, name = "My Travel Route") => {
    const universalUrl = generateGoogleMapsUrl(points);
    if (!universalUrl) return;

    const existing = document.getElementById('qr-modal-overlay');
    if (existing) {
      existing.__qrCleanup?.();
      existing.remove();
    }

    const overlay = document.createElement('div');
    let qrRoot = null;
    let renderTimer = null;
    const closeOverlay = () => {
      if (renderTimer) window.clearTimeout(renderTimer);
      qrRoot?.unmount();
      qrRoot = null;
      overlay.remove();
    };
    overlay.__qrCleanup = closeOverlay;
    overlay.id = "qr-modal-overlay";
    overlay.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-6";

    const modal = document.createElement('div');
    modal.className = "bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full border border-slate-100";
    modal.onclick = (e) => e.stopPropagation();
    overlay.onclick = closeOverlay;

    modal.innerHTML = `
      <div class="text-center">
          <p class="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-1">Scan to Navigate</p>
          <h3 class="text-sm font-black uppercase text-slate-800 leading-tight mb-4 px-4 line-clamp-2">${escapeHtml(name)}</h3>
      </div>
      <div class="p-5 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
          <div id="qrcode-canvas"></div>
      </div>
      <div class="w-full space-y-3">
          <button id="copy-link-btn" class="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">Copy Link</button>
          <button id="whatsapp-modal-btn" class="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">WhatsApp</button>
          <button id="close-qr-btn" class="w-full py-3 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-slate-600">Dismiss</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    renderTimer = window.setTimeout(() => {
      const qrContainer = document.getElementById("qrcode-canvas");
      if (qrContainer) {
        qrRoot = createRoot(qrContainer);
        qrRoot.render(
          <QRCodeSVG value={universalUrl} size={200} bgColor="#f8fafc" fgColor="#0f172a" level="H" includeMargin={false} />
        );
      }
    }, 50);

    modal.querySelector('#close-qr-btn').onclick = closeOverlay;
    modal.querySelector('#copy-link-btn').onclick = () => {
      const copyLink = async () => {
        try {
          await navigator.clipboard.writeText(universalUrl);
          toast.success("Link copied to clipboard!");
        } catch {
          toast.error("Could not copy the route link.");
        }
      };
      copyLink();
    };
    modal.querySelector('#whatsapp-modal-btn').onclick = () => {
      const text = encodeURIComponent(`Check out my travel route: ${universalUrl}`);
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };
  };

  const downloadRouteFile = (type = 'gpx') => {
    if (!routeData || !routeData.coordinates) {
      toast.info("Please calculate a route first!");
      return;
    }

    const coords = routeData.coordinates;
    const routeName = `MyJournal_Route_${new Date().toISOString().split('T')[0]}`;
    let content = "";
    let mimeType = "";

    if (type === 'gpx') {
      mimeType = "application/gpx+xml";
      content = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="My Journal" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>${routeName}</name><trkseg>
      ${coords.map(c => `<trkpt lat="${c.lat}" lon="${c.lng}"></trkpt>`).join('\n      ')}
  </trkseg></trk>
</gpx>`;
    } else if (type === 'kml') {
      mimeType = "application/vnd.google-earth.kml+xml";
      content = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document><name>${routeName}</name><Placemark><name>Path</name><LineString><tessellate>1</tessellate><coordinates>
          ${coords.map(c => `${c.lng},${c.lat},0`).join(' ')}
  </coordinates></LineString></Placemark></Document>
</kml>`;
    }

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${routeName}.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Route exported as ${type.toUpperCase()}`);
    } catch {
      toast.error("Download failed. Check browser permissions.");
    }
  };

  const handleShare = async (e, place, isGallery = false) => {
    if (e) e.stopPropagation();
    if (!place) return;

    const slug = getMediaSEOPlaceSlug(place);
    const url = `${window.location.origin}/${isGallery ? 'gallery' : 'place'}/${slug}`;
    const shareText = isGallery
      ? `Explore the photo gallery for ${place.place_name} on My Journal: ${url}`
      : `Check out this amazing spot on My Journal: ${place.place_name} ${url}`;

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    };

    const copied = await copyToClipboard(shareText);
    if (copied) toast.success(isGallery ? "Gallery link copied!" : "Link & details copied!");

    if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `${place.place_name} | My Journal`,
          text: shareText.replace(url, ''),
          url: url
        });
        return;
      } catch (shareError) {
        if (shareError?.name !== "AbortError") {
          console.error("Native sharing failed.", shareError);
        }
      }
    }

    setSharingData({ name: place.place_name, url, text: shareText, isGallery });
    setIsShareModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // 6. UI Helpers, Localization & Form Actions
  // ---------------------------------------------------------------------------
  const handleAddPlace = async (e) => {
    e.preventDefault();
    const isDuplicate = places.some(place =>
      place.place_name.toLowerCase() === formData.place_name.trim().toLowerCase() ||
      (place.latitude === parseFloat(formData.latitude) && place.longitude === parseFloat(formData.longitude))
    );

    if (isDuplicate) {
      toast.error("This spot is already in the Journal!");
      return;
    }

    try {
      const { error } = await supabaseClient.from('pending_approvals').insert([{
        place_name: formData.place_name, locality: formData.locality,
        latitude: formData.latitude, longitude: formData.longitude,
        map_url: formData.map_url, image_url: formData.image_url,
        category: formData.category, status: 'pending'
      }]);
      if (error) throw error;
      toast.success("Success! Spot submitted for review.");
      setIsAddOpen(false);
      setFormData({ place_name: "", category: "Location", latitude: null, longitude: null, locality: "", map_url: "" });
    } catch (err) {
      toast.error("Failed to submit: " + err.message);
    }
  };

  const getActiveContent = (field) =>
    translatedContent?.[field] || viewingArticle?.ai_article?.[field] || "";

  const handleCloseLegalModal = () => {
    setIsPrivacyOpen(false);
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const nextPath = ["/privacy", "/terms", "/about"].includes(path)
      ? "/"
      : window.location.pathname;
    window.history.pushState({}, '', nextPath);
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('myjournal_cookie_consent', 'granted');
    setShowCookieBanner(false);
    initClarity();
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'cookie_consent_granted' });
    }
    toast.success("Preferences saved!", { id: "cookie-consent" });
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('myjournal_cookie_consent', 'denied');
    setShowCookieBanner(false);
    toast.info("Optional tracking cookies declined.", { id: "cookie-consent" });
  };

  // ============================================================================
  // 31. LIFECYCLE EFFECTS (API calls, Observer, Maps, Theme)
  // ============================================================================

  useEffect(() => {
    const syncCategoryFromLocation = () => {
      setFilterTag(getCategoryFromSearch(window.location.search));
      setLocationRevision((revision) => revision + 1);
    };

    window.addEventListener("popstate", syncCategoryFromLocation);
    return () => window.removeEventListener("popstate", syncCategoryFromLocation);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSeenPrompt = localStorage.getItem('myjournal_newsletter_prompted');
    if (hasSeenPrompt) return;

    const isFeatureActive = isArticleOpen || activeId !== null || isPlannerOpen || isAddOpen;
    let timer;

    if (isFeatureActive) {
      timer = setTimeout(() => setShowNewsletterPrompt(true), 3000);
    } else {
      timer = setTimeout(() => setShowNewsletterPrompt(true), 10000);
    }

    return () => clearTimeout(timer);
  }, [isArticleOpen, activeId, isPlannerOpen, isAddOpen]);

  useEffect(() => {
    const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0].toLowerCase();
    document.documentElement.lang = language;
    document.documentElement.dir = ['ar', 'he'].includes(language) ? 'rtl' : 'ltr';
  }, [i18n, i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    let isCurrent = true;
    let activeToastId = null;

    const content = viewingArticle?.ai_article;
    const baseLang = i18n.language?.split('-')[0].toLowerCase() || 'en';
    const shouldTranslate = isArticleOpen && content?.isFullContent && baseLang !== 'en';

    const runTranslation = async () => {
      // Look up the full language name from your existing SUPPORTED_LANGUAGES object
      const targetLangName = SUPPORTED_LANGUAGES[baseLang] || baseLang.toUpperCase();

      // Update the toast to show the dynamic translation message
      activeToastId = toast.loading(`Translating to ${targetLangName}`);

      try {
        const result = await translateContentService(content, i18n.language, viewingArticle?.id);
        if (isCurrent) {
          setTranslatedContent({ ...result, isFullContent: true });
          toast.success("Translation complete!", { id: activeToastId });
          activeToastId = null;
        }
      } catch (error) {
        if (isCurrent) {
          toast.error(error.message || "Translation failed. Showing original.", { id: activeToastId });
          setTranslatedContent(null);
          activeToastId = null;
        }
      }
    };

    if (shouldTranslate) {
      runTranslation();
    }

    return () => {
      isCurrent = false;
      if (activeToastId) toast.dismiss(activeToastId);
    };
  }, [viewingArticle?.id, viewingArticle?.ai_article, i18n.language, i18n, isArticleOpen]);


  useEffect(() => {
    const watchId = getUserLocation(setUserCoords, toast);

    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted) return;
      void fetchPlaces();
      void fetchInteractions();
    });
    const pathname = window.location.pathname;

    const normalizedPath = pathname
      .toLowerCase()
      .replace(/\/+$/, "") || "/";

    // =====================================================================
    // ROUTE MATCHING
    // =====================================================================

    const placeMatch = pathname.match(
      /^\/place\/([^/]+)$/i
    );

    const galleryMatch = pathname.match(
      /^\/gallery\/([^/]+)$/i
    );

    const videoMatch = pathname.match(
      /^\/videos\/([^/]+)$/i
    );

    // =====================================================================
    // INITIAL ROUTE / DEEP-LINK HANDLING
    // =====================================================================
    //
    // Keep route detection separate from route resolution.
    //
    // The actual place/video records may not have loaded yet, so this effect
    // only records the requested route in pendingRouteRef. The dedicated
    // route-resolution effect can then resolve it once the relevant data
    // becomes available.
    //
    // Supported crawlable routes:
    //
    //   /place/<slug>
    //   /gallery/<slug>
    //   /videos
    //   /videos/<slug>
    //
    // =====================================================================

    if (placeMatch?.[1]) {
      // Direct Place URL:
      // /place/location-name

      pendingRouteRef.current = {
        type: "place",
        slug: safeDecodeURIComponent(placeMatch[1]),
      };
    } else if (galleryMatch?.[1]) {
      // Direct Photo Gallery URL:
      // /gallery/location-name

      pendingRouteRef.current = {
        type: "gallery",
        slug: safeDecodeURIComponent(galleryMatch[1]),
      };
    } else if (videoMatch?.[1]) {
      // Direct Individual Video URL:
      // /videos/video-slug
      //
      // IMPORTANT:
      // This is intentionally different from /videos.
      //
      // /videos              -> video collection/gallery
      // /videos/<slug>       -> individual crawlable video page

      pendingRouteRef.current = {
        type: "video",
        slug: safeDecodeURIComponent(videoMatch[1]),
      };
    } else if (
      normalizedPath === "/videos" ||
      normalizedPath === "/video-gallery"
    ) {
      // Direct Video Gallery URL:
      // /videos
      //
      // Do NOT fetch the library here.
      //
      // The video-library loading effect already owns fetchVideoLibrary(),
      // and the route-resolution effect will open the gallery once the
      // library has finished loading.
      //
      // This prevents duplicate requests and keeps /videos and
      // /videos/<slug> on the same routing path.

      pendingRouteRef.current = {
        type: "videos",
      };
    }

    // =====================================================================
    // COOKIE CONSENT / CLARITY INITIALIZATION
    // =====================================================================

    if (
      localStorage.getItem(
        "myjournal_cookie_consent"
      ) === "granted"
    ) {
      initClarity();

      if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || [];

        window.dataLayer.push({
          event: "cookie_consent_granted",
        });
      }
    }

    // =====================================================================
    // CLEANUP
    // =====================================================================

    return () => {
      isMounted = false;
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [setUserCoords, fetchPlaces, fetchInteractions]);


  // =======================================================================
  // 32. VISITATION LOGGING (ARTICLE & GALLERY)
  // =======================================================================
  useEffect(() => {
    if (isArticleOpen && viewingArticle?.place_name) {
      if (lastLoggedArticleRef.current !== viewingArticle.id) {
        logVisit(`Place/${viewingArticle.place_name}`);
        lastLoggedArticleRef.current = viewingArticle.id;
      }
    } else if (!isArticleOpen) {
      lastLoggedArticleRef.current = null;
    }

    if (activeId && places.length > 0) {
      if (lastLoggedGalleryRef.current !== activeId) {
        const activePlace = places.find(p => p.id === activeId);
        if (activePlace?.place_name) {
          logVisit(`Gallery/${activePlace.place_name}`);
          lastLoggedGalleryRef.current = activeId;
        }
      }
    } else if (!activeId) {
      lastLoggedGalleryRef.current = null;
    }
  }, [isArticleOpen, viewingArticle, activeId, places]);

  // =======================================================================
  // 33. INITIAL ROUTE & DEEP-LINKING HANDLER
  // =======================================================================

  useEffect(() => {
    if (hasHandledDeepLink.current) return;

    const { type, slug } =
      pendingRouteRef.current || {};

    if (!type) return;

    // =====================================================================
    // VIDEO COLLECTION
    // =====================================================================

    if (type === "videos") {
      if (!hasLoadedVideoLibrary) return;

      logVisit('Video Hub');

      queueMicrotask(() => {
        setActiveVideo(null);
        setIsVideoDetailOpen(false);
        setActiveVideos(videoLibrary);
      });

      hasHandledDeepLink.current = true;
      pendingRouteRef.current = {
        type: null,
        slug: null,
      };

      return;
    }

    // =====================================================================
    // INDIVIDUAL VIDEO
    // =====================================================================

    if (type === "video") {
      if (!hasLoadedVideoLibrary) return;

      logVisit('Video Hub');

      const targetVideo =
        videoLibrary.find(
          (video, index) =>
            buildAutomaticVideoSEO(
              video,
              index
            ).slug === slug ||
            generateSlug(video?.title) === slug
        );

      if (!targetVideo) {
        toast.error("Video not found.");

        window.history.replaceState(
          {},
          "",
          "/videos"
        );

        setActiveVideo(null);
        setIsVideoDetailOpen(false);
        setActiveVideos(videoLibrary);

        hasHandledDeepLink.current = true;
        pendingRouteRef.current = {
          type: null,
          slug: null,
        };

        return;
      }

      setActiveVideos([]);
      setActiveVideo(targetVideo);
      setIsVideoDetailOpen(true);

      hasHandledDeepLink.current = true;
      pendingRouteRef.current = {
        type: null,
        slug: null,
      };

      return;
    }

    // =====================================================================
    // PLACE / GALLERY
    // =====================================================================

    if (!places.length || !slug) return;

    try {
      const decodedName =
        decodeURIComponent(slug)
          .replace(/-/g, " ");

      const targetPlace =
        places.find(
          (place) =>
            getMediaSEOPlaceSlug(place) === slug ||
            place.place_name?.toLowerCase() === decodedName.toLowerCase()
        );

      if (!targetPlace) {
        toast.error("Location not found.");

        pendingRouteRef.current = {
          type: null,
          slug: null,
        };

        return;
      }

      if (type === "gallery") {
        setActiveId(targetPlace.id);
      } else if (type === "place") {
        handleOpenArticle(targetPlace);
      }

      hasHandledDeepLink.current = true;

      pendingRouteRef.current = {
        type: null,
        slug: null,
      };
    } catch (err) {
      console.error(
        "Failed to resolve deep link:",
        err
      );

      toast.error(
        "Invalid location link."
      );

      pendingRouteRef.current = {
        type: null,
        slug: null,
      };
    }
  }, [
    places,
    videoLibrary,
    hasLoadedVideoLibrary,
    handleOpenArticle,
  ]);

  // =======================================================================
  // 34. MASTER DYNAMIC SEO & META TAG SYNCHRONIZER
  // =======================================================================
  useEffect(() => {
    // Wait if deep-link processing is actively pending
    if (pendingRouteRef.current.type && hasHandledDeepLink?.current === false) return;

    const activeGalleryPlace = activeId ? places.find(p => p.id === activeId) : null;
    const normalizedPath = typeof window === "undefined"
      ? "/"
      : window.location.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    const isVideoGalleryActive =
      !isVideoDetailOpen &&
      (activeVideos.length > 0 || normalizedPath === "/videos");

    if (isVideoDetailOpen && activeVideo) {
      updateSEO(null, {
        isVideo: true,
        video: activeVideo,
      });
    } else if (isVideoGalleryActive) {
      updateSEO(null, {
        isVideoGallery: true,
        galleryVideos: activeVideos,
      });
    } else if (activeGalleryPlace) {
      // 1. Active Photo Gallery View
      updateSEO(activeGalleryPlace, { isGallery: true });
    } else if (isArticleOpen && viewingArticle) {
      // 2. Active Place Article Detail View
      updateSEO(viewingArticle, { isGallery: false });
    } else {
      // 3. Main Catalog View (Handles Filter Tag & Search Queries dynamically)
      updateSEO(null, {
        category: filterTag,
        searchTerm: debouncedSearch
      });
    }
  }, [
    activeId,
    viewingArticle,
    isArticleOpen,
    places,
    filterTag,
    debouncedSearch,
    activeVideo,
    isVideoDetailOpen,
    activeVideos,
  ]);

  // =======================================================================
  // 35. PAGINATION RESET ON FILTER CHANGE
  // =======================================================================
  useEffect(() => {
    // Reset the log flag and revert URL when the add panel is closed
    if (!isAddOpen) {
      hasLoggedAddOpen.current = false;
      pendingAddVisitTypeRef.current = null;
      if (window.location.pathname === '/suggest-spot') {
        window.history.pushState({ modalOpen: false }, '', '/');
      }
    }

    if (isAddOpen) {
      // 1. Sync URL for the Add Function
      if (window.location.pathname !== '/suggest-spot') {
        window.history.pushState({ modalOpen: true }, '', '/suggest-spot');
      }

      // 2. Handle the browser back button to close the panel
      const handlePopState = () => setIsAddOpen(false);
      window.addEventListener('popstate', handlePopState);

      // Analytics logging (fires once per modal open)
      if (!hasLoggedAddOpen.current) {
        logVisit(pendingAddVisitTypeRef.current || 'Add Function');
        pendingAddVisitTypeRef.current = null;
        hasLoggedAddOpen.current = true;
      }

      let autocompleteInstance = null;

      const initAutocomplete = async () => {
        if (!window.google || !window.google.maps) return;

        try {
          const { Autocomplete } = await google.maps.importLibrary("places");
          const input = document.getElementById('location-search');
          if (!input) return;

          autocompleteInstance = new Autocomplete(input, {
            fields: ["address_components", "geometry", "name", "url"],
            componentRestrictions: { country: "lk" } // Country restriction
          });

          autocompleteInstance.addListener("place_changed", () => {
            const place = autocompleteInstance.getPlace();
            if (!place.geometry || !place.geometry.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            const components = place.address_components || [];
            const locality = components.find(c => c.types.includes("administrative_area_level_2"))?.long_name ||
              components.find(c => c.types.includes("locality"))?.long_name || "";

            // Auto-fill form state with Google Places details
            setFormData(prev => ({
              ...prev,
              place_name: place.name,
              latitude: parseFloat(lat.toFixed(6)),
              longitude: parseFloat(lng.toFixed(6)),
              locality: locality,
              map_url: place.url
            }));

            // Map Visual Sync: Fly to location AND drop yellow marker
            if (addMapInstance) {
              addMapInstance.flyTo([lat, lng], 16, {
                animate: true,
                duration: 1.5
              });

              // Clear previous temporary search markers
              if (tempMarkerRef.current) {
                addMapInstance.removeLayer(tempMarkerRef.current);
              }

              // Drop signature yellow marker on search result
              tempMarkerRef.current = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: '#facc15',
                color: '#ca8a04',
                weight: 3,
                fillOpacity: 1
              }).addTo(addMapInstance);
            }
          });
        } catch (err) {
          console.error("Autocomplete init error:", err);
        }
      };

      // Retry loop until Google Maps JS SDK is loaded
      const retryInterval = setInterval(() => {
        if (window.google?.maps) {
          initAutocomplete();
          clearInterval(retryInterval);
        }
      }, 500);

      return () => {
        clearInterval(retryInterval);
        if (window.google?.maps?.event && autocompleteInstance) {
          google.maps.event.clearInstanceListeners(autocompleteInstance);
        }
        // 3. Cleanup the back button listener
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isAddOpen, addMapInstance]);

  useEffect(() => {
    if (!isPlannerOpen) {
      hasLoggedPlanOpen.current = false;
      // Revert URL when the planner is closed
      if (window.location.pathname === '/route-planner') {
        window.history.pushState({ modalOpen: false }, '', '/');
      }
      return;
    }

    // 1. Sync URL for the Plan Function
    if (window.location.pathname !== '/route-planner') {
      window.history.pushState({ modalOpen: true }, '', '/route-planner');
    }

    // 2. Handle the browser back button to close the planner
    const handlePopState = () => setIsPlannerOpen(false);
    window.addEventListener('popstate', handlePopState);

    if (!hasLoggedPlanOpen.current) {
      logVisit('Plan Function');
      hasLoggedPlanOpen.current = true;
    }

    const filteredForWeather = places.filter(place => {
      const search = (debouncedPlannerSearch || "").toLowerCase();
      if (!search) return place.status === 'done' || place.status === 'pending';
      const name = (place.place_name || "").toLowerCase();
      const locality = (place.locality || "").toLowerCase();
      const cat = (place.category || "").toLowerCase();
      return (place.status === 'done' || place.status === 'pending') &&
        (name.includes(search) || locality.includes(search) || cat.includes(search));
    });

    let isCurrent = true;
    queueMicrotask(() => {
      if (isCurrent && filteredForWeather.length > 0) {
        void fetchRouteWeather(filteredForWeather);
      }
    });

    return () => {
      isCurrent = false;
      // 3. Cleanup the event listener to prevent memory leaks during re-renders
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isPlannerOpen, debouncedPlannerSearch, places, fetchRouteWeather]);


  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
    const isHomePage = pathname === '/' &&
      !isArticleOpen &&
      activeId === null &&
      activeVideos.length === 0 &&
      !activeVideo &&
      !isVideoDetailOpen &&
      !isAddOpen &&
      !isPlannerOpen &&
      !isPrivacyOpen;

    if (isHomePage && !hasLoggedMainPageRef.current) {
      logVisit('Main Page');
      hasLoggedMainPageRef.current = true;
    }
  }, [
    locationRevision,
    isArticleOpen,
    activeId,
    activeVideos.length,
    activeVideo,
    isVideoDetailOpen,
    isAddOpen,
    isPlannerOpen,
    isPrivacyOpen,
  ]);



  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filteredPlaces.length) {
        setVisibleCount((prev) => prev + 20);
      }
    }, { root: null, rootMargin: '400px', threshold: 0 });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => { if (currentSentinel) observer.unobserve(currentSentinel); };
  }, [visibleCount, filteredPlaces.length]);

  // ============================================================================
  // 36. INTERNAL UI COMPONENTS (Overlays, Skeletons, Disclaimers)
  // ============================================================================

  // ============================================================================
  // 37. MAIN RENDER STARTS
  // ============================================================================

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">

      {/* Toaster Notification */}

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            fontWeight: '700',
            borderRadius: '1rem',
          },
        }}
      />

      {isVideoDetailRoute ? (
        activeVideo && isVideoDetailOpen ? (
          <VideoDetailPage
            video={activeVideo}
            allVideos={videoLibrary}
          />
        ) : (
          <main
            className="min-h-screen bg-slate-950 text-white flex items-center justify-center"
            aria-live="polite"
            aria-busy={!hasLoadedVideoLibrary}
          >
            <p className="text-white/70 font-medium">
              {hasLoadedVideoLibrary ? "Opening video…" : "Loading video…"}
            </p>
          </main>
        )
      ) : (
        <>

          {/* EDIT 1: ADDED THIS HIDDEN H1 FOR SEO PURPOSES */}
          <h1 className="sr-only">
            My Journal: Sri Lanka Adventure Travel, Waterfall Hunting, and Trekking Guide
          </h1>

          {/* --- CONSOLIDATED HEADER, NAVIGATION & DYNAMIC CATEGORY LANDING AREA --- */}
          <div className="flex flex-col w-full bg-white md:bg-transparent">

            {/* 1. HEADER SECTION */}
            <header className="p-4 md:px-10 md:pt-8 md:pb-4 flex justify-between items-start md:items-center bg-white md:bg-transparent border-b md:border-none">

              {/* LEFT SIDE: Logo & Identity */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="shrink-0 w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden p-1.5">
                  <img
                    src="https://vpslgikpaintiuayajmx.supabase.co/storage/v1/object/public/Logo/my-journal-logo.png"
                    alt="My Journal Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  {/* EDIT 2: CHANGED H1 TO H2 TO PREVENT DUPLICATE H1 PENALTIES (Visual styling remains identical) */}
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-slate-800 leading-none">
                    {t('common.title')}
                  </h2>
                  <p className="mt-2 text-slate-500 text-xs sm:text-sm font-medium leading-tight max-w-[200px] sm:max-w-none">
                    {t('common.subtitle')}
                  </p>
                </div>
              </div>

              {/* RIGHT SIDE: Navigation Actions */}
              {/* We use flex-col for mobile (stacking) and flex-row-reverse for desktop (order swap) */}
              <div className="flex flex-col md:flex-row-reverse gap-2 items-end">

                {/* LANGUAGE SELECTOR */}
                <div className="relative flex items-center">
                  <Globe className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    onChange={changeLanguage}
                    value={(i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]}
                    className="bg-slate-50 text-slate-700 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-[10px] font-black uppercase appearance-none focus:outline-none focus:border-indigo-500 shadow-sm cursor-pointer transition-all w-full"
                  >
                    <option value="en">EN</option>
                    <option value="ar">AR</option>
                    <option value="zh">CH</option>
                    <option value="de">DE</option>
                    <option value="es">ES</option>
                    <option value="fr">FR</option>
                    <option value="he">HE</option>
                    <option value="hi">HI</option>
                    <option value="id">ID</option>
                    <option value="it">IT</option>
                    <option value="ja">JA</option>
                    <option value="ko">KO</option>
                    <option value="nl">NL</option>
                    <option value="pl">PL</option>
                    <option value="pt">PT</option>
                    <option value="ru">RU</option>
                    <option value="si">SI</option>
                    <option value="sr">SR</option>
                    <option value="sv">SV</option>
                    <option value="th">TH</option>
                    <option value="tr">TR</option>
                    <option value="uk">UK</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                {/* FILTER TRIGGER BUTTON */}
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all hover:bg-slate-800"
                >
                  <SlidersHorizontal className={`w-3.5 h-3.5 transition-transform duration-300 ${isFilterOpen ? 'text-white' : 'text-orange-400'}`} />
                  <span>{isFilterOpen ? t('common.close') : t('common.filters')}</span>
                </button>


                {/* --- FIXED HUB SYSTEM --- */}
                {!isAddOpen && !isPlannerOpen && !isArticleOpen && !isShareModalOpen && (
                  <div className="fixed bottom-4 right-3 z-[4000] flex flex-col items-end gap-2 max-w-[280px]">

                    {/* HUB 1: SOCIAL HUB */}
                    <div className="flex flex-col items-end gap-2 relative">
                      <div className={`flex flex-col items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-400 ${isSocialOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-90 pointer-events-none absolute'
                        }`}>
                        <a href="https://web.facebook.com/profile.php?id=61571059524746" target="_blank" rel="noreferrer" className="p-2.5 bg-[#1877F2] text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </a>
                        <a href="https://www.pinterest.com/myjournalview" target="_blank" rel="noreferrer" className="p-2.5 bg-[#E60023] text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.397 2.966 7.397 6.93 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.033-1.002 2.324-1.492 3.121 1.12.345 2.3.533 3.524.533 6.621 0 11.988-5.367 11.988-11.987C24.005 5.367 18.638 0 12.017 0z" />
                          </svg>
                        </a>
                        <a href="https://www.youtube.com/@myjournalview" target="_blank" rel="noreferrer" className="p-2.5 bg-[#FF0000] text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93-.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        </a>
                        <a href="https://www.tiktok.com/@myjournalview" target="_blank" rel="noreferrer" className="p-2.5 bg-black text-white rounded-xl hover:scale-105 transition-transform shadow-md">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.31-2.34-.25-3.41.33-.71.38-1.27 1.03-1.51 1.8-.31.82-.28 1.73.08 2.51.26.6.68 1.14 1.22 1.51.51.35 1.11.53 1.73.54 1.24-.03 2.38-.67 3-1.77.24-.46.33-.98.35-1.5.01-4.14 0-8.28.01-12.42z" />
                          </svg>
                        </a>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => {
                            setIsSocialOpen(!isSocialOpen);
                            setIsEngineOpen(false);
                          }}
                          className={`relative z-10 w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 rounded-full ${isSocialOpen
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                            }`}
                        >
                          {isSocialOpen ? <X className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>


                    {/* HUB 2: DIRECT VIDEO PLAYER */}
                    <div className="relative">

                      {/* Blue Ping Effect */}
                      {activeVideos.length === 0 && (
                        <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40 z-0"></span>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          // Close other FAB panels
                          setIsSocialOpen(false);
                          setIsEngineOpen(false);

                          // Videos are already preloaded — open immediately
                          if (videoLibrary.length > 0) {
                            logVisit('Video Hub');
                            setActiveVideos(videoLibrary);
                            return;
                          }

                          // Safety fallback if background loading has not finished yet
                          const videos = await fetchVideoLibrary();

                          if (videos.length > 0) {
                            logVisit('Video Hub');
                            setActiveVideos(videos);
                          } else {
                            console.warn("No active videos found in hub_videos.");
                          }
                        }}
                        className="relative z-10 w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-105 active:scale-95"
                        aria-label="Open Video Player"
                        title="Video Journal"
                      >
                        <Video className="w-5 h-5" />
                      </button>

                    </div>

                    {/* HUB 3: ENGINE HUB */}
                    <div className="flex flex-col items-end gap-2 relative">

                      <div className={`flex flex-col gap-2 transition-all duration-400 ${isEngineOpen ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-10 scale-90 pointer-events-none absolute'
                        }`}>
                        <button
                          onClick={() => {
                            pendingAddVisitTypeRef.current = 'Add Function';
                            setIsAddOpen(true);
                            setIsEngineOpen(false);
                          }}
                          className="flex items-center justify-end gap-2 bg-white text-slate-900 p-1.5 pr-2 rounded-2xl shadow-lg border border-slate-100"
                        >
                          <span className="font-black uppercase text-[8px] tracking-tighter ml-2">{t('hub.add', { defaultValue: 'Add' })}</span>
                          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Plus className="w-4 h-4" /></div>
                        </button>
                        <button
                          onClick={() => { setIsPlannerOpen(true); setIsEngineOpen(false); }}
                          className="flex items-center justify-end gap-2 bg-white text-slate-900 p-1.5 pr-2 rounded-2xl shadow-lg border border-slate-100"
                        >
                          <span className="font-black uppercase text-[8px] tracking-tighter ml-2">{t('hub.plan', { defaultValue: 'Plan' })}</span>
                          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white"><MapIcon className="w-6 h-6" /></div>
                        </button>
                      </div>

                      <div className="relative">
                        {!isEngineOpen && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-40 z-0"></span>}
                        <button
                          onClick={() => {
                            setIsEngineOpen(!isEngineOpen);
                            setIsSocialOpen(false);
                          }}
                          className={`relative z-10 w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 rounded-full ${isEngineOpen
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                            }`}
                        >
                          {isEngineOpen ? (
                            <X className="w-5 h-5" />
                          ) : (
                            <svg className="w-5 h-5 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </header>

            {/* 2. SEARCH, FILTER & SORT PANEL */}
            <div className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out relative z-[50] mx-4 md:mx-10 ${isFilterOpen ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'}`}>
              <div className="overflow-hidden flex flex-col bg-white rounded-3xl shadow-xl border border-slate-100">
                <div className="p-5 flex flex-col">
                  {/* Search & Sort */}
                  <div className="flex flex-col md:flex-row gap-3 mb-4 w-full">
                    <div className="flex-[2] relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input value={searchTerm} onChange={e => { setVisibleCount(20); setSearchTerm(e.target.value); }} placeholder={t('filters.search_placeholder')} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 font-bold text-[11px] outline-none border border-transparent focus:border-slate-200 transition-all text-slate-800" />
                    </div>
                    <div className="relative flex-1">
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-slate-900 text-white border border-slate-900 rounded-xl px-4 py-3 text-[10px] font-black uppercase appearance-none focus:outline-none shadow-lg shadow-slate-900/20 cursor-pointer pr-10">
                        <option value="recent">{t('filters.sort_newest')}</option>
                        <option value="distance">{t('filters.sort_nearest')}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-100/50 pointer-events-none" />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 w-full pt-2 border-t border-slate-50">
                    {['All', ...VALID_CATEGORIES].map(tag => {
                      const normalizedKey = tag.toLowerCase().replace(/\s+/g, '_');
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            setVisibleCount(20);
                            setFilterTag(tag);
                            const nextUrl = new URL(window.location.href);
                            if (tag === "All") {
                              nextUrl.searchParams.delete("category");
                            } else {
                              nextUrl.searchParams.set("category", tag.toLowerCase());
                            }
                            window.history.pushState(
                              { category: tag },
                              "",
                              `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all active:scale-95 ${filterTag === tag ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          {t(`categories.${normalizedKey}`, { defaultValue: tag })}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Context */}
                  <section className="w-auto mb-2 mt-4">
                    <div className="p-6 bg-slate-50/70 border border-slate-100 rounded-3xl backdrop-blur-sm transition-all duration-300">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{t('discovery.index_heading')}</h3>
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{t('discovery.scope_label')}: {filterTag === 'All' || !filterTag ? t('discovery.all_records') : t(`categories.${filterTag.toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: filterTag })}</span>
                      </div>
                      <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-4xl transition-opacity duration-200">
                        {t(`categories.desc_${(filterTag || 'All').toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: CATEGORY_DESCRIPTIONS[filterTag] || CATEGORY_DESCRIPTIONS["All"] })}
                      </p>
                      <div className="mt-4 pt-3 border-t border-slate-200/50 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>• {t('discovery.meta_topographic')}</span>
                        <span>• {t('discovery.meta_backcountry')}</span>
                        <span>• {t('discovery.meta_geospatial')}</span>
                        <span>• {t('discovery.meta_route_index')}</span>
                      </div>
                    </div>
                  </section>

                  {/* Close Button */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end w-full">
                    <button type="button" onClick={() => setIsFilterOpen(false)} className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <X className="w-3.5 h-3.5 text-orange-400" />
                      <span>{t('filters.apply_close')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={locationGridScrollRef}
            id="destinations"
            className="location-grid-scroll native-scroll-y flex-1 px-4 md:px-10 pb-20 no-scrollbar"
          >

            {filterTag !== "All" && (
              <div className="pt-2 pb-3">
                <Breadcrumbs
                  className="text-xs text-slate-500 dark:text-slate-400"
                  items={[
                    { label: "My Journal", href: "/" },
                    {
                      label: t(`categories.${filterTag.toLowerCase().replace(/\s+/g, '_')}`, {
                        defaultValue: filterTag,
                      }),
                    },
                  ]}
                />
              </div>
            )}

            {/* 1. Main Grid: Location Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pt-2">
              {/* SKELETON STATE: Prevents CLS by reserving space while 'places' is empty/loading */}
              {places.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <article
                    key={`skeleton-${i}`}
                    className="group relative rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm min-h-[450px] animate-pulse"
                  >
                    <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800"></div>
                    <div className="p-4 flex flex-col flex-1 gap-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
                      <div className="mt-auto grid grid-cols-3 gap-2">
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                /* ACTUAL CONTENT: Rendered once data exists */
                displayedPlaces.map((place, index) => {
                  const isPriority = index < 2;
                  const hasPhotos = place.album_photos && place.album_photos.length > 0;

                  return (
                    <article
                      key={place.id}
                      className="group relative rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-xl"
                    >
                      <header
                        className={`relative w-full aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden ${hasPhotos ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={(e) => {
                          if (hasPhotos) {
                            e.stopPropagation();
                            setActiveId(place.id);
                          }
                        }}
                      >
                        {place.cover_photo_url && (
                          <img
                            src={getOptimizedUrl(place.cover_photo_url, 400, 70)}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading={isPriority ? "eager" : "lazy"}
                            fetchPriority={isPriority ? "high" : "auto"}
                            alt={`${place.place_name} - Technical ${place.category} index record located in ${place.locality || "the backcountry wilderness"}, Sri Lanka.`}
                          />
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

                        {/* Top Status Overlay Badge */}
                        <div className="absolute top-4 left-4 pointer-events-none">
                          <span
                            className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-wider shadow-sm ${place.status === "done" ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"
                              }`}
                          >
                            {place.status === "done"
                              ? t('places.status.visited', { defaultValue: '✨ Visited' })
                              : t('places.status.bucket_list', { defaultValue: '⏳ Bucket List' })}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-4 pr-4">
                          {place.status === "done" ? (
                            <a
                              href={`/place/${getMediaSEOPlaceSlug(place)}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleOpenArticle(place);
                              }}
                              className="text-white text-xs md:text-sm font-extrabold uppercase tracking-tight hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                            >
                              {auditLocationName(place.place_name)}
                            </a>
                          ) : (
                            <h3 className="text-white text-xs md:text-sm font-extrabold uppercase tracking-tight">
                              {auditLocationName(place.place_name)}
                            </h3>
                          )}
                        </div>
                      </header>

                      <main className="p-4 flex flex-col flex-1">
                        {/* Locality & Color-coded Category Bubble */}
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                              {place.locality || t('places.labels.explore', { defaultValue: 'Explore' })}
                            </span>
                          </div>

                          {/* Exact size & position preserved, only dynamic colors applied */}
                          <span
                            className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase shrink-0 transition-colors ${getCategoryColorClass(
                              place.category
                            )}`}
                          >
                            {t(`categories.${place.category ? place.category.toLowerCase() : 'default'}`, {
                              defaultValue: place.category
                            })}
                          </span>
                        </div>

                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          {userCoords
                            ? `${calculateDistance(userCoords.lat, userCoords.lng, place.latitude, place.longitude).toFixed(1)} ${t('places.labels.km_away', { defaultValue: 'KM AWAY' })}`
                            : t('places.labels.location_required', { defaultValue: 'Location Access Required' })}
                        </div>

                        {place.status !== "pending" && (
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/60">
                            {/* LIKE BUTTON */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(place.id);
                              }}
                              className="flex items-center gap-1.5 group outline-none select-none pr-2"
                            >
                              <div className="p-2 rounded-full group-hover:bg-rose-50 dark:group-hover:bg-rose-950/30 transition-colors">
                                <Heart
                                  className={`w-4 h-4 ${likes[place.id] ? "fill-rose-500 text-rose-500" : "text-slate-400"
                                    }`}
                                />
                              </div>
                              <span
                                className={`text-[10px] font-black transition-colors ${likes[place.id]?.isUserLiked ? "text-rose-600" : "text-slate-500"
                                  }`}
                              >
                                {likes[place.id]?.count || 0}
                              </span>
                            </button>

                            {/* COMMENTS BUTTON */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenComments(place);
                              }}
                              className="flex items-center gap-1.5 group outline-none select-none pr-2"
                            >
                              <div className="p-2 rounded-full group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors">
                                <MessageCircle className="w-4 h-4 text-slate-400" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">
                                {(comments[place.id] || []).length}
                              </span>
                            </button>

                            {/* SHARE BUTTON */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (place?.id && typeof handleShareEvent === "function") {
                                  handleShareEvent(place.id, "article");
                                }
                                if (typeof handleShare === "function") {
                                  handleShare(e, place);
                                }
                              }}
                              className="flex items-center gap-1.5 group outline-none select-none"
                              aria-label="Share Article"
                            >
                              <div className="p-2 rounded-full group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/30 transition-colors">
                                <Share2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                              </div>
                              <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-500 transition-colors">
                                {shares?.[place?.id] || 0}
                              </span>
                            </button>

                          </div>
                        )}

                        <footer className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-slate-100/60 dark:border-slate-800/60">
                          {place.google_maps_url && (
                            <button
                              onClick={() => {
                                const mapsUrl = getSafeHttpUrl(place.google_maps_url);
                                if (mapsUrl) window.open(mapsUrl, "_blank", "noopener,noreferrer");
                              }}
                              className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 active:scale-90 transition-all border border-slate-100/50 dark:border-slate-700/50"
                            >
                              <MapIcon className="w-4 h-4" />
                              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{t('places.labels.maps', { defaultValue: 'Maps' })}</span>
                            </button>
                          )}
                          {hasPhotos && (
                            <a
                              href={`/gallery/${getMediaSEOPlaceSlug(place)}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveId(place.id);
                              }}
                              className="flex flex-col items-center justify-center py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-100/50 dark:border-orange-900/30"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{t('places.labels.gallery', { defaultValue: 'Gallery' })}</span>
                            </a>
                          )}
                          {place.ai_article?.story && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenArticle(place);
                              }}
                              className="flex flex-col items-center justify-center py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-100/50 dark:border-emerald-900/30"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{t('places.labels.read', { defaultValue: 'Read' })}</span>
                            </button>
                          )}
                        </footer>
                      </main>
                    </article>
                  );
                })
              )}
            </div>

            {/* 2. INFINITE SCROLL SENTINEL */}
            <div ref={sentinelRef} className="w-full flex justify-center items-center py-12">
              {visibleCount < filteredPlaces.length && <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />}
            </div>


            {/* =======================================================================
          3. DESTINATION FIELD GUIDES & TRAVEL LOGS (ADSENSE ACCORDION)
          Uses a native HTML <details> tag for instant crawler indexing and clean UI.
          ======================================================================= */}
            <details className="group w-full max-w-6xl mx-auto mb-10 [&::-webkit-details-marker]:hidden">
              {/* Button-like Toggle */}
              <summary className="list-none cursor-pointer flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all select-none active:scale-[0.98]">
                <BookOpen className="w-4 h-4 text-indigo-500 transition-transform duration-300 group-open:-rotate-12" />
                <span className="group-open:hidden">Read Detailed Field Guides & Travel Logs</span>
                <span className="hidden group-open:inline">Hide Exploration Directory</span>
              </summary>

              {/* Expanded Content */}
              <div className="overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-8 px-2 md:px-4 w-full">

                  {/* Header */}
                  <div className="mb-6 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t('headers.directory_title')}
                    </h2>
                  </div>

                  {/* Grid Directory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {places?.map((place) => {
                      // Abstracted Access Restriction Status Configuration
                      const restrictionLevel = place.restriction_level?.trim() || 'None';
                      let statusLabel = "No Restriction";
                      let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30";

                      if (restrictionLevel === 'Low') {
                        statusLabel = "Tickets Required";
                        badgeColor = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
                      } else if (restrictionLevel === 'High') {
                        statusLabel = "Permit Required";
                        badgeColor = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30";
                      } else if (restrictionLevel === 'Restricted') {
                        statusLabel = "No Entry";
                        badgeColor = "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30";
                      }

                      return (
                        <article
                          key={`visible-art-${place.id}`}
                          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          {/* Metadata Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                              {place.category || "Adventure"}
                            </span>

                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                              {place.locality || "Sri Lanka"}
                            </span>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide inline-block border ${badgeColor}`}>
                              {statusLabel}
                            </span>
                          </div>

                          {/* Title & Content */}
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                            {place.place_name} Travel Information
                          </h3>

                          <div className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-4 leading-relaxed">
                            <p>{place.ai_article_preview || place.ai_article?.story || "Detailed exploration logs are updating live via telemetry datasets."}</p>
                          </div>

                          {/* Footer Attribution Context */}
                          <div className="border-t border-slate-50 dark:border-slate-800/50 pt-3 text-xs text-slate-400 dark:text-slate-500">
                            <p>
                              <span className="font-semibold text-slate-500 dark:text-slate-400">Authority Context:</span> Verified under the jurisdiction of {place.governing_org || "local administrative departments"}.
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                </div>
              </div>
            </details>


            {/* 4. GOOGLE AD & EXPANDED LEGAL FOOTER */}
            {import.meta.env.VITE_ALLOW_ADSENSE === 'true' && (
              <div className="w-full max-w-5xl mx-auto px-4 min-h-[100px] mb-10 transition-all flex justify-center items-center overflow-hidden bg-slate-50 rounded-[2rem] border border-slate-100">
                {/* Google Ad */}
              </div>
            )}

            {/* ============================================================================
          APPLICATION FOOTER LAYER (SEO & ADSENSE COMPLIANCE NAVIGATION)
          ============================================================================ */}
            <footer className="py-12 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 transition-colors duration-200">
              <div className="max-w-6xl mx-auto px-6">

                {/* Policy & Expedition Disclaimer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left mb-10">

                  {/* Safety & Localized Terrain Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <AlertCircle size={14} className="text-amber-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                        {t('footer.safety_title')}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {t('footer.safety_body')}
                    </p>
                  </div>

                  {/* Drone Operations & Technical Telemetry Disclaimer */}
                  <div className="md:border-l md:border-slate-200 md:dark:border-slate-800 md:pl-10 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Video size={14} className="text-indigo-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
                        {t('footer.drone_title')}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {t('footer.drone_body')}
                    </p>
                  </div>
                </div>

                <nav
                  aria-label="Explore My Journal"
                  className="border-t border-slate-100 dark:border-slate-800 py-6 space-y-3"
                >
                  <h4 className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Explore
                  </h4>
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] font-black uppercase tracking-widest">
                    <a
                      href="/videos"
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Videos
                    </a>
                    <a
                      href="/route-planner"
                      onClick={(event) => {
                        event.preventDefault();
                        setIsPlannerOpen(true);
                      }}
                      className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
                    >
                      Route Planner
                    </a>
                    <a
                      href="/suggest-spot"
                      onClick={(event) => {
                        event.preventDefault();
                        pendingAddVisitTypeRef.current = 'Suggest Spot';
                        setIsAddOpen(true);
                      }}
                      className="text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
                    >
                      Suggest a Spot
                    </a>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                    <h5 className="text-center text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      Destination Hubs
                    </h5>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {VALID_CATEGORIES.map((category) => (
                        <a
                          key={`footer-category-${category}`}
                          href={`/?category=${encodeURIComponent(category.toLowerCase())}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {t(`categories.${category.toLowerCase().replace(/\s+/g, '_')}`, {
                            defaultValue: category,
                          })}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {places
                      .filter((place) => place.status === "done")
                      .slice(0, 8)
                      .map((place) => (
                        <a
                          key={`footer-place-${place.id}`}
                          href={`/place/${getMediaSEOPlaceSlug(place)}`}
                          onClick={(event) => {
                            event.preventDefault();
                            handleOpenArticle(place);
                          }}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                        >
                          {getLocalizedValue(place, "place_name", i18n.language)}
                        </a>
                      ))}
                  </div>
                </nav>

                {/* ============================================================================
              LOCATION 4: RENDER THE NEWSLETTER COMPONENT (FULLY FUNCTIONAL)
              ============================================================================ */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-8 pb-4 my-2">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-100/40 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 transition-colors">

                    {/* Newsletter Header Text */}
                    <div className="space-y-1 text-left w-full md:w-auto">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-100">
                        {t('newsletter.title', 'Join the Expedition')}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {t('newsletter.subtitle', 'Get coordinates, field notes, and remote terrain tracking straight to your inbox.')}
                      </p>
                    </div>

                    {/* Newsletter Input/Action Form Matrix */}
                    <form className="flex w-full md:w-auto max-w-md items-center gap-2" onSubmit={handleNewsletterSubmit}>
                      <input
                        type="email"
                        placeholder={t('newsletter.placeholder', 'Your email address')}
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        disabled={isNewsletterSubmitting}
                        className="w-full md:w-64 px-3 py-2 text-[11px] font-medium bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors disabled:opacity-60"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isNewsletterSubmitting}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center min-w-[90px]"
                      >
                        {isNewsletterSubmitting ? t('newsletter.submitting', 'Saving...') : t('newsletter.subscribe', 'Subscribe')}
                      </button>
                    </form>

                  </div>
                </div>

                {/* Compliance Navigation Links */}
                <div className="flex flex-col items-center border-t border-slate-100 dark:border-slate-800 pt-8 gap-6">
                  <nav aria-label="Site information" className="flex flex-wrap justify-center gap-x-8 gap-y-4">

                    {/* Privacy Policy Route */}
                    <a
                      href="/privacy"
                      className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalView('privacy');
                        setIsPrivacyOpen(true);
                        window.history.pushState({}, '', '/privacy');
                      }}
                    >
                      {t('legal.privacy_title')}
                    </a>

                    {/* Terms of Service Route */}
                    <a
                      href="/terms"
                      className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalView('terms');
                        setIsPrivacyOpen(true);
                        window.history.pushState({}, '', '/terms');
                      }}
                    >
                      {t('legal.terms_title')}
                    </a>

                    {/* Ad-Engine Trackable About Summary Route */}
                    <a
                      href="/about"
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 uppercase tracking-widest transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalView('about');
                        setIsPrivacyOpen(true);
                        window.history.pushState({}, '', '/about');
                      }}
                    >
                      {t('footer.about')}
                    </a>

                    {/* Support Mailbox Routing */}
                    <a
                      href="mailto:my.journal.view@gmail.com"
                      className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open('mailto:my.journal.view@gmail.com', '_blank', 'noopener,noreferrer');
                      }}
                    >
                      {t('footer.contact_support')}
                    </a>
                  </nav>

                  {/* Social & Community Links */}
                  <nav aria-label="Social and community links" className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                    <a href="https://web.facebook.com/profile.php?id=61571059524746" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Facebook</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://www.youtube.com/@myjournalview" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">YouTube</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://www.tiktok.com/@myjournalview" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">TikTok</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://www.instagram.com/myjournalview" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Instagram</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://www.pinterest.com/myjournalview" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pinterest</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://www.threads.net/@myjournalview" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Threads</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://mastodon.social/@myjournal" target="_blank" rel="me noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Mastodon</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://bsky.app/profile/myjournalview.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Bluesky</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://flipboard.com/@MyJournalView" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Flipboard</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://x.com/MyJournalView" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Twitter</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://unsplash.com/@myjournalview" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Unsplash</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://discord.gg/gV3ez5sHe" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Discord</a>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <a href="https://surf.social/feed/surf%2Fcustom%2F01krgmm2q431csk9w5550n1b9k" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Surf</a>
                  </nav>

                  {/* Branding & Digital Rights Footer Metadata */}
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-[0.3em]">
                      © {new Date().getFullYear()} {t('common.title')} • Hasitha Gunasekera
                    </p>
                    <p className="text-[8px] text-slate-300 dark:text-slate-600 uppercase font-medium mt-2 tracking-widest">
                      {t('footer.location')}
                    </p>
                  </div>

                </div>
              </div>
            </footer>

            {/* 5. SHARE DIALOG SYSTEM maintained */}
            {isShareModalOpen && sharingData && (
              <div className="fixed inset-0 z-[15000] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  onClick={() => setIsShareModalOpen(false)}
                ></div>

                <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Share2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">
                      {sharingData.isGallery ? 'Share Gallery' : 'Share Journey'}
                    </h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                      {sharingData.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* WhatsApp: Supports Text + Link */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(sharingData.text + " " + sharingData.url)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-colors group text-center"
                    >
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">WhatsApp</span>
                    </a>

                    {/* Facebook: ONLY URL (Facebook handles the preview via your SEO tags) */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharingData.url)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors group text-center"
                    >
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                        <span className="font-black text-lg">f</span>
                      </div>
                      <span className="text-[9px] font-black text-blue-700 uppercase tracking-tighter">Facebook</span>
                    </a>

                    {/* X (Twitter): Supports Text + Link */}
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(sharingData.text)}&url=${encodeURIComponent(sharingData.url)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-200 transition-colors group text-center"
                    >
                      <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg shadow-slate-300 group-hover:scale-110 transition-transform">
                        <X className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">Twitter (X)</span>
                    </a>

                    {/* Copy Link: The most reliable way for Instagram/Stories */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sharingData.url);
                        toast.success("Link ready to paste!");
                        setIsShareModalOpen(false);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-colors group text-center"
                    >
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-black text-indigo-700 uppercase tracking-tighter">Copy Link</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="w-full mt-8 py-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* =======================================================================
        HUMAN VISUAL INTERFACE (DYNAMIC MODAL OVERLAY)
        ======================================================================= */}
          {isArticleOpen && viewingArticle && (() => {
            // ================================================================
            // 1. SAFELY PARSE AI_ARTICLE (Handles Objects & JSON Strings)
            // ================================================================
            let article = {};

            if (
              typeof viewingArticle.ai_article === 'object' &&
              viewingArticle.ai_article !== null
            ) {
              article = viewingArticle.ai_article;
            } else if (typeof viewingArticle.ai_article === 'string') {
              try {
                article = JSON.parse(viewingArticle.ai_article);
              } catch (e) {
                console.error("Failed to parse ai_article JSON:", e);
                article = {};
              }
            }

            // Render translated article values throughout every section of the journal.
            article = { ...article, ...(translatedContent || {}) };

            // ================================================================
            // 2. ARTICLE CONTENT + TRANSLATION-AWARE PROSE FIELDS
            // ================================================================
            const about = article.about || {};

            /*
             * IMPORTANT:
             * These fields must read from translatedContent/getActiveContent first.
             * This prevents the Article Window from falling back to the
             * original English article when a translated version exists.
             */
            const seoIntro =
              getActiveContent('seo_intro') ||
              article.seo_intro ||
              '';

            const whyVisitSummary =
              translatedContent?.why_visit?.summary ||
              article.why_visit?.summary ||
              '';

            const storyText =
              getActiveContent('story') ||
              article.story ||
              (
                typeof viewingArticle.ai_article === 'string'
                  ? viewingArticle.ai_article
                  : ''
              );

            const historyText =
              getActiveContent('history') ||
              article.history ||
              '';

            // ================================================================
            // 3. SAFE FAQ EXTRACTION
            // ================================================================
            const rawFaqs =
              article.faqs ||
              article.faq ||
              article.faq_list ||
              [];

            const faqs = Array.isArray(rawFaqs) ? rawFaqs : [];

            // ================================================================
            // 4. REGULATORY METADATA & FALLBACKS
            // ================================================================
            const governingOrg =
              viewingArticle.governing_org ||
              'Department of Wildlife Conservation / Local Authority';

            const restrictionLevel =
              viewingArticle.restriction_level?.trim() ||
              'None';

            let statusLabel = "No Restriction";
            let badgeColor =
              "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30";

            if (restrictionLevel === 'Low') {
              statusLabel = "Tickets Required";
              badgeColor =
                "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
            } else if (restrictionLevel === 'High') {
              statusLabel = "Permit Required";
              badgeColor =
                "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30";
            } else if (restrictionLevel === 'Restricted') {
              statusLabel = "No Entry";
              badgeColor =
                "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30";
            }

            return (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
                  onClick={() => {
                    setIsArticleOpen(false);
                    setviewingArticle(null);
                    window.history.replaceState(null, '', '/');
                  }}
                ></div>

                <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                  {/* Header Image */}
                  <div className="relative h-48 w-full shrink-0">
                    <img
                      src={viewingArticle.cover_photo_url}
                      className="h-full w-full object-cover"
                      alt={getLocalizedValue(
                        viewingArticle,
                        'place_name',
                        i18n.language
                      )}
                      fetchPriority="high"
                      loading="eager"
                      decoding="async"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsArticleOpen(false);
                        setviewingArticle(null);
                        window.history.replaceState(null, '', '/');
                      }}
                      className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-gray-500/80 hover:bg-rose-600 text-white rounded-full transition-all shadow-sm backdrop-blur-sm"
                      aria-label={t('article.close', { defaultValue: 'Close' })}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div
                    ref={articleWindowScrollRef}
                    className="article-window-scroll native-scroll-y p-8 scrollable-list no-scrollbar bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >

                    <Breadcrumbs
                      className="mb-5 text-xs text-slate-500 dark:text-slate-400"
                      items={[
                        { label: "My Journal", href: "/" },
                        { label: "Destinations", href: "/#destinations" },
                        {
                          label: getLocalizedValue(
                            viewingArticle,
                            'place_name',
                            i18n.language
                          ),
                        },
                      ]}
                    />

                    {/* ============================================================
              META BAR
          ============================================================ */}
                    <div className="flex items-center justify-between mb-4">

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${getCategoryColorClass(
                            viewingArticle.category
                          )}`}
                        >
                          {t(
                            `categories.${viewingArticle.category?.toLowerCase()}`,
                            {
                              defaultValue: viewingArticle.category
                            }
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setIsArticleOpen(false);
                            setActiveId(viewingArticle.id);
                            window.history.replaceState(null, '', '/');
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-900/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition-colors animate-pulse"
                        >
                          <Camera className="w-3 h-3" />
                          {t('article.gallery_btn', { defaultValue: 'Gallery' })}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleShare(null, viewingArticle)}
                          className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-100 dark:hover:border-indigo-900/50 rounded-xl transition-colors border border-slate-100 dark:border-slate-700/60 group"
                          title={t('article.share', { defaultValue: 'Share' })}
                        >
                          <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const mapsUrl = getSafeHttpUrl(
                              viewingArticle.google_maps_url ||
                              `https://www.google.com/maps/search/?api=1&query=${viewingArticle.latitude},${viewingArticle.longitude}`
                            );
                            if (mapsUrl) window.open(mapsUrl, "_blank", "noopener,noreferrer");
                          }}
                          className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-100 dark:border-slate-700/60"
                          title={t('article.view_maps', { defaultValue: 'View on Maps' })}
                        >
                          <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        </button>

                        {viewingArticle.status !== 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleLike(viewingArticle.id)}
                            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700/60 transition-all"
                          >
                            <Heart
                              className={`w-4 h-4 ${likes[viewingArticle.id]
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-slate-400'
                                }`}
                            />
                            <span
                              className={`text-[10px] font-black transition-colors ${likes[viewingArticle.id]?.isUserLiked
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-900 dark:text-slate-200'
                                }`}
                            >
                              {likes[viewingArticle.id]?.count || 0}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ============================================================
              AI JOURNAL MAIN BODY
          ============================================================ */}
                    <div className="mb-10">

                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
                        {getActiveContent('title') ||
                          getLocalizedValue(
                            viewingArticle,
                            'place_name',
                            i18n.language
                          )}
                      </h2>

                      {/* SEO INTRO */}
                      {seoIntro && (
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                          {seoIntro}
                        </p>
                      )}

                      {storyText ? (
                        <div className="space-y-8">

                          {/* QUICK FACTS */}
                          {article.quick_facts && (
                            <section className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                {t('article.technical_specs')}
                              </h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                                <div><span className="block text-slate-400 font-bold mb-1">{t('article.elevation')}</span><span className="font-semibold">{article.quick_facts.elevation_m}m</span></div>
                                <div><span className="block text-slate-400 font-bold mb-1">{t('article.difficulty')}</span><span className="font-semibold">{article.quick_facts.difficulty}</span></div>
                                <div><span className="block text-slate-400 font-bold mb-1">Time Req</span><span className="font-semibold">{article.quick_facts.time_required}</span></div>
                                <div><span className="block text-slate-400 font-bold mb-1">Vehicle Access</span><span className="font-semibold">{article.quick_facts.vehicle_access}</span></div>
                                <div><span className="block text-slate-400 font-bold mb-1">Moto Friendly</span><span className="font-semibold">{article.quick_facts.motorcycle_friendly}</span></div>
                                <div><span className="block text-slate-400 font-bold mb-1">Mobile Signal</span><span className="font-semibold">{article.quick_facts.mobile_coverage}</span></div>
                              </div>
                            </section>
                          )}

                          {/* WHY VISIT? */}
                          {(article.why_visit || translatedContent?.why_visit) && (
                            <section>
                              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">
                                {t('article.expedition_highlights')}
                              </h3>
                              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                {whyVisitSummary}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                  <span className="block text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-2">
                                    Highly Rewarding For
                                  </span>
                                  <ul className="space-y-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                    {article.why_visit?.best_for?.map((item, i) => <li key={i}>✓ {item}</li>)}
                                  </ul>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                  <span className="block text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-2">
                                    Less Suitable For
                                  </span>
                                  <ul className="space-y-1 text-xs font-medium text-rose-800 dark:text-rose-300">
                                    {article.why_visit?.less_suitable_for?.map((item, i) => <li key={i}>✗ {item}</li>)}
                                  </ul>
                                </div>
                              </div>
                            </section>
                          )}

                          {/* EXPEDITION JOURNAL */}
                          <section className="prose dark:prose-invert max-w-none">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">
                              Expedition Journal
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line border-l-2 border-indigo-500 pl-4 italic">
                              {storyText}
                            </p>
                          </section>

                          {/* EXPLORER RATING */}
                          {article.explorer_rating && (
                            <section className="bg-indigo-900 text-white rounded-3xl p-6 shadow-lg">
                              <h3 className="text-sm font-black uppercase tracking-widest text-indigo-200 mb-4">Explorer Rating</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">📸 Photography</span><span className="font-black text-lg">{article.explorer_rating.photography}/10</span></div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">🏍 Adventure</span><span className="font-black text-lg">{article.explorer_rating.adventure}/10</span></div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">👨‍👩‍👧 Family</span><span className="font-black text-lg">{article.explorer_rating.family_friendly}/10</span></div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">🚁 Drone</span><span className="font-black text-lg">{article.explorer_rating.drone}/10</span></div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm"><span className="block text-indigo-300 mb-1">😌 Crowds</span><span className="font-black text-lg">{article.explorer_rating.crowd_level}/10</span></div>
                                <div className="bg-indigo-500 p-3 rounded-xl shadow-inner"><span className="block text-indigo-100 mb-1">⭐ Overall</span><span className="font-black text-lg">{article.explorer_rating.overall}/10</span></div>
                              </div>
                            </section>
                          )}

                          {/* PHOTOGRAPHY & DRONE NOTES */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {article.photography_notes && (
                              <section className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">📸 Photography Notes</h3>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium">
                                  <li><strong className="text-slate-900 dark:text-slate-100">Best Time:</strong> {article.photography_notes.best_time}</li>
                                  <li><strong className="text-slate-900 dark:text-slate-100">Lighting:</strong> {article.photography_notes.lighting}</li>
                                  <li><strong className="text-slate-900 dark:text-slate-100">Composition:</strong> {article.photography_notes.best_composition}</li>
                                  <li><strong className="text-slate-900 dark:text-slate-100">Lenses:</strong> {article.photography_notes.lens_recommendation}</li>
                                  <li className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 italic text-[10px]">{article.photography_notes.mobile_notes}</li>
                                </ul>
                              </section>
                            )}
                            {article.drone_notes && (
                              <section className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-3">🚁 Drone Flying Notes</h3>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-medium">
                                  <li><strong className="text-slate-900 dark:text-slate-100">Conditions:</strong> {article.drone_notes.flight_conditions}</li>
                                  <li><strong className="text-slate-900 dark:text-slate-100">Wind:</strong> {article.drone_notes.wind}</li>
                                  <li><strong className="text-slate-900 dark:text-slate-100">Launch Area:</strong> {article.drone_notes.launch_area}</li>
                                  <li><strong className="text-slate-900 dark:text-slate-100">Obstacles:</strong> {article.drone_notes.obstacles}</li>
                                  <li className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-rose-500 font-bold text-[10px]">Restrictions: {article.drone_notes.restrictions}</li>
                                </ul>
                              </section>
                            )}
                          </div>

                          {/* ROUTE & ACCESS REPORT */}
                          {article.route_report && (
                            <section className="p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
                              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">🏍 Route & Access Report</h3>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div><span className="block text-slate-400 font-bold mb-1">Starting Point</span><span className="font-semibold dark:text-slate-200">{article.route_report.starting_point}</span></div>
                                <div><span className="block text-slate-400 font-bold mb-1">Distance & Time</span><span className="font-semibold dark:text-slate-200">{article.route_report.distance_km}km ({article.route_report.travel_time})</span></div>
                                <div className="col-span-2"><span className="block text-slate-400 font-bold mb-1">Road Conditions</span><span className="font-semibold dark:text-slate-200">{article.route_report.road_condition}</span></div>
                                <div className="col-span-2"><span className="block text-slate-400 font-bold mb-1">Hazards & Fuel</span><span className="font-semibold text-amber-600 dark:text-amber-400">{article.route_report.hazards} | {article.route_report.fuel_parking}</span></div>
                              </div>
                            </section>
                          )}

                          {/* WHAT I WISH I KNEW */}
                          {article.wish_i_knew && article.wish_i_knew.length > 0 && (
                            <section className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                              <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-3">💡 What I Wish I Knew</h3>
                              <ul className="list-disc list-inside space-y-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
                                {article.wish_i_knew.map((tip, i) => <li key={i}>{tip}</li>)}
                              </ul>
                            </section>
                          )}

                          {/* BEHIND THE SHOT */}
                          {article.behind_the_shot && (
                            <section className="bg-slate-900 dark:bg-black text-white p-6 rounded-3xl shadow-xl">
                              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Behind The Shot</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                                <div>
                                  <p className="text-slate-300 italic mb-3">"{article.behind_the_shot.why_i_took_it}"</p>
                                  <div className="space-y-1 text-slate-400">
                                    <p><strong>Device:</strong> {article.behind_the_shot.device}</p>
                                    <p><strong>Time:</strong> {article.behind_the_shot.captured_time}</p>
                                    <p><strong>Conditions:</strong> {article.behind_the_shot.conditions}</p>
                                  </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                                  <span className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Post-Processing</span>
                                  <p className="text-slate-300">{article.behind_the_shot.editing}</p>
                                </div>
                              </div>
                            </section>
                          )}



                          {/* HISTORY & HERITAGE */}
                          {historyText && (
                            <section className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">{t('article.history_heritage')}</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{historyText}</p>
                            </section>
                          )}

                        </div>
                      ) : (
                        /* FALLBACK SUMMARY LAYER */
                        <div className="space-y-4">
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                            {getLocalizedValue(
                              viewingArticle,
                              'description',
                              i18n.language
                            ) ||
                              t('article.fallback_desc')}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleOpenArticle(viewingArticle)}
                            className="inline-flex items-center justify-center px-5 py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                          >
                            {t('article.load_journal_btn')}
                          </button>
                        </div>
                      )}

                      {/* ============================================================
                CONSERVATION, REGULATIONS & EDITORIAL FOOTER
            ============================================================ */}
                      <section className="mt-6 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200">
                              {t('article.compliance_title')}
                            </h4>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between items-center text-center">
                            <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                              {t('article.governing_body')}
                            </span>
                            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 truncate w-full">
                              <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">{governingOrg}</span>
                            </p>
                          </div>

                          <div className="bg-white dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between items-center text-center">
                            <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                              {t('article.access_restriction')}
                            </span>
                            <div className="mt-0.5 flex justify-center w-full">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                                {t(`restriction.${restrictionLevel.toLowerCase()}`, { defaultValue: statusLabel })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium pt-1">
                          <p>
                            {about.conservation_rules ||
                              t('article.compliance_prose_1', {
                                place: getLocalizedValue(viewingArticle, 'place_name', i18n.language) || 'this destination',
                                org: governingOrg
                              })}
                          </p>
                        </div>
                      </section>

                      {/* FAQ SECTION */}
                      {faqs.length > 0 && (
                        <section className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t('article.faq_title')}</h3>
                          <div className="space-y-4">
                            {faqs.map((faq, index) => (
                              <div key={index} className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                                  {faq.question || faq.q}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {faq.answer || faq.a}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      <footer className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-black text-[9px]">
                            HG
                          </div>
                          <span>
                            {t('article.archived_by')}{' '}
                            <strong className="text-slate-800 dark:text-slate-200">Hasitha Gunasekera</strong>
                          </span>
                        </div>
                        <div>
                          <span>
                            {t('article.record_ref')} #{viewingArticle.id || '000'}
                          </span>
                        </div>
                      </footer>
                    </div>

                    {/* ============================================================
              DISCUSSION / COMMENTS BLOCK
          ============================================================ */}
                    <div
                      id="comments-discussion-section"
                      className="border-t border-slate-100 dark:border-slate-800 pt-8"
                    >
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2">
                        <MessageCircle className="w-3 h-3" />
                        {t('article.discussion_count', {
                          defaultValue: 'Discussion',
                          count: comments[viewingArticle.id]?.length || 0
                        })}{' '}
                        ({comments[viewingArticle.id]?.length || 0})
                      </h4>

                      <div className="space-y-4 mb-8">
                        {comments[viewingArticle.id]?.map((c, i) => (
                          <div
                            key={i}
                            className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
                          >
                            <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold mb-2">
                              {c.comment_text}
                            </p>
                            <div className="flex justify-between items-center opacity-60">
                              <span className="text-[8px] font-bold text-slate-400 uppercase">
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                              {(c.city || c.country) && (
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                  {[c.city, c.country].filter(Boolean).join(', ')}
                                </span>
                              )}
                            </div>

                            {c.reply_text && (
                              <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                  <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                    {t('article.author_response', { defaultValue: 'Author Response' })}
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{c.reply_text}"
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="relative sticky bottom-0 bg-white dark:bg-slate-900 pt-2">
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setnewCommentText(e.target.value)}
                          placeholder={t('article.comment_placeholder', { defaultValue: 'Add your trail note...' })}
                          className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-slate-900 dark:focus:border-slate-100 focus:bg-white dark:focus:bg-slate-900 rounded-2xl px-5 py-4 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none pr-12"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && newCommentText.trim()) {
                              const text = newCommentText;
                              setnewCommentText('');
                              await submitComment(viewingArticle.id, text);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCommentText.trim()) submitComment(viewingArticle.id, newCommentText);
                            setnewCommentText('');
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                          <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}


          {/* --- ROUTE PLANNER MODAL --- */}

          {isPlannerOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-slate-900/95 backdrop-blur-md"
                onClick={() => setIsPlannerOpen(false)}
              ></div>

              {/* Modal Container */}
              <div className="relative bg-white dark:bg-slate-900 w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

                {/* LEFT SIDE: MAP ENGINE (Full Screen on Mobile) */}
                <div className="absolute inset-0 md:relative md:inset-auto md:h-full md:w-[60%] bg-slate-100 dark:bg-slate-950 z-0 overflow-hidden">
                  <MapComponent
                    places={isPlannerOpen ? plannerFilteredPlaces : filteredPlaces}
                    nearbyAttractions={nearbyAttractions}
                    routeAmenities={routeAmenities}
                    userCoords={userCoords}
                    selectedRoute={selectedRoute}
                    hoveredPlaceId={hoveredPlaceId}
                    setHoveredPlaceId={setHoveredPlaceId}
                    fetchAttractions={fetchRoutePlaceData}
                    setRouteDistance={setRouteDistance}
                    setRouteData={setRouteData}

                    // Nearby Places engine ONLY
                    isNearbySearchEnabled={isNearbySearchEnabled}

                    mapInstanceRef={mapRef}
                    routeLineRef={routeLineRef}
                    handleOpenArticle={handleOpenArticle}
                  />

                  {/* Floating Map Label */}
                  <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                        Interactive Route Engine
                      </p>
                    </div>
                  </div>

                  {/* Mobile Quick Expand Floating Button */}
                  {!isPlannerExpanded && (
                    <button
                      onClick={() => setIsPlannerExpanded(true)}
                      className="md:hidden absolute bottom-28 right-4 z-[1000] bg-slate-900 text-white p-3 rounded-full shadow-2xl active:scale-95 transition-transform"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* RIGHT SIDE: SELECTION PANEL & DRAG-AND-DROP WAYPOINTS */}
                <div
                  className={`absolute inset-x-0 bottom-0 z-10 flex flex-col bg-white dark:bg-slate-900 rounded-t-[2.5rem] md:rounded-t-none md:relative md:w-[40%] md:h-full border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] md:shadow-none transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${isPlannerExpanded
                    ? 'translate-y-0 h-[85vh]'
                    : 'translate-y-[calc(100%-100px)] h-[85vh] md:translate-y-0 md:h-full'
                    }`}
                >
                  {/* Mobile Drag Indicator & Toggle */}
                  <div
                    className="w-full flex flex-col items-center pt-2 pb-1 md:hidden cursor-pointer touch-none bg-white dark:bg-slate-900 rounded-t-[2.5rem]"
                    onClick={() => setIsPlannerExpanded(!isPlannerExpanded)}
                  >
                    <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-1"></div>
                    <div className={`transition-transform duration-500 ${isPlannerExpanded ? 'rotate-0' : 'animate-bounce'}`}>
                      {isPlannerExpanded ? (
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-6 h-6 text-slate-900 dark:text-slate-100" />
                      )}
                    </div>
                  </div>

                  {/* 1. Header Section & Unified Search */}
                  <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center justify-between pt-2">
                      <div
                        className="min-w-0 flex-1 cursor-pointer md:cursor-auto"
                        onClick={() => { if (window.innerWidth < 768) setIsPlannerExpanded(!isPlannerExpanded); }}
                      >
                        <h2 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 dark:text-slate-100 leading-none truncate">
                          Route Planner
                        </h2>
                        <Breadcrumbs
                          className="mt-2 text-[9px] text-slate-500 dark:text-slate-400"
                          items={[
                            { label: "My Journal", href: "/" },
                            { label: "Route Planner" },
                          ]}
                        />
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {selectedRoute.length} Stops
                          </span>
                          {selectedRoute.length > 0 && parseFloat(routeDistance) > 0 && (
                            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900 flex items-center gap-1">
                              <Navigation className="w-2.5 h-2.5" />
                              {routeDistance} KM
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {selectedRoute.length > 0 && (
                          <button
                            onClick={handleReset}
                            className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full active:rotate-180 transition-transform duration-500"
                            title="Reset Route"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setIsPlannerOpen(false);
                            window.history.pushState({}, '', window.location.pathname);
                          }}
                          className="w-8 h-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 dark:hover:bg-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Unified Search Bar with Scope Toggle */}
                    <div className={`relative mt-3 transition-opacity duration-300 ${!isPlannerExpanded ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}>
                      <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />

                        <input
                          id="planner-autocomplete-input"
                          ref={searchInputRef}
                          type="text"
                          value={plannerSearch}
                          onChange={(e) => setPlannerSearch(e.target.value)}
                          placeholder={
                            includeGooglePlaces
                              ? "Search Location (Global)"
                              : "Search Location (Bucket List)"
                          }
                          autoComplete="off"
                          className="w-full bg-transparent py-2.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
                        />

                        {/* Google Places Toggle Switch */}
                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2.5 pr-2 shrink-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 select-none hidden sm:inline">
                            + Maps
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={includeGooglePlaces}
                            onClick={() => setIncludeGooglePlaces(!includeGooglePlaces)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${includeGooglePlaces ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                              }`}
                            title={includeGooglePlaces ? "Search Scope: Bucket List + Google Places" : "Search Scope: Bucket List Only"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${includeGooglePlaces ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Search Scope Label */}
                      <div className="flex items-center justify-between mt-1 px-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Scope: {includeGooglePlaces ? 'Bucket List + Google Maps Places' : 'Bucket List Only'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Scrollable Content Area: Waypoints & Available Locations */}
                  <div className="flex-1 overflow-y-auto overscroll-y-contain touch-pan-y custom-scrollbar bg-white dark:bg-slate-900 pb-28 md:pb-24 p-4 space-y-6">

                    {/* Section A: Active Waypoints (Drag-and-Drop) */}
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Active Route Stops
                      </h3>
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="route-waypoints-list">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                              {selectedRoute.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl opacity-40 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  No waypoints added yet. Select from below or click map markers.
                                </div>
                              ) : (
                                selectedRoute.map((place, index) => (
                                  <Draggable key={place.id.toString()} draggableId={place.id.toString()} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="flex items-center p-3 rounded-2xl border border-indigo-500 bg-indigo-50/35 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20 shadow-sm transition-all"
                                      >
                                        {/* Drag Handle */}
                                        <div {...provided.dragHandleProps} className="mr-2 cursor-grab text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 touch-none">
                                          <GripVertical className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 min-w-0 pr-2 flex flex-col gap-2">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Category Color Dot */}
                                            <span
                                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${place.status === 'pending'
                                                ? 'bg-orange-500'
                                                : place.status === 'done'
                                                  ? 'bg-green-500'
                                                  : getCategoryColorClass(place.category)
                                                }`}
                                              style={{
                                                backgroundColor:
                                                  place.status === 'pending'
                                                    ? '#f97316'
                                                    : place.status === 'done'
                                                      ? '#22c55e'
                                                      : typeof getCategoryHex === 'function'
                                                        ? getCategoryHex(place.category)
                                                        : undefined,
                                              }}
                                              title={place.category || 'Location'}
                                            />
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase truncate text-slate-900 dark:text-slate-100">
                                                  {place.place_name || place.name}
                                                </span>
                                              </div>
                                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5 block">
                                                Stop #{index + 1} {place.isNearby ? '• Nearby Attraction' : ''}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Weather Integration Badge */}
                                          <RouteWeatherBadge
                                            weatherData={weatherData}
                                            placeId={place.id}
                                            lat={place.latitude ?? place.lat}
                                            lng={place.longitude ?? place.lng}
                                          />
                                        </div>

                                        <button
                                          onClick={() => toggleRoutePlace(place)}
                                          className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-indigo-600 text-white shadow-md transition-all active:scale-95 self-center"
                                          title="Remove waypoint"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>

                    {/* Toggle Switch Control: Search Nearby Locations & Amenities */}
                    <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between transition-all">
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Nearby Locations & Amenities
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          Search & display nearby attractions, fuel, food & stays
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isNearbySearchEnabled}
                        onClick={() => setIsNearbySearchEnabled(!isNearbySearchEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isNearbySearchEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isNearbySearchEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Section B: Available Locations & Attractions */}
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Available Locations & Attractions
                      </h3>
                      <div className="space-y-2">
                        {plannerFilteredPlaces.length > 0 ? (
                          plannerFilteredPlaces.map((place) => {
                            const isSelected = selectedRoute.some((p) => p.id === place.id);

                            return (
                              <div
                                key={place.id}
                                onClick={() => toggleRoutePlace(place)}
                                className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${isSelected
                                  ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                  : 'bg-white border-slate-100 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900'
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  {/* Category Color Dot */}
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${place.status === 'pending'
                                      ? 'bg-orange-500'
                                      : place.status === 'done'
                                        ? 'bg-green-500'
                                        : getCategoryColorClass(place.category)
                                      }`}
                                    style={{
                                      backgroundColor:
                                        place.status === 'pending'
                                          ? '#f97316'
                                          : place.status === 'done'
                                            ? '#22c55e'
                                            : typeof getCategoryHex === 'function'
                                              ? getCategoryHex(place.category)
                                              : undefined,
                                    }}
                                    title={place.category || 'Location'}
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-[11px] font-bold uppercase truncate text-slate-800 dark:text-slate-200">
                                      {place.place_name || place.name}
                                    </h4>
                                    <p className="text-[9px] uppercase text-slate-400 font-semibold tracking-wider mt-0.5 truncate">
                                      {place.isNearby ? 'Nearby Attraction' : place.category || 'Saved Place'}
                                      {place.currentDistance !== undefined && place.currentDistance !== Infinity && ` • ${place.currentDistance.toFixed(1)} km away`}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}
                                >
                                  {isSelected ? '✓' : '+'}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                            No matching locations or attractions found.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* 3. Footer Actions (GPX, KML, Maps, Share/QR) */}
                  <div className="absolute md:relative bottom-0 left-0 w-full p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20 rounded-b-[2rem] md:rounded-b-none transition-colors duration-300">
                    <div className="flex flex-col gap-2">

                      {/* EXPORT ROW: GPX & KML */}
                      {selectedRoute.length >= 2 && parseFloat(routeDistance) > 0 && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <button
                            onClick={() => typeof downloadRouteFile === 'function' && downloadRouteFile('gpx')}
                            className="flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 active:scale-95"
                          >
                            <MapIcon className="w-3.5 h-3.5" /> GPX
                          </button>
                          <button
                            onClick={() => typeof downloadRouteFile === 'function' && downloadRouteFile('kml')}
                            className="flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 active:scale-95"
                          >
                            <MapPin className="w-3.5 h-3.5" /> KML
                          </button>
                        </div>
                      )}

                      {/* PRIMARY ACTIONS: Maps & QR/Share */}
                      <div className="flex gap-2">
                        {selectedRoute.length >= 2 && (
                          <button
                            onClick={shareRoute}
                            className="flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 active:scale-95"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Maps
                          </button>
                        )}
                        <button
                          onClick={() => selectedRoute.length > 0 && typeof showQRCode === 'function' && showQRCode(selectedRoute, "My Travel Plan")}
                          disabled={selectedRoute.length === 0}
                          className={`flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 ${selectedRoute.length > 0
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 hover:bg-slate-800 dark:hover:bg-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            }`}
                        >
                          <QrCode className="w-3.5 h-3.5" /> Share
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* --- SUGGEST A SPOT / ADD LOCATION MODAL --- */}
          {isAddOpen && (
            <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[3000] flex flex-col lg:flex-row animate-in fade-in duration-300">

              {/* LEFT SIDE: MAP SELECTION ENGINE & LIVE OVERLAY */}
              <div className="w-full lg:w-1/2 h-[35vh] lg:h-full bg-slate-100 dark:bg-slate-900 relative">
                {/* Map auto-centers and updates marker via formData state / addMapInstance */}
                {MemoizedAddMap}

                {/* Ultra-Compact Status Overlay */}
                <div className="absolute top-3 left-3 z-[1001] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 pointer-events-none min-w-[150px]">
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-tighter">
                    Live Verification
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.latitude ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 tabular-nums">
                      {formData.latitude
                        ? `${Number(formData.latitude).toFixed(4)}, ${Number(formData.longitude).toFixed(4)}`
                        : "SELECTING POINT..."}
                    </p>
                  </div>
                  {formData.locality && (
                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <MapPin className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                      <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter truncate">
                        {formData.locality}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: FORM & GOOGLE PLACES SEARCH */}
              <div className="w-full lg:w-1/2 p-5 lg:p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                <div>
                  {/* Header Section */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-slate-100">
                        Suggest Spot
                      </h2>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        Auto-Sync with Google Places & Map
                      </p>
                      <Breadcrumbs
                        className="mt-2 text-[9px] text-slate-500 dark:text-slate-400"
                        items={[
                          { label: "My Journal", href: "/" },
                          { label: "Suggest a Spot" },
                        ]}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddOpen(false);
                        // Reset deep link URL parameters on modal close
                        window.history.pushState({}, '', window.location.pathname);
                      }}
                      className="w-8 h-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddPlace} className="space-y-5">

                    {/* 1. Google Places Auto-Suggest Search Input */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Search Spot Name
                        </label>
                        {places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase()) && (
                          <span className="text-[8px] font-black text-red-500 uppercase animate-bounce">
                            Already in Database
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                          id="location-search"
                          type="text"
                          required
                          autoComplete="off"
                          placeholder="Search (e.g. Laxapana Falls)..."
                          value={formData.place_name || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, place_name: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none transition-all font-bold text-sm
                  ${places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase())
                              ? 'border-red-300 ring-2 ring-red-50 dark:ring-red-950/30'
                              : 'border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500'
                            }`}
                        />
                      </div>
                    </div>

                    {/* 2. Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Assign Category
                      </label>
                      <div className="relative">
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none font-bold text-[11px] uppercase tracking-wider appearance-none focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          {VALID_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* 3. Submission Action */}
                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={
                          !formData.latitude ||
                          !formData.place_name ||
                          places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase())
                        }
                        className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2
                ${formData.latitude && formData.place_name && !places.some(p => p.place_name?.toLowerCase() === formData.place_name?.trim().toLowerCase())
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/20 hover:bg-indigo-600 dark:hover:bg-indigo-500'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Submit for Review
                      </button>
                      <p className="text-[8px] text-center text-slate-400 font-bold mt-4 uppercase tracking-tighter opacity-70">
                        * Coordinates and locality are auto-captured upon selecting a Google location or pinning the map
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* --- MEDIA OVERLAYS --- */}

          {/* PHOTO OVERLAY */}
          {(() => {
            const activePlace = places.find((p) => p.id === activeId);
            if (!activePlace) return null;

            return (
              <PhotoGallery
                photos={activePlace.album_photos || []}
                placeName={activePlace.place_name}
                selectedLocation={activePlace}
                onClose={handleClosePhotoGallery}
                onShare={(e, location) => handleShare(e, location, true)}
                handleShareEvent={handleShareEvent}
              />
            );
          })()}

          {/* VIDEO OVERLAY */}
          {activeVideos.length > 0 && (
            <VideoGallery
              videos={activeVideos}
              initialIndex={0}
              onClose={handleCloseVideoGallery}
            />
          )}


          {/* --- SAFETY & LEGAL OVERLAYS --- */}
          <SafetyOverlay
            location={selectedLocation}
            isOpen={showSafetyModal}
            onClose={() => setShowSafetyModal(false)}
          />

          {/* =======================================================================
        UNIFIED LEGAL & ABOUT MODULE MODAL NODE
        Handles Privacy Policy, Terms, and About Platform content arrays 
        seamlessly for strict user transparency and AdSense crawling compliance.
        ======================================================================= */}
          <LegalAndAboutModal
            isOpen={isPrivacyOpen}
            /* 💡 Triggers the cleanup function that strips URL search query parameters (?view=...) from the address bar on close */
            onClose={handleCloseLegalModal}
            currentView={legalView}
            setView={setLegalView}
          />


          {/* =======================================================================
        PROACTIVE COOKIE CONSENT BANNER (ADSENSE & GDPR COMPLIANCE LAYER)
        ======================================================================= */}
          {showCookieBanner && (
            <div className="fixed bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-md bg-white dark:bg-slate-900 z-[99999] p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-800 flex flex-col gap-4 animate-in slide-in-from-bottom-10 duration-500">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Cookie Preference Notice</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    My Journal uses analytical and advertising cookie architectures via Google AdSense to personalize layout configurations and support platform operations.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-50 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => {
                    setLegalView('privacy');
                    setIsPrivacyOpen(true);
                  }}
                  className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 tracking-wider underline transition-colors"
                >
                  Review Policy
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeclineCookies}
                    className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95"
                  >
                    Decline Optional
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptCookies}
                    className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:bg-slate-800 dark:hover:bg-white transition-all active:scale-95"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================================
        LEGAL & CONTENT ARCHITECTURE COMPLIANCE NODE (HIDDEN FROM HUMANS — OPEN TO SCRAPERS)
        Guarantees AdSense automated engines crawl content arrays seamlessly.
        ======================================================================= */}
          <div className="sr-only opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true">
            {/* Privacy Framework Section */}
            <section id="crawler-legal-privacy">
              <h2>Privacy Policy for My Journal</h2>
              <p>Last updated: 2026</p>
              <h3>01. Geospatial Data and Tracking Information</h3>
              <p>To provide distance calculations and optimized route navigation profiles across travel basins, our application accesses device coordinates. This location framework operates entirely client-side to map routes against dynamic map vectors.</p>
              <h3>02. Third-Party Integrations & Advertising Cookies</h3>
              <p>This web application uses Google AdSense data clusters to deliver relevant advertisements to users. Google uses tracking cookies to display programmatic ads based on browsing history and destination engagement indexes. Users can configure opt-out cookies via official Google safety panels.</p>
            </section>

            {/* Terms & Conditions Section */}
            <section id="crawler-legal-terms">
              <h2>Terms of Service for My Journal</h2>
              <h3>01. Informational Reference Clause</h3>
              <p>All hiking trails, remote waterfalls, and route data vectors displayed within My Journal are generated for open-source geographical reference. Users assume absolute risk regarding trail difficulty, landscape hazards, and weather adjustments.</p>
              <h3>02. Civil Aviation Authority Legal Compliance</h3>
              <p>Drone pilots utilizing routing data parameters are strictly required to ensure full compliance with Civil Aviation Authority of Sri Lanka (CAASL) regulations. Flying drone configurations within active National Parks, high security military networks, or sanctuary parameters requires formal Department of Wildlife Conservation (DWC) documentation.</p>
            </section>

            {/* Platform Profile & Contextual Metadata Section */}
            <section id="crawler-about-journal">
              <h2>About My Journal Platform and Explorer Profile</h2>

              <h3>01. Author Profile and Objective</h3>
              <p>
                Hi, I'm Hasitha Gunasekera. I'm an explorer, road-tripper, and outdoor photographer dedicated to tracking down unknown spaces across Sri Lanka. My true passion lies in backcountry trekking, remote high-altitude wilderness camping, and exploring uncharted waterfall cascades tucked deep within mountain ranges.
              </p>

              <h3>02. Technical Application Scope</h3>
              <p>
                My Journal serves as a specialized, technical field log detailing remote coordinates, spatial records, and trail notes across Sri Lanka. Engineered to integrate backcountry mapping indicators, weather monitors, and route telemetry, it aims to connect adventure travelers safely to hidden destinations while establishing strict environmental safety standards.
              </p>

              <h3>03. Geographic Index Coverage</h3>
              <p>
                Sri Lanka houses phenomenal geographic biodiversity, stretching from the dense mountain ridges of the Knuckles Forest Reserve to pristine cascade clusters like Bambarakanda and Diyaluma Falls. This open ledger indexes mountain plain tablelands, deep natural pools, and historic forest hermitages to showcase raw island terrain while advocating for strict nature preserve conservation metrics.
              </p>
            </section>

            {/* AI & Search Engine Tagline / Motto */}
            <section id="crawler-motto">
              <h2>Platform Motto</h2>
              <p>විදිමු , රැකගමු අනාගතය වෙනුවෙන්.</p>
              <p>Live with care, preserve with love — for the future yet to come.</p>
            </section>
          </div>

          {/* =======================================================================
        PROACTIVE NEWSLETTER SUBSCRIPTION PROMPT (UNIQUE USERS)
        ======================================================================= */}
          {showNewsletterPrompt && (
            <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
              <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={handleDismissNewsletterPrompt}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 text-slate-500 dark:text-slate-400 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Content Container */}
                <div className="text-center mt-2 mb-8">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                    Join the Expedition
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed px-2">
                    Subscribe to get the latest remote coordinates, secret waterfall locations, and field notes sent directly to your inbox.
                  </p>
                </div>

                {/* Reusing your global handleNewsletterSubmit & newsletterEmail state */}
                <form className="flex flex-col gap-3" onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    placeholder={t('newsletter.placeholder', 'Your email address')}
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={isNewsletterSubmitting}
                    className="w-full px-4 py-3 text-sm font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-colors disabled:opacity-60"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isNewsletterSubmitting}
                    className="w-full py-3 text-[11px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isNewsletterSubmitting ? t('newsletter.submitting', 'Saving...') : t('newsletter.subscribe', 'Subscribe')}
                  </button>
                </form>
              </div>
            </div>
          )}

        </>
      )}

    </div>



  );

  // ============================================================================
  // 38.MAIN RENDER ENDS
  // ===========================================================================


}

export default App;
