import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveOrCreateOperatorRecord } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/command-center";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email || "sudeesh@atomandecho.com";
      const fullName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        email.split("@")[0];

      // Provision or sync operator record in Postgres `users` table
      await resolveOrCreateOperatorRecord(email, fullName);

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const redirectBase =
        !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;

      const response = NextResponse.redirect(`${redirectBase}${next}`);

      // Set client-readable session cookies so WorkspaceShell & Sidebar immediately sync
      const cookieMaxAge = 60 * 60 * 24 * 30;
      response.cookies.set("ae_session", "active", {
        path: "/",
        maxAge: cookieMaxAge,
        sameSite: "lax",
      });
      response.cookies.set("ae_operator_email", email, {
        path: "/",
        maxAge: cookieMaxAge,
        sameSite: "lax",
      });

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
