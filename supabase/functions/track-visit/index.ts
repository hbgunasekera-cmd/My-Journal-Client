import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { page_path, user_agent } = await req.json();

    // 1. Extract the real User IP (Supabase/Cloudflare standard)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip_address = forwardedFor ? forwardedFor.split(',')[0].trim() : "0.0.0.0";

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('PRIVATE_SERVICE_ROLE_KEY')!
    );

    // 5. INSERT (Including IP and Full Geo)
    const { error } = await supabase
      .from('page_visits')
      .insert([{
        page_path,
        user_agent,
        country: countryName,
        region: region,
        city: city,
        ip_address: ip_address // CRITICAL: This was missing in your last log
      }]);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
})