import { createServerClient as createSSRClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Uses the anon key — RLS applies (session-aware).
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies can't be set.
            // Safe to ignore if middleware refreshes sessions.
          }
        },
      },
    },
  );
}

import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Supabase client using the service role key.
 * Bypasses RLS — use ONLY on the server (webhook, seed, server-only routes).
 * NEVER expose this to the browser.
 */
export function createServiceRoleClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}