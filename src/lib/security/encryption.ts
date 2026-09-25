import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const PREFIX = "enc:v1:";

/**
 * Derives a 32-byte (256-bit) encryption key from the environment.
 * Prefers VAULT_ENCRYPTION_KEY, falling back to a SHA-256 derived key
 * from SUPABASE_SERVICE_ROLE_KEY. Throws in production if neither secret is configured.
 */
function getVaultKey(): Buffer {
  const envKey = process.env.VAULT_ENCRYPTION_KEY;
  if (envKey) {
    if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
      return Buffer.from(envKey, "hex");
    }
    return crypto.createHash("sha256").update(envKey).digest();
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey) {
    return crypto.createHash("sha256").update(serviceRoleKey).digest();
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing VAULT_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY in production environment."
    );
  }

  return crypto.createHash("sha256").update("atom-and-echo-dev-only-vault-key").digest();
}

/**
 * Encrypts a plaintext password using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptPassword(plaintext: string): string {
  if (!plaintext) return "";

  const key = getVaultKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted password.
 * Gracefully handles unencrypted legacy text if not matching the enc:v1 prefix.
 */
export function decryptPassword(encryptedPayload: string): string {
  if (!encryptedPayload) return "";

  // If not encrypted in v1 format, return as-is for backward compatibility
  if (!encryptedPayload.startsWith(PREFIX)) {
    return encryptedPayload;
  }

  try {
    const rawData = encryptedPayload.slice(PREFIX.length);
    const parts = rawData.split(":");
    if (parts.length !== 3) {
      throw new Error("Malformed encrypted payload");
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getVaultKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to decrypt password payload:", message);
    throw new Error("Decryption failed: integrity check failed or invalid key.");
  }
}

/**
 * Helper to test whether a string is currently encrypted
 */
export function isEncrypted(val: string): boolean {
  return typeof val === "string" && val.startsWith(PREFIX);
}
