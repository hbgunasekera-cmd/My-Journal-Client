const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const firstHeaderValue = (...values: Array<string | null>) =>
  values
    .map((value) => value?.split(',')[0].trim() || '')
    .find(Boolean) || ''

const getClientIp = (headers: Headers) =>
  firstHeaderValue(
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for'),
  ) || 'Unknown'

const isPublicIp = (ip: string) =>
  Boolean(ip) &&
  ip !== 'Unknown' &&
  ip !== '0.0.0.0' &&
  ip !== '127.0.0.1' &&
  ip !== '::1'

const countryDisplayName = (country: string, countryCode?: string) => {
  const value = country.trim() || countryCode?.trim() || 'Unknown'
  const code = /^[a-z]{2}$/i.test(value)
    ? value
    : value === 'Unknown'
      ? countryCode?.trim()
      : ''

  if (!code) return value

  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || value
  } catch {
    return value
  }
}

const getGeoData = async (ip: string, headers: Headers) => {
  let country = firstHeaderValue(
    headers.get('cf-ipcountry'),
    headers.get('x-vercel-ip-country'),
  ) || 'Unknown'
  let region = firstHeaderValue(
    headers.get('cf-region'),
    headers.get('cf-region-code'),
    headers.get('x-vercel-ip-country-region'),
  ) || 'Unknown'
  let city = firstHeaderValue(
    headers.get('cf-ipcity'),
    headers.get('x-vercel-ip-city'),
  ) || 'Unknown'
  let countryCode = /^[a-z]{2}$/i.test(country) ? country : ''

  // Fill missing geolocation on the server when the request's edge headers
  // do not include it. Bound the lookup so telemetry never holds up the app.
  if (
    (country === 'Unknown' || region === 'Unknown' || city === 'Unknown') &&
    isPublicIp(ip)
  ) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)

    try {
      const response = await fetch(
        `https://ipwho.is/${encodeURIComponent(ip)}`,
        { signal: controller.signal },
      )

      if (response.ok) {
        const geo = await response.json()
        if (geo?.success) {
          country = country === 'Unknown' ? geo.country || country : country
          countryCode = countryCode || geo.country_code || ''
          region = region === 'Unknown' ? geo.region || region : region
          city = city === 'Unknown' ? geo.city || city : city
        }
      }
    } catch {
      // Missing GeoIP data is non-fatal; the function still returns a record
      // with the request IP and explicit Unknown values.
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    country: countryDisplayName(country, countryCode),
    region: region || 'Unknown',
    city: city || 'Unknown',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed.' }, 405)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const ip_address = getClientIp(req.headers)
    const geo = await getGeoData(ip_address, req.headers)
    const bodyUserAgent =
      typeof body?.user_agent === 'string' ? body.user_agent.trim() : ''
    const headerUserAgent = req.headers.get('user-agent')?.trim() || ''

    // The browser sends its UA in the body because Supabase's proxy may
    // replace the browser's User-Agent header before this function receives it.
    const user_agent = bodyUserAgent || headerUserAgent || 'Unknown'

    // This endpoint only returns request metadata. All event rows are written
    // by the frontend to page_visits and the location interaction tables.
    return jsonResponse({
      success: true,
      ip_address,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      user_agent,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown metadata error'
    console.error('Visitor metadata request failed:', message)
    return jsonResponse({ success: false, error: message }, 500)
  }
})
