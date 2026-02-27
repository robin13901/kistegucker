import { createClient } from '@supabase/supabase-js';

export async function requireAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    return null;
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false }
  });

  return { supabase };
}
