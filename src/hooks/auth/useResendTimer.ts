import { useRef, useState, useEffect, useCallback } from "react";

import { calculateRemainingTime } from "../../utils/helper";
import { storageUtils } from "../../utils/localStorageutils";
import { STORAGE_KEYS, TIMER_CONFIG } from "../../utils/Constants";

/**
 * useResendTimer is a custom hook that manages a timer for resend
 * functionality. It provides a state variable "resendTimer" that
 * represents the remaining time in seconds until the resend
 * button is available. It also provides functions to start, stop
 * and set the value of the resend timer.
 *
 * The hook uses the local storage to store the timestamp of when
 * the resend timer was last started. It uses the
 * calculateRemainingTime function from the helper module to
 * calculate the remaining time based on the stored timestamp
 * and the RESEND_COOLDOWN_TIME constant from the Constants module.
 *
 * The hook also provides an effect that will clear the stored
 * timestamp and the interval when the resend timer reaches 0.
 *
 * @returns {Object} An object containing the resendTimer state
 * variable and the startResendTimer, stopResendTimer and
 * setResendTimerValue functions. The object also contains the
 * getRemainingResendTime function that returns the remaining time
 * in seconds until the resend button is available.
 */
export const useResendTimer = () => {
    const [resendTimer, setResendTimer] = useState<number>(0);
    const intervalRef = useRef<number | null>(null);

    const saveResendTimestamp = useCallback(() => {
        storageUtils.save(STORAGE_KEYS.RESEND_TIMER, Date.now().toString());
    }, []);

    const getRemainingResendTime = useCallback(() => {
        const storedTimestamp = storageUtils.get(STORAGE_KEYS.RESEND_TIMER);
        if (!storedTimestamp) return 0;
        return calculateRemainingTime(storedTimestamp, TIMER_CONFIG.RESEND_COOLDOWN_TIME);
    }, []);

    const clearResendTimestamp = useCallback(() => {
        storageUtils.remove(STORAGE_KEYS.RESEND_TIMER);
    }, []);

    const startResendTimer = useCallback(() => {
        setResendTimer(TIMER_CONFIG.RESEND_COOLDOWN_TIME);
        saveResendTimestamp();
    }, [saveResendTimestamp]);

    const stopResendTimer = useCallback(() => {
        setResendTimer(0);
        clearResendTimestamp();
    }, [clearResendTimestamp]);

    const setResendTimerValue = useCallback((value: number) => {
        setResendTimer(value);
    }, []);

    // Resend timer countdown effect
    useEffect(() => {
        if (resendTimer <= 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return undefined;
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        intervalRef.current = window.setInterval(() => {
            setResendTimer((t) => {
                const newTime = t - 1;
                if (newTime <= 0) {
                    clearResendTimestamp();
                }
                return newTime;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [resendTimer, clearResendTimestamp]);

    // Cleanup on unmount
    useEffect(() => () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }, []);

    return {
        resendTimer,
        startResendTimer,
        stopResendTimer,
        setResendTimerValue,
        getRemainingResendTime,
    };
};