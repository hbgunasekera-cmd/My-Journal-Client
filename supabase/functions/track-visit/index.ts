const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  try {
    const body = await req.json().catch(() => ({}))
    const clientUserAgent =
      typeof body?.user_agent === 'string' ? body.user_agent.trim() : ''
    const requestUserAgent = req.headers.get('user-agent')?.trim() || ''

    // Read visitor details from the request as seen by Supabase/Cloudflare.
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip_address =
      req.headers.get('cf-connecting-ip')?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      forwardedFor?.split(',')[0].trim() ||
      '0.0.0.0'
    // The browser UA is sent in the request body because some proxies replace
    // or omit the User-Agent header before the request reaches the function.
    const user_agent = clientUserAgent || requestUserAgent

    let countryCode = req.headers.get('cf-ipcountry') || 'Unknown'
    let city = req.headers.get('cf-ipcity') || 'Unknown'
    let region =
      req.headers.get('cf-region') ||
      req.headers.get('cf-region-code') ||
      'Unknown'

    // Fill missing geo fields on the server when the edge headers are absent.
    if (
      (countryCode === 'Unknown' || city === 'Unknown' || region === 'Unknown') &&
      ip_address !== '0.0.0.0'
    ) {
      try {
        const geoResponse = await fetch(`https://ipwho.is/${encodeURIComponent(ip_address)}`)
        const geoData = await geoResponse.json()
        if (geoData.success) {
          countryCode = geoData.country_code || countryCode
          city = geoData.city || city
          region = geoData.region || region
        }
      } catch (error) {
        console.error('Server-side geo lookup failed:', error)
      }
    }

    let country = countryCode
    try {
      country = new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || countryCode
    } catch {
      // Keep the server-provided country code if it cannot be formatted.
    }

    // This function only returns metadata. All event inserts happen in the
    // frontend using the returned values.
    return jsonResponse({
      success: true,
      ip_address,
      country,
      region,
      city,
      user_agent,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown metadata error'
    console.error('Visitor metadata request failed:', message)
    return jsonResponse({ error: message }, 500)
  }
})
