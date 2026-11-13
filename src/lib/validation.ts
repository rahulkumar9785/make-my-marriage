import { z } from "zod";

export const emailSchema = z
  .email("Enter a valid email address.")
  .max(254)
  .transform((value) => value.toLowerCase());
const emailInput = z.string().trim().pipe(emailSchema);
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Use no more than 72 bytes (some characters use more than one).",
  );
export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(100),
    email: emailInput,
    password: passwordSchema,
  })
  .strict();
export const loginSchema = z
  .object({ email: emailInput, password: z.string().min(1).max(256) })
  .strict();
export const forgotSchema = z.object({ email: emailInput }).strict();
export const tokenSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "This reset link is invalid.");
export const resetSchema = z
  .object({ token: tokenSchema, password: passwordSchema })
  .strict();
export const weddingSchema = z
  .object({
    brideName: z.string().trim().min(1, "Enter the bride’s name.").max(100),
    groomName: z.string().trim().min(1, "Enter the groom’s name.").max(100),
    title: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().max(2000).optional(),
    weddingDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return (
          Number.isFinite(date.getTime()) &&
          date.toISOString().slice(0, 10) === value &&
          value >= "1900-01-01"
        );
      }, "Choose a real calendar date."),
    timeZone: z
      .string()
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Choose a valid timezone."),
    location: z
      .object({
        formattedAddress: z
          .string()
          .trim()
          .min(1, "Enter your wedding location.")
          .max(300),
      })
      .strict(),
  })
  .strict();
