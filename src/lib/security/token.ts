import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TokenVerificationResult {
  valid: boolean;
  reason?: "not_found" | "revoked" | "expired";
  clientId?: string;
  tokenRecord?: {
    id: string;
    client_id: string;
    token_hash: string;
    expires_at: string;
    last_accessed_at: string | null;
    revoked: boolean;
    created_at: string;
  };
}

/**
 * Generates a cryptographically secure 256-bit (64 hex characters) token
 * with a 7-day expiration window by default.
 */
export async function createClientReviewToken(
  clientId: string,
  daysValid: number = 7
): Promise<{ success: boolean; token: string; expiresAt: string; id?: string; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    // Generate 32 bytes of cryptographically secure random entropy -> 64-char hex string
    const rawEntropy = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("review_tokens")
      .insert({
        client_id: clientId,
        token_hash: rawEntropy,
        expires_at: expiresAt,
        revoked: false,
      })
      .select("id, token_hash, expires_at")
      .single();

    if (error) {
      console.error("Error creating review token in DB:", error);
      return { success: false, token: "", expiresAt: "", error: error.message };
    }

    return {
      success: true,
      token: data.token_hash,
      expiresAt: data.expires_at,
      id: data.id,
    };
  } catch (err: any) {
    console.error("Unexpected error creating review token:", err);
    return { success: false, token: "", expiresAt: "", error: err.message };
  }
}

/**
 * Retrieves the currently active review token for a client,
 * or generates a new 7-day cryptographic token if none exists or if expired.
 */
export async function getClientActiveReviewToken(
  clientId: string
): Promise<{ token: string; expiresAt: string } | null> {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Check for an existing unexpired, unrevoked token
    const { data: existingTokens } = await supabase
      .from("review_tokens")
      .select("id, token_hash, expires_at")
      .eq("client_id", clientId)
      .eq("revoked", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingTokens && existingTokens.length > 0) {
      return {
        token: existingTokens[0].token_hash,
        expiresAt: existingTokens[0].expires_at,
      };
    }

    // Generate a new 7-day token
    const created = await createClientReviewToken(clientId, 7);
    if (created.success) {
      return {
        token: created.token,
        expiresAt: created.expiresAt,
      };
    }

    return null;
  } catch (err) {
    console.error("Error in getClientActiveReviewToken:", err);
    return null;
  }
}

/**
 * Strictly verifies a review token against the database:
 * - Scopes query to review_tokens
 * - Rejects if revoked
 * - Rejects if expired (expires_at <= now)
 * - Updates last_accessed_at asynchronously
 */
export async function verifyClientReviewToken(
  token: string
): Promise<TokenVerificationResult> {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { valid: false, reason: "not_found" };
  }

  try {
    const supabase = createAdminClient();
    const cleanToken = token.trim();
    const hashed = crypto.createHash("sha256").update(cleanToken).digest("hex");

    const { data: tokenRecord, error } = await supabase
      .from("review_tokens")
      .select("id, client_id, token_hash, expires_at, last_accessed_at, revoked, created_at")
      .or(`token_hash.eq.${hashed},token_hash.eq.${cleanToken}`)
      .maybeSingle();

    if (error || !tokenRecord) {
      return { valid: false, reason: "not_found" };
    }

    if (tokenRecord.revoked) {
      return { valid: false, reason: "revoked", tokenRecord };
    }

    const expiresAt = new Date(tokenRecord.expires_at).getTime();
    if (expiresAt <= Date.now()) {
      return { valid: false, reason: "expired", tokenRecord };
    }

    // Update last_accessed_at (fire-and-forget, non-blocking)
    Promise.resolve(
      supabase
        .from("review_tokens")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", tokenRecord.id)
    ).catch((err: unknown) => console.warn("Could not update last_accessed_at:", err));

    return {
      valid: true,
      clientId: tokenRecord.client_id,
      tokenRecord,
    };
  } catch (err) {
    console.error("Error verifying review token:", err);
    return { valid: false, reason: "not_found" };
  }
}

/**
 * Revokes a review token immediately (e.g. after full batch publication or explicit security revocation).
 */
export async function revokeClientReviewToken(
  tokenIdOrHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tokenIdOrHash
    );

    const query = supabase
      .from("review_tokens")
      .update({ revoked: true });

    const { error } = isUuid
      ? await query.eq("id", tokenIdOrHash)
      : await query.eq("token_hash", tokenIdOrHash);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Calculates the next optimal publishing slot (next weekday at 10:00 AM UTC).
 * If an existing future scheduled date is provided, it is preserved.
 */
export function calculateNextPublishSlot(existingDate?: string | null): string {
  if (existingDate) {
    const existing = new Date(existingDate);
    if (existing.getTime() > Date.now()) {
      return existing.toISOString();
    }
  }

  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setUTCHours(10, 0, 0, 0);

  // If Saturday (6), move to Monday (+2 days)
  if (target.getUTCDay() === 6) {
    target.setDate(target.getDate() + 2);
  }
  // If Sunday (0), move to Monday (+1 day)
  else if (target.getUTCDay() === 0) {
    target.setDate(target.getDate() + 1);
  }

  return target.toISOString();
}

