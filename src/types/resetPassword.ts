import { z } from "zod";

const weakPatterns = [
  /(.)\1{4,}/, // 5 or more repeated characters
  /(01234|12345|23456|34567|45678|56789)/, // Sequential digits
  /(abcde|bcdef|cdefg|defgh|efghi|fghij|ghijk|hijkl|ijklm|jklmn|klmno|lmnop|mnopq|nopqr|opqrs|pqrst|qrstu|rstuv|stuvw|tuvwx|uvwxy|vwxyz)/, // Sequential letters
  /(qwerty|asdfgh|zxcvbn|qwertyui|asdfghjk)/, // Keyboard patterns
];
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[A-Z]/, "Password must include at least 1 capital letter")
      .regex(/[0-9]/, "Password must include at least 1 digit")
      .regex(/^[^\s]+$/, "Password must not contain spaces")
      .regex(/[!@#$%^&*]/, "Password must include at least 1 special character (e.g., !, @, #)")
      .refine((val) => !weakPatterns.some((pattern) => pattern.test(val.toLowerCase())), {
        message: "Password is too weak or contains common patterns",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
