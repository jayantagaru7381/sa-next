export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export const getPasswordRequirements = (password: string): PasswordRequirement[] => [
  { label: "At least 12 characters", met: password.length >= 12 },
  { label: "Includes 1 capital letter", met: /[A-Z]/.test(password) },
  { label: "Includes 1 digit", met: /[0-9]/.test(password) },
  {
    label: "Includes 1 special character (e.g., !, @, #)",
    met: /[!@#$%^&*]/.test(password),
  },
];

export const validatePasswordStrength = (password: string): boolean =>
  getPasswordRequirements(password).every((req) => req.met);

export const PASSWORD_STRENGTH_WORDS = [
  "Weak",
  "Needs capital & special character",
  "Also needs a digit",
  "Make sure its 12 Characters",
  "Strong",
];
