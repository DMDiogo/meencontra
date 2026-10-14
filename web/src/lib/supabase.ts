import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const client = url && anonKey ? createClient(url, anonKey) : null;

export function getSupabase() {
  if (!client) {
    throw new Error(
      "Supabase não está configurado. Preenche VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ficheiro web/.env.local.",
    );
  }
  return client;
}
