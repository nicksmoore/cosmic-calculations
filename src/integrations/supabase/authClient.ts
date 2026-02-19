import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Returns a Supabase client authenticated with a Clerk JWT token.
 * Use for writes (posts, likes, comments) where RLS must verify identity.
 * For public reads, use the default `supabase` client from ./client.ts.
 *
 * Prerequisites (manual dashboard steps):
 * 1. Clerk Dashboard → Configure → JWT Templates → create template named "supabase"
 * 2. Supabase Dashboard → Auth → JWT Settings → add Clerk JWKS URL
 *    JWKS URL: https://national-lamb-67.clerk.accounts.dev/.well-known/jwks.json
 */
export function getAuthenticatedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
