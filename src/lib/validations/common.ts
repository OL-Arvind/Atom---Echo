import { z } from "zod";

/**
 * Normalizes user-entered URLs.
 * If user enters "baseworks.in" or "www.baseworks.in", automatically prepends "https://".
 * Trims extra whitespace and validates URL format.
 */
export const flexibleUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((val) => {
    if (!val || val === "") return undefined;
    if (!/^https?:\/\//i.test(val)) {
      return `https://${val}`;
    }
    return val;
  })
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const parsed = new URL(val);
        return Boolean(parsed.hostname && parsed.hostname.includes("."));
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid website domain or URL (e.g. acme.com or https://acme.com)." }
  );

export const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val))
  .refine(
    (val) => {
      if (!val) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    },
    { message: "Please enter a valid email address." }
  );

export const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val));

export const currencyAmountSchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : Math.max(0, num);
  });

export const anchorDaySchema = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === "") return 1;
    const num = parseInt(String(val), 10);
    if (isNaN(num)) return 1;
    return Math.min(31, Math.max(1, num));
  });

export function formatZodError(error: z.ZodError): string {
  if (!error.issues || error.issues.length === 0) {
    return "Invalid input data. Please check your entries.";
  }
  return error.issues[0].message || "Invalid input data.";
}
