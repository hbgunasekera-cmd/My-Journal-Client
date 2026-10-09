import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const normalizeVisitPath = (value: unknown): string | null => {
  const rawPath = typeof value === 'string' ? value.trim() : ''
  const path = rawPath.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '')
  const lowerPath = path.toLowerCase()

  if (!path || lowerPath === 'main page') return 'Main Page'
  if (
    lowerPath === 'videos' ||
    lowerPath.startsWith('videos/') ||
    lowerPath === 'video gallery' ||
    lowerPath === 'video hub' ||
    lowerPath === 'video-gallery' ||
    lowerPath.startsWith('video-gallery/')
  ) return 'Video Hub'
  if (
    lowerPath === 'add' ||
    lowerPath === 'add function'
  ) return 'Add Function'
  if (lowerPath === 'suggest-spot' || lowerPath === 'suggest spot') return 'Suggest Spot'
  if (
    lowerPath === 'plan' ||
    lowerPath === 'route-planner' ||
    lowerPath === 'plan function'
  ) return 'Plan Function'

  const routeMatch = path.match(/^(place|gallery)\/([^/]+)$/i)
  if (!routeMatch) return null

  let slug = routeMatch[2]
  try {
    slug = decodeURIComponent(slug)
  } catch {
    // Keep the original slug if it contains malformed percent encoding.
  }

  const normalizedSlug = slug
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')

  return `${routeMatch[1].toLowerCase()}/${normalizedSlug}`
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const {
      event_type,
      page_path,
      user_agent,
      location_id,
      share_type,
      comment_text,
    } = await req.json();

    const supportedEvents = ['visit', 'like', 'unlike', 'comment', 'share']
    if (!supportedEvents.includes(event_type)) {
      return jsonResponse({ success: true, ignored: true })
    }

    let normalizedPagePath: string | null = null
    if (event_type === 'visit') {
      normalizedPagePath = normalizeVisitPath(page_path)
      if (!normalizedPagePath) {
        return jsonResponse({ success: true, ignored: true })
      }
    } else {
      const isUuid = typeof location_id === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(location_id)
      const validShareType = share_type === 'article' || share_type === 'gallery'
      const validComment = typeof comment_text === 'string' && comment_text.trim().length > 0

      if (
        !isUuid ||
        (event_type === 'share' && !validShareType) ||
        (event_type === 'comment' && !validComment)
      ) {
        return jsonResponse({ error: 'Invalid interaction payload.' }, 400)
      }
    }

    const safeUserAgent = typeof user_agent === 'string' ? user_agent : ''

    // 1. Extract the real User IP (Supabase/Cloudflare standard)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip_address =
      req.headers.get("cf-connecting-ip")?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      forwardedFor?.split(',')[0].trim() ||
      "0.0.0.0";

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('PRIVATE_SERVICE_ROLE_KEY')!
    );

    // 2. Default Geo from Headers
    let countryCode = req.headers.get("cf-ipcountry") || "Unknown";
    let city = req.headers.get("cf-ipcity") || "Unknown";
    let region = req.headers.get("cf-region") || req.headers.get("cf-region-code") || "Unknown";

    // 3. SERVER-SIDE FALLBACK (Bypasses Firefox/Browser blocks)
    // If headers failed, we use the IP to get data from the server side
    if ((city === "Unknown" || city === "") && ip_address !== "0.0.0.0") {
      try {
        const geoRes = await fetch(`https://ipwho.is/${ip_address}`);
        const geoData = await geoRes.json();
        if (geoData.success) {
          city = geoData.city || city;
          region = geoData.region || region;
          countryCode = geoData.country_code || countryCode;
        }
      } catch (e) {
        console.error("Geo lookup failed:", e);
      }
    }

    // 4. Format Country Name
    let countryName = countryCode;
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      countryName = displayNames.of(countryCode) || countryCode;
    } catch (e) {}

    if (event_type === 'share') {
      // The location_shares table uses `type` for the article/gallery value.
      const { error } = await supabase
        .from('location_shares')
        .insert([{
          location_id,
          type: share_type,
          country: countryName,
          city,
          ip_address,
        }]);

      if (error) throw error;
      return jsonResponse({ success: true })
    }

    if (event_type === 'like' || event_type === 'unlike') {
      const { data: existingLike, error: lookupError } = await supabase
        .from('location_likes')
        .select('location_id')
        .eq('location_id', location_id)
        .eq('ip_address', ip_address)
        .limit(1)
        .maybeSingle()

      if (lookupError) throw lookupError;

      if (event_type === 'like' && !existingLike) {
        const { error } = await supabase
          .from('location_likes')
          .insert([{
            location_id,
            country: countryName,
            city,
            ip_address,
          }]);

        if (error) throw error;
      } else if (event_type === 'unlike' && existingLike) {
        const { error } = await supabase
          .from('location_likes')
          .delete()
          .eq('location_id', location_id)
          .eq('ip_address', ip_address)

        if (error) throw error;
      }

      const { count, error: countError } = await supabase
        .from('location_likes')
        .select('location_id', { count: 'exact', head: true })
        .eq('location_id', location_id)

      if (countError) throw countError;

      return jsonResponse({
        success: true,
        isUserLiked: event_type === 'like',
        count: count || 0,
      })
    }

    if (event_type === 'comment') {
      const { data, error } = await supabase
        .from('location_comments')
        .insert([{
          location_id,
          comment_text: comment_text.trim(),
          country: countryName,
          city,
        }])
        .select('*')
        .single()

      if (error) throw error;
      return jsonResponse({ success: true, comment: data })
    }

    // Visits only are inserted into page_visits.
    const { error } = await supabase
      .from('page_visits')
      .insert([{
        page_path: normalizedPagePath,
        user_agent: safeUserAgent,
        country: countryName,
        region: region,
        city: city,
        ip_address: ip_address // CRITICAL: This was missing in your last log
      }]);

    if (error) throw error;

    return jsonResponse({ success: true })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown tracking error'
    return jsonResponse({ error: message }, 400)
  }
})
