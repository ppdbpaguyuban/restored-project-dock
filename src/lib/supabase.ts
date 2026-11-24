import { createClient } from "@supabase/supabase-js";

// External Supabase project. Publishable key is safe in client code.
// Values come from .env (VITE_*) with in-code fallbacks so older builds keep working.
const env = import.meta.env as Record<string, string | undefined> | undefined;

export const SUPABASE_URL = env?.["VITE_SUPABASE_URL"] || "https://zchtldzkchlmfooexhbx.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  env?.["VITE_SUPABASE_PUBLISHABLE_KEY"] || "sb_publishable_f2riBfbwOJnb2F1NmmnsEg_PO_Z0qZx";
export const supabaseConfigured = true;

export const supabase = createClient(
  supabaseConfigured ? SUPABASE_URL : "https://placeholder.supabase.co",
  SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: typeof window !== "undefined" } },
);
