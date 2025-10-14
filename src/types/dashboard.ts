export type UserProfile = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
    is_active: boolean;
    last_login: string | null;
};