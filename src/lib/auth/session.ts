import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OperatorSession {
  id: string;
  email: string;
  name: string;
  role: "admin" | "lead_operator" | "operator";
  provider: "google" | "email";
}

/**
 * Resolves or provisions an operator record in the `users` table so
 * audit logs (`credential_audit_logs.user_id`) always reference a valid UUID.
 */
export async function resolveOrCreateOperatorRecord(
  email: string,
  fullName: string
): Promise<{ id: string; email: string; full_name: string; role: "admin" | "lead_operator" | "operator" } | null> {
  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingUser } = await admin
    .from("users")
    .select("id, email, full_name, role")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingUser) {
    return existingUser as {
      id: string;
      email: string;
      full_name: string;
      role: "admin" | "lead_operator" | "operator";
    };
  }

  // Ensure default organization exists
  let { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", "atom-and-echo")
    .maybeSingle();

  if (!org) {
    const { data: firstOrg } = await admin
      .from("organizations")
      .select("id")
      .limit(1)
      .maybeSingle();
    org = firstOrg;
  }

  if (!org) {
    const { data: newOrg } = await admin
      .from("organizations")
      .insert({
        name: "Atom & Echo",
        slug: "atom-and-echo",
        currency: "INR",
      })
      .select("id")
      .single();
    org = newOrg;
  }

  if (!org?.id) return null;

  const inferredRole = normalizedEmail.includes("nikhil") ? "lead_operator" : "admin";

  const { data: created } = await admin
    .from("users")
    .insert({
      organization_id: org.id,
      email: normalizedEmail,
      full_name: fullName || normalizedEmail.split("@")[0],
      role: inferredRole,
    })
    .select("id, email, full_name, role")
    .single();

  return (created as { id: string; email: string; full_name: string; role: "admin" | "lead_operator" | "operator" }) || null;
}

/**
 * Reads the active operator session strictly from Supabase Auth.
 */
export async function getServerOperatorSession(): Promise<OperatorSession | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser && authUser.email) {
      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email.split("@")[0];
      const dbUser = await resolveOrCreateOperatorRecord(authUser.email, fullName);
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.full_name,
          role: dbUser.role,
          provider: authUser.app_metadata?.provider === "google" ? "google" : "email",
        };
      }
    }
  } catch {
    // Request context unavailable
  }

  return null;
}

/**
 * Enforces that an active Supabase operator session exists before executing sensitive Server Actions.
 */
export async function requireOperatorSession(): Promise<OperatorSession> {
  const session = await getServerOperatorSession();
  if (!session) {
    throw new Error("Unauthorized: Please sign in to the Atom & Echo operator workspace.");
  }
  return session;
}
