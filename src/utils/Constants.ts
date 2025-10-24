export const TIMER_CONFIG: Record<string, number> = {
    MAGIC_LINK_EXPIRY_TIME: 600, // 10 minutes in seconds
    SMS_MFA_EXPIRY_TIME: 600, // 10 minutes in seconds
    RESEND_COOLDOWN_TIME: 60, // 1 minute in seconds
} as const;

export const STORAGE_KEYS: Record<string, string> = {
    MAGIC_LINK_TIMESTAMP: "magicLinkTimestamp",
    RESEND_TIMER: "magicLinkResendTimer",
    INITIAL_REQUEST: "magicLinkInitialRequest",
    PAGE_LOADS: "magicLinkPageLoads",
    SMS_MFA_TIMESTAMP: "smsMfaTimestamp",
    SMS_MFA_RESEND_TIMER: "smsMfaResendTimer",
    SMS_MFA_INITIAL_REQUEST: "smsMfaInitialRequest",
    SMS_MFA_PAGE_LOADS: "smsMfaPageLoads",
    SMS_MFA_REGISTER_TIMESTAMP: "smsMfaRegisterTimestamp",
    SMS_MFA_REGISTER_RESEND_TIMER: "smsMfaRegisterResendTimer",
    SMS_MFA_REGISTER_INITIAL_REQUEST: "smsMfaRegisterInitialRequest",
    SMS_MFA_REGISTER_PAGE_LOADS: "smsMfaRegisterPageLoads",
} as const;

export const CODE_LENGTH: number = 6;