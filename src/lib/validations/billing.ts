import { z } from "zod";
import { currencyAmountSchema } from "./common";

export const createToolSubscriptionSchema = z.object({
  tool_name: z.string().trim().min(1, "Tool name is required."),
  cost_amount: currencyAmountSchema,
  currency: z.string().trim().default("USD"),
  billing_cycle: z.enum(["monthly", "annual", "credits"]).default("monthly"),
  next_renewal_date: z.string().min(1, "Next renewal date is required."),
  default_pass_through: z
    .union([z.string(), z.boolean()])
    .transform((val) => val === true || val === "true"),
});

export const updateInvoiceStatusSchema = z.object({
  invoice_id: z.string().min(1, "Invoice ID is required."),
  status: z.enum(["draft", "approved", "sent", "paid", "overdue", "cancelled"]),
});

export const recordPaymentSchema = z.object({
  invoice_id: z.string().min(1, "Invoice ID is required."),
  payment_method: z
    .string()
    .trim()
    .min(1, "Payment method is required (e.g. Bank Transfer, UPI, Card)."),
  payment_reference: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => v || null),
  payment_date: z
    .string()
    .optional()
    .default(() => new Date().toISOString().split("T")[0]),
});

export type CreateToolSubscriptionInput = z.infer<typeof createToolSubscriptionSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
