// ============================================================
// AUTH CALLBACK — Server-side PKCE code exchange
// Handles: email confirmation, OAuth redirect, magic links
// GET /auth/callback?code=xxx → exchange code → redirect home
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle error from Supabase (e.g., expired link, access denied)
  if (error) {
    console.error(`[AuthCallback] Error: ${error} — ${errorDescription}`);
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("auth_error", errorDescription || error);
    return NextResponse.redirect(redirectUrl);
  }

  // Exchange PKCE code for session
  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // May fail during streaming — session is still set
            }
          },
        },
      }
    );

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Successful — redirect to intended destination
      const isRelative = next.startsWith("/");
      const redirectUrl = isRelative ? `${origin}${next}` : `${origin}/`;
      return NextResponse.redirect(redirectUrl);
    }

    console.error(
      `[AuthCallback] Code exchange failed: ${exchangeError.message}`
    );
    // Fall through to redirect home with error
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("auth_error", "Could not verify your account. The link may have expired — please try signing up again.");
    return NextResponse.redirect(redirectUrl);
  }

  // No code or error — just redirect home
  return NextResponse.redirect(`${origin}/`);
}
