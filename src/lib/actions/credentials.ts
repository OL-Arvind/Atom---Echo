"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptPassword, decryptPassword } from "@/lib/security/encryption";

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

    // 2. Fetch admin user for audit attribution
    const { data: user } = await supabase.from("users").select("id").limit(1).maybeSingle();

    if (user) {
      await supabase.from("credential_audit_logs").insert({
        credential_id: cred.id,
        user_id: user.id,
        action: "unmask_password",
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    // 3. Decrypt AES-256-GCM payload
    const plaintext = decryptPassword(cred.encrypted_password);

    revalidatePath("/operations");
    revalidatePath(`/clients/${cred.client_id}`);
    return { success: true, plaintext };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function copyCredentialAction(credentialId: string) {
  try {
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

    const { data: user } = await supabase.from("users").select("id").limit(1).maybeSingle();

    if (user) {
      await supabase.from("credential_audit_logs").insert({
        credential_id: cred.id,
        user_id: user.id,
        action: "copy_password",
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    const plaintext = decryptPassword(cred.encrypted_password);

    revalidatePath("/operations");
    revalidatePath(`/clients/${cred.client_id}`);
    return { success: true, plaintext };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addCredentialAction(formData: FormData) {
  try {
    const supabase = createAdminClient();
    const { ip, userAgent } = await getClientContextHeaders();

    const clientId = formData.get("client_id") as string;
    const platform = formData.get("platform") as string;
    const username = formData.get("username_or_email") as string;
    const password = formData.get("password") as string;
    const twoFactor = formData.get("two_factor_method") as string;
    const notes = formData.get("notes") as string;

    if (!clientId || !platform || !username || !password) {
      return { success: false, error: "Platform, username, and password are required." };
    }

    let { data: user } = await supabase.from("users").select("id").limit(1).maybeSingle();
    if (!user) {
      const { data: org } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
      if (org) {
        const { data: newUser } = await supabase
          .from("users")
          .insert({
            organization_id: org.id,
            email: "sudeesh@atomandecho.com",
            full_name: "Sudeesh D S",
            role: "admin",
          })
          .select("id")
          .single();
        user = newUser;
      }
    }

    if (!user) {
      return { success: false, error: "Unable to associate credential with an active operator." };
    }

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
        last_updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Produce initial audit log for secret creation
    await supabase.from("credential_audit_logs").insert({
      credential_id: data.id,
      user_id: user.id,
      action: "update_secret",
      ip_address: ip,
      user_agent: userAgent,
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/operations");
    return { success: true, credential: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
