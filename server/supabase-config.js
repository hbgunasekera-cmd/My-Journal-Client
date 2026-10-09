const DEFAULT_SUPABASE_URL = "https://vpslgikpaintiuayajmx.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rsbN_QlROV14EEzYjl9dTQ_Jxl-ra44";

export function getSupabaseServerConfig() {
  return {
    supabaseUrl:
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      DEFAULT_SUPABASE_URL,
    supabaseKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.VITE_SUPABASE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  };
}
