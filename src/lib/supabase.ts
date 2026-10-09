import { createClient } from '@supabase/supabase-js';

const JWT_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoam5kcWZnZGVidW9pd2R4dHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NTc5MzUsImV4cCI6MjEwNjQzMzkzNX0.KuQonlxEBnBDQDh04w7BP_JKJMh0TmAHfWYZ1j9588s';

const supabaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().startsWith('http')
    ? process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
    : 'https://ehjndqfgdebuoiwdxttg.supabase.co';

const resolveKey = (key?: string) => {
  if (key && key.trim().startsWith('eyJ')) {
    return key.trim();
  }
  return JWT_KEY;
};

const supabaseAnonKey = resolveKey(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const supabaseServiceRoleKey = resolveKey(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY
);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    (supabaseAnonKey || supabaseServiceRoleKey)
  );
};

// Client for candidate and anonymous read requests (strictly anon key, never service-role)
export const supabaseClient = isSupabaseConfigured() && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: (url, options = {}) =>
          fetch(url, {
            ...options,
            cache: 'no-store',
          }),
      },
    })
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
        global: {
          fetch: (url, options = {}) =>
            fetch(url, {
              ...options,
              cache: 'no-store',
            }),
        },
      })
    : null;
