import { z } from "zod";

function cleanOptionalText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === "na" || lower === "n/a" || lower === "none" || lower === "-") return null;
  return trimmed;
}

export const addCredentialSchema = z.object({
  client_id: z.string().min(1, "Client ID is required."),
  platform: z.string().trim().min(1, "Platform name is required (e.g. LinkedIn)."),
  username_or_email: z.string().trim().min(1, "Username or account email is required."),
  password: z.string().min(1, "Password is required."),
  two_factor_method: z
    .string()
    .optional()
    .nullable()
    .transform(cleanOptionalText),
  notes: z
    .string()
    .optional()
    .nullable()
    .transform(cleanOptionalText),
  access_scope: z.enum(["agency_only", "client_shared"]).default("agency_only"),
});

export type AddCredentialInput = z.infer<typeof addCredentialSchema>;

export const editCredentialSchema = z.object({
  id: z.string().min(1, "Credential ID is required."),
  client_id: z.string().min(1, "Client ID is required."),
  platform: z.string().trim().min(1, "Platform name is required (e.g. LinkedIn)."),
  username_or_email: z.string().trim().min(1, "Username or account email is required."),
  password: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : null)),
  two_factor_method: z
    .string()
    .optional()
    .nullable()
    .transform(cleanOptionalText),
  notes: z
    .string()
    .optional()
    .nullable()
    .transform(cleanOptionalText),
  access_scope: z.enum(["agency_only", "client_shared"]).default("agency_only"),
});

export type EditCredentialInput = z.infer<typeof editCredentialSchema>;

