export const TIMER_CONFIG = {
    MAGIC_LINK_EXPIRY_TIME: 600, // 10 minutes in seconds
    RESEND_COOLDOWN_TIME: 60, // 1 minute in seconds
} as const;

export const STORAGE_KEYS = {
    MAGIC_LINK_TIMESTAMP: "magicLinkTimestamp",
    RESEND_TIMER: "magicLinkResendTimer",
    INITIAL_REQUEST: "magicLinkInitialRequest",
    PAGE_LOADS: "magicLinkPageLoads",
} as const;