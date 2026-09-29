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
import { addCredentialSchema, editCredentialSchema, formatZodError } from "@/lib/validations";
import { requireOperatorSession } from "@/lib/auth/session";
import { verifyClientReviewToken } from "@/lib/security/token";

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

/**
 * Client Portal token-based credential reveal (with strict client isolation and scope enforcement)
 */
export async function revealClientCredentialByTokenAction(credentialId: string, token: string) {
  try {
    const verification = await verifyClientReviewToken(token);
    if (!verification.valid || !verification.clientId) {
      return { success: false, error: "Invalid or expired session link." };
    }

    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    // 1. Fetch credential with encrypted password
    let credRes = await supabase
      .from("credentials")
      .select("id, client_id, platform, username_or_email, encrypted_password, access_scope, notes, last_updated_by")
      .eq("id", credentialId)
      .single();

    if (credRes.error && credRes.error.message?.includes("access_scope")) {
      credRes = await supabase
        .from("credentials")
        .select("id, client_id, platform, username_or_email, encrypted_password, notes, last_updated_by")
        .eq("id", credentialId)
        .single();
    }

    const cred = credRes.data;
    if (!cred || credRes.error) {
      return { success: false, error: "Credential not found." };
    }

    // 2. Strict authorization: must belong to the token's client
    if (cred.client_id !== verification.clientId) {
      return { success: false, error: "Unauthorized: Access denied." };
    }

    // 3. Strict scope authorization: must be client_shared
    const isShared =
      (cred as any).access_scope === "client_shared" ||
      (typeof cred.notes === "string" && cred.notes.includes("[scope:client_shared]"));

    if (!isShared) {
      return { success: false, error: "Unauthorized: This login is not shared." };
    }

    // 4. Attribute audit log
    await supabase.from("credential_audit_logs").insert({
      credential_id: cred.id,
      user_id: cred.last_updated_by,
      action: "unmask_password",
      ip_address: ip,
      user_agent: `Client Desk [Token: ${token.slice(0, 8)}...] | ${userAgent}`,
    });

    // 5. Decrypt AES-256-GCM payload
    const plaintext = decryptPassword(cred.encrypted_password);
    return { success: true, plaintext, password: plaintext };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reveal credential.";
    return { success: false, error: message };
  }
}

/**
 * Client Portal token-based credential copy (with strict client isolation and scope enforcement)
 */
export async function copyClientCredentialByTokenAction(credentialId: string, token: string) {
  try {
    const verification = await verifyClientReviewToken(token);
    if (!verification.valid || !verification.clientId) {
      return { success: false, error: "Invalid or expired session link." };
    }

    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    let credRes = await supabase
      .from("credentials")
      .select("id, client_id, platform, username_or_email, encrypted_password, access_scope, notes, last_updated_by")
      .eq("id", credentialId)
      .single();

    if (credRes.error && credRes.error.message?.includes("access_scope")) {
      credRes = await supabase
        .from("credentials")
        .select("id, client_id, platform, username_or_email, encrypted_password, notes, last_updated_by")
        .eq("id", credentialId)
        .single();
    }

    const cred = credRes.data;
    if (!cred || credRes.error) {
      return { success: false, error: "Credential not found." };
    }

    if (cred.client_id !== verification.clientId) {
      return { success: false, error: "Unauthorized: Access denied." };
    }

    const isShared =
      (cred as any).access_scope === "client_shared" ||
      (typeof cred.notes === "string" && cred.notes.includes("[scope:client_shared]"));

    if (!isShared) {
      return { success: false, error: "Unauthorized: This login is not shared." };
    }

    await supabase.from("credential_audit_logs").insert({
      credential_id: cred.id,
      user_id: cred.last_updated_by,
      action: "copy_password",
      ip_address: ip,
      user_agent: `Client Desk [Token: ${token.slice(0, 8)}...] | ${userAgent}`,
    });

    const plaintext = decryptPassword(cred.encrypted_password);
    return { success: true, plaintext, password: plaintext };
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
      access_scope: formData.get("access_scope") || "agency_only",
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
      access_scope: accessScope,
    } = parsed.data;

    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    // Encrypt password using AES-256-GCM before database insertion
    const encrypted = encryptPassword(password);

    const insertPayload: Record<string, unknown> = {
      client_id: clientId,
      platform,
      username_or_email: username,
      encrypted_password: encrypted,
      two_factor_method: twoFactor || null,
      notes: notes || null,
      access_scope: accessScope,
      last_updated_by: operator.id,
    };

    let { data, error } = await supabase
      .from("credentials")
      .insert(insertPayload)
      .select()
      .single();

    if (error && error.message?.includes("access_scope")) {
      // Fallback if access_scope column is not yet in Supabase schema
      const annotatedNotes = `[scope:${accessScope}] ${notes || ""}`.trim();
      delete insertPayload.access_scope;
      insertPayload.notes = annotatedNotes || null;
      const retry = await supabase
        .from("credentials")
        .insert(insertPayload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

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

export async function updateCredentialAction(formData: FormData) {
  try {
    const operator = await requireOperatorSession();
    const rawInput = {
      id: formData.get("id"),
      client_id: formData.get("client_id"),
      platform: formData.get("platform"),
      username_or_email: formData.get("username_or_email"),
      password: formData.get("password") || undefined,
      two_factor_method: formData.get("two_factor_method") || undefined,
      notes: formData.get("notes") || undefined,
      access_scope: formData.get("access_scope") || "agency_only",
    };

    const parsed = editCredentialSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: formatZodError(parsed.error) };
    }

    const {
      id,
      client_id: clientId,
      platform,
      username_or_email: username,
      password,
      two_factor_method: twoFactor,
      notes,
      access_scope: accessScope,
    } = parsed.data;

    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    const updatePayload: Record<string, unknown> = {
      platform,
      username_or_email: username,
      two_factor_method: twoFactor || null,
      notes: notes || null,
      access_scope: accessScope,
      last_updated_by: operator.id,
      updated_at: new Date().toISOString(),
    };

    if (password) {
      updatePayload.encrypted_password = encryptPassword(password);
    }

    let { data, error } = await supabase
      .from("credentials")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error && error.message?.includes("access_scope")) {
      const annotatedNotes = `[scope:${accessScope}] ${notes || ""}`.trim();
      delete updatePayload.access_scope;
      updatePayload.notes = annotatedNotes || null;
      const retry = await supabase
        .from("credentials")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.from("credential_audit_logs").insert({
      credential_id: id,
      user_id: operator.id,
      action: "update_secret",
      ip_address: ip,
      user_agent: userAgent,
    });

    revalidate(`/clients/${clientId}`);
    revalidate("/operations");
    return { success: true, credential: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update credential.";
    return { success: false, error: message };
  }
}

export async function deleteCredentialAction(credentialId: string) {
  try {
    const operator = await requireOperatorSession();
    const supabase = createAdminClient();

    const { data: cred, error: fetchErr } = await supabase
      .from("credentials")
      .select("id, client_id, platform")
      .eq("id", credentialId)
      .single();

    if (fetchErr || !cred) {
      return { success: false, error: "Credential not found." };
    }

    // Clean up audit logs first (ensures foreign key cascade safety)
    await supabase
      .from("credential_audit_logs")
      .delete()
      .eq("credential_id", credentialId);

    const { error: delErr } = await supabase
      .from("credentials")
      .delete()
      .eq("id", credentialId);

    if (delErr) {
      return { success: false, error: delErr.message };
    }

    revalidate(`/clients/${cred.client_id}`);
    revalidate("/operations");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete credential.";
    return { success: false, error: message };
  }
}
