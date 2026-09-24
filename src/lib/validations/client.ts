import { z } from "zod";
import {
  flexibleUrlSchema,
  optionalEmailSchema,
  optionalPhoneSchema,
  currencyAmountSchema,
  anchorDaySchema,
} from "./common";

export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Company or brand name is required."),
  founder_name: z.string().trim().min(1, "Founder full name is required."),
  founder_title: z.string().trim().optional().default("Founder & CEO"),
  founder_email: optionalEmailSchema,
  founder_phone: optionalPhoneSchema,
  linkedin_url: flexibleUrlSchema,
  website_url: flexibleUrlSchema,
  service_type: z
    .enum(["linkedin_branding", "cold_outreach", "hybrid_growth"])
    .default("linkedin_branding"),
  monthly_retainer: currencyAmountSchema,
  billing_anchor_day: anchorDaySchema,
});

export const tabooWordSchema = z.object({
  clientId: z.string().min(1, "Client ID is required."),
  word: z.string().trim().min(1, "Word cannot be empty.").transform((w) => w.toLowerCase()),
});

export const toolExpenseSchema = z.object({
  engagement_id: z.string().min(1, "Client engagement is required."),
  tool_name: z.string().trim().min(1, "Tool name is required."),
  description: z.string().trim().optional().default(""),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    })
    .refine((n) => n > 0, { message: "Expense amount must be greater than 0." }),
  client_id: z.string().optional(),
  tool_subscription_id: z.string().optional().nullable().transform((v) => v || null),
  incurred_date: z.string().optional().default(() => new Date().toISOString().split("T")[0]),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type ToolExpenseInput = z.infer<typeof toolExpenseSchema>;
