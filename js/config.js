export const SUPABASE_URL = "https://qtiamgjtuzhrebqdrtlq.supabase.co";
export const SUPABASE_KEY = "sb_publishable_v1HijF40ZV6uGd70tThFMg_IbC8zvQI";

export const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);