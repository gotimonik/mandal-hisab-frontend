import { z } from "zod";

export const email = z.string().trim().toLowerCase().email("Enter a valid email");
export const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(128)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use letters and numbers");

export const LoginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });
export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    email,
    phone: z
      .string()
      .trim()
      .regex(/^[+0-9 ()-]{7,20}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    password,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
