// Utility functions
export const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

export const calculateRemainingTime = (storedTimestamp: string, expiryTime: number): number => {
    const timestamp = parseInt(storedTimestamp, 10);
    const now = Date.now();
    const elapsed = Math.floor((now - timestamp) / 1000);
    const remaining = expiryTime - elapsed;
    return Math.max(0, remaining);
};