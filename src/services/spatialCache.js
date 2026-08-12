import { supabase } from '../utils/supabaseClient';

/**
 * Generate a unique cache key. Uses Web Crypto API (SHA-256) when in a 
 * secure context, with a non-cryptographic fallback for HTTP/staging environments.
 */
const generateCacheKey = async (endpoint, params) => {
  const serializedString = `${endpoint}_${JSON.stringify(params)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(serializedString);

  // Secure context check: crypto.subtle is only available in HTTPS/Localhost
  if (globalThis.crypto?.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback: Non-cryptographic hash representation for insecure staging environments
  let hash = 0;
  for (let i = 0; i < serializedString.length; i++) {
    const char = serializedString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
};

/**
 * Interceptor logic to handle cache lookups and asynchronous population.
 * 
 * @param {string} provider - The API source (e.g., 'mapbox', 'openweather')
 * @param {string} endpoint - The specific API path
 * @param {object} params - Request parameters for the spatial query
 * @param {function} fetchFallback - The primary API handler if cache misses
 */
export const fetchSpatialDataWithCache = async (provider, endpoint, params, fetchFallback) => {
  // 1. Generate key (async due to Web Crypto)
  const cacheKey = await generateCacheKey(endpoint, params);

  // 2. Attempt to resolve from Supabase cache layer
  const { data: cacheHit, error: cacheError } = await supabase
    .from('api_spatial_cache')
    .select('response_payload')
    .eq('cache_key', cacheKey)
    .maybeSingle();

  if (cacheHit && !cacheError) {
    return cacheHit.response_payload;
  }

  // 3. Cache miss: Execute the heavy API transaction via fallback handler
  const freshData = await fetchFallback(params);

  // 4. Populate cache asynchronously without blocking the main user thread
  if (freshData) {
    supabase
      .from('api_spatial_cache')
      .insert({
        cache_key: cacheKey,
        api_provider: provider,
        response_payload: freshData
      })
      .then(({ error }) => {
        if (error) console.warn('Cache population skipped:', error.message);
      });
  }

  return freshData;
};