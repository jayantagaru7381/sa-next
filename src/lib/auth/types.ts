/**
 * Type definitions for authentication and authorization
 */

export type AuthRequirement = "none" | "temp" | "session";

export type TempTokenPurpose =
  | "2fa_setup"
  | "2fa_auth"
  | "email_verify"
  | "magic_link"
  | "password_reset";

export interface RoutePolicy {
  auth: AuthRequirement;
  purpose?: TempTokenPurpose | TempTokenPurpose[];
  roles?: string[];
  redirectTo?: string;
}
