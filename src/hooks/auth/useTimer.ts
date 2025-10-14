// hooks/auth/useTimer.ts
import { useRef, useState, useEffect, useCallback } from "react";

import { calculateRemainingTime } from "../../utils/helper";
import { storageUtils } from "../../utils/localStorageutils";

export const useTimer = (expiryTime: number, storageKey: string) => {
    const [timer, setTimer] = useState<number>(0);
    const intervalRef = useRef<number | null>(null);

    // Always clear interval safely
    const clearTimerInterval = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const saveTimestamp = useCallback(() => {
        storageUtils.save(storageKey, Date.now().toString());
    }, [storageKey]);

    const getRemainingTime = useCallback(() => {
        const storedTimestamp = storageUtils.get(storageKey);
        if (!storedTimestamp) return 0;
        return calculateRemainingTime(storedTimestamp, expiryTime);
    }, [storageKey, expiryTime]);

    const clearTimestamp = useCallback(() => {
        storageUtils.remove(storageKey);
        setTimer(0);
    }, [storageKey]);

    const startTimer = useCallback((initialTime?: number) => {
        // Clear any existing interval FIRST
        clearTimerInterval();

        const timeToSet = initialTime ?? getRemainingTime();
        if (timeToSet > 0) {
            setTimer(timeToSet);
            // Start fresh interval
            intervalRef.current = window.setInterval(() => {
                setTimer((prev) => {
                    const newTime = prev - 1;
                    if (newTime <= 0) {
                        clearTimerInterval();
                        clearTimestamp();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            clearTimestamp();
        }
    }, [getRemainingTime, clearTimestamp, clearTimerInterval]);

    // Cleanup on unmount
    useEffect(() => () => clearTimerInterval(), [clearTimerInterval]);

    return {
        timer,
        startTimer,
        saveTimestamp,
        getRemainingTime,
        clearTimestamp,
        // Remove `resetTimer` — it's error-prone; use `startTimer(newTime)` instead
    };
};