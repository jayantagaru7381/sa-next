export interface LoginFormData {
    email: string;
    password: string;
}

export interface LoginFormProps {
    showPasswordField: boolean;
    setShowPasswordField: (show: boolean) => void;
    successMessage?: string;
}

export type LoginRequest = {
    username: string;
    password: string;
};

export type LoginResponse = {
    detail: string | undefined;
    result:
    | "success"
    | "failure"
    | "mfa_setup_required"
    | "mfa_auth_required"
    | "email_verification_required";
    message?: string;
    temp_token?: string | null;
    session_token?: string | null;
    redirect_url?: string | null;
    user_id?: number;
    details?: {
        enrolled_methods?: string[];
    };
};
// New types for Magic Link
export interface MagicLinkResponse {
    ok: boolean;
    detail?: string;
}
export interface MagicLinkExpiryProps {
    email?: string | null;
}