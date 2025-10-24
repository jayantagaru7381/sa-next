export { useTimer } from "./useTimer";
export { useResendTimer } from "./useResendTimer";
// Auth route protection hooks
export { useAuthRedirect } from "./useAuthRedirect";

export { useProtectedRoute } from "./useProtectedRoute";
export { useTempTokenRoute } from "./useTempTokenRoute";
// Auth utility hooks
export { useLocalStorageState } from "./useLocalStorageState";

// Types
export type {
    UseTimerReturn,
    MagicLinkResponse,
    UseResendTimerReturn,
    UseLocalStorageStateReturn,
} from "./types";
