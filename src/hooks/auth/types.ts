// Timer hook types
export interface UseTimerReturn {
    timer: number;
    isActive: boolean;
    startTimer: (initialTime?: number) => void;
    resetTimer: (newTime: number) => void;
    saveTimestamp: () => void;
    getRemainingTime: () => number;
    clearTimestamp: () => void;
}

// Resend timer hook types
export interface UseResendTimerReturn {
    resendTimer: number;
    startResendTimer: () => void;
    stopResendTimer: () => void;
    setResendTimerValue: (value: number) => void;
    getRemainingResendTime: () => number;
}

// Local storage state hook types
export interface UseLocalStorageStateReturn {
    hasInitialRequestBeenMade: () => boolean;
    markInitialRequestAsMade: () => void;
    clearInitialRequestFlag: () => void;
    getPageLoadCount: () => number;
    incrementPageLoadCount: () => void;
    clearPageLoadCount: () => void;
}

// API response types
export interface MagicLinkResponse {
    ok: boolean;
    detail?: string;
}
