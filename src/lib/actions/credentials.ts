"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateDbCache } from "@/lib/data/supabase-queries";
import { encryptPassword, decryptPassword } from "@/lib/security/encryption";

function revalidate(path: string) {
  invalidateDbCache();
  revalidatePath(path);
}
import { addCredentialSchema, formatZodError } from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";

async function getClientContextHeaders() {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : headerList.get("x-real-ip") || "127.0.0.1";
    const userAgent = headerList.get("user-agent") || "Atom & Echo Operator Console";
    return { ip, userAgent };
  } catch {
    return { ip: "127.0.0.1", userAgent: "Atom & Echo Operator Console" };
  }
}

export async function revealCredentialAction(credentialId: string) {
  try {
    const operator = await requireOperatorSession();
    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    // 1. Fetch credential with encrypted password
    const { data: cred, error: credErr } = await supabase
      .from("credentials")
      .select("id, client_id, platform, username_or_email, encrypted_password")
      .eq("id", credentialId)
      .single();

    if (credErr || !cred) {
      return { success: false, error: "Credential not found." };
    }

    // 2. Attribute audit log to the authenticated operator
    await supabase.from("credential_audit_logs").insert({
      credential_id: cred.id,
      user_id: operator.id,
      action: "unmask_password",
      ip_address: ip,
      user_agent: userAgent,
    });

    // 3. Decrypt AES-256-GCM payload
    const plaintext = decryptPassword(cred.encrypted_password);

    revalidate("/operations");
    revalidate(`/clients/${cred.client_id}`);
    return { success: true, plaintext };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reveal credential.";
    return { success: false, error: message };
  }
}

export async function copyCredentialAction(credentialId: string) {
  try {
    const operator = await requireOperatorSession();
    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    const { data: cred, error: credErr } = await supabase
      .from("credentials")
      .select("id, client_id, encrypted_password")
      .eq("id", credentialId)
      .single();

    if (credErr || !cred) {
      return { success: false, error: "Credential not found." };
    }

    await supabase.from("credential_audit_logs").insert({
      credential_id: cred.id,
      user_id: operator.id,
      action: "copy_password",
      ip_address: ip,
      user_agent: userAgent,
    });

    const plaintext = decryptPassword(cred.encrypted_password);

    revalidate("/operations");
    revalidate(`/clients/${cred.client_id}`);
    return { success: true, plaintext };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to copy credential.";
    return { success: false, error: message };
  }
}

export async function addCredentialAction(formData: FormData) {
  try {
    const operator = await requireOperatorSession();
    const rawInput = {
      client_id: formData.get("client_id"),
      platform: formData.get("platform"),
      username_or_email: formData.get("username_or_email"),
      password: formData.get("password"),
      two_factor_method: formData.get("two_factor_method") || undefined,
      notes: formData.get("notes") || undefined,
    };

    const parsed = addCredentialSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      client_id: clientId,
      platform,
      username_or_email: username,
      password,
      two_factor_method: twoFactor,
      notes,
    } = parsed.data;

    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    // Encrypt password using AES-256-GCM before database insertion
    const encrypted = encryptPassword(password);

    const { data, error } = await supabase
      .from("credentials")
      .insert({
        client_id: clientId,
        platform,
        username_or_email: username,
        encrypted_password: encrypted,
        two_factor_method: twoFactor || null,
        notes: notes || null,
        last_updated_by: operator.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Produce initial audit log for secret creation attributed to active operator
    await supabase.from("credential_audit_logs").insert({
      credential_id: data.id,
      user_id: operator.id,
      action: "update_secret",
      ip_address: ip,
      user_agent: userAgent,
    });

    revalidate(`/clients/${clientId}`);
    revalidate("/operations");
    return { success: true, credential: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to store credential.";
    return { success: false, error: message };
  }
}
