import { z } from "zod";

export const addCredentialSchema = z.object({
  client_id: z.string().min(1, "Client ID is required."),
  platform: z.string().trim().min(1, "Platform name is required (e.g. LinkedIn)."),
  username_or_email: z.string().trim().min(1, "Username or account email is required."),
  password: z.string().min(1, "Password is required."),
  two_factor_method: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  notes: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export type AddCredentialInput = z.infer<typeof addCredentialSchema>;
