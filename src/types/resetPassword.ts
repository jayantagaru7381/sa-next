import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[A-Z]/, "Password must include at least 1 capital letter")
      .regex(/[0-9]/, "Password must include at least 1 digit")
      .regex(/^[^\s]+$/, "Password must not contain spaces")
      .regex(/[!@#$%^&*]/, "Password must include at least 1 special character (e.g., !, @, #)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
