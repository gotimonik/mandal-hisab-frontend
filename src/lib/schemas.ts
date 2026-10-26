import { z } from "zod";

/** Rupee amount typed by a user: up to 2 decimals, > 0. Sent to the API as a string (exact). */
export const rupees = z
  .string()
  .trim()
  .transform((v) => v.replace(/[,₹\s]/g, ""))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter a valid amount (max 2 decimals)")
  .refine((v) => Number(v) > 0, "Amount must be greater than zero");

export const rupeesOrZero = z
  .string()
  .trim()
  .transform((v) => v.replace(/[,₹\s]/g, "") || "0")
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter a valid amount (max 2 decimals)");

export const optionalRupees = z
  .string()
  .trim()
  .transform((v) => v.replace(/[,₹\s]/g, ""))
  .refine((v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v), "Enter a valid amount (max 2 decimals)");
