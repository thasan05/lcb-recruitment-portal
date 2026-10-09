import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    (supabaseAnonKey || supabaseServiceRoleKey)
  );
};

// Client for candidate and anonymous read requests (strictly anon key, never service-role)
export const supabaseClient = isSupabaseConfigured() && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side admin client using service role key (bypasses RLS for HR administration).
// Strictly available in server-side execution environments.
export const supabaseAdmin =
  typeof window === 'undefined' && isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
