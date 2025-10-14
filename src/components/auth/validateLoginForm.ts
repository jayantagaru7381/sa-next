export interface LoginFormData {
  email: string;
  password: string;
  showPasswordField?: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  login?: string;
}

export function validateLoginForm(data: LoginFormData): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Email validation is always required
  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = "Invalid email format.";
  }

  // Password validation only when password field is shown
  if (data.showPasswordField && !data.password.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
}
