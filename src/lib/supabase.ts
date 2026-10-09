import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration for the LCB Recruitment Portal.
 *
 * SECURITY NOTES:
 * - The anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) is public browser-safe configuration.
 * - The service-role key (SUPABASE_SERVICE_ROLE_KEY) is SECRET and must never reach the client.
 * - supabaseAdmin uses the service-role key and is only initialized on the server.
 * - No hardcoded fallback keys — missing config disables Supabase gracefully.
 */

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();

// Validate that the URL looks like a Supabase endpoint
const isValidUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');

const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

// Service-role key: strictly server-only, never under NEXT_PUBLIC_ prefix
const supabaseServiceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  ''
).trim();

export const isSupabaseConfigured = (): boolean => {
  return isValidUrl && Boolean(supabaseAnonKey || supabaseServiceRoleKey);
};

// Client for candidate and anonymous read requests (anon key only)
export const supabaseClient: SupabaseClient | null =
  isSupabaseConfigured() && supabaseAnonKey
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

/**
 * Server-side admin client using service role key (bypasses RLS for HR administration).
 * Only created in server environments (typeof window === 'undefined').
 *
 * SECURITY: If no service-role key is configured, this falls back to the anon key.
 * All HR operations MUST check admin auth independently — never rely on RLS alone
 * when using a service-role client.
 */
export const supabaseAdmin: SupabaseClient | null =
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
