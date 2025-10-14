import { useRef, useState, useEffect, useCallback } from "react";

import { calculateRemainingTime } from "../../utils/helper";
import { storageUtils } from "../../utils/localStorageutils";

/**
 * useTimer is a custom hook that manages a timer based on the given expiry time and storage key.
 * It provides state variables for the timer value and whether it is active.
 * It also provides functions to start the timer, reset the timer, save the timestamp, get the remaining time, and clear the timestamp.
 * The hook also provides an effect that will clear the stored timestamp and the interval when the timer reaches 0.
 * The hook also provides a cleanup function on unmount to clear the interval.
 * @param {number} expiryTime - the time in seconds until the timer expires
 * @param {string} storageKey - the key to store the timestamp in local storage
 * @returns {Object} An object containing the timer state variable, whether it is active, startTimer, resetTimer, saveTimestamp, getRemainingTime, and clearTimestamp functions.
 */
export const useTimer = (expiryTime: number, storageKey: string) => {
    const [timer, setTimer] = useState<number>(0);
    const [isActive, setIsActive] = useState<boolean>(false);
    const intervalRef = useRef<number | null>(null);

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
    }, [storageKey]);

    const startTimer = useCallback((initialTime?: number) => {
        const timeToSet = initialTime ?? getRemainingTime();
        if (timeToSet > 0) {
            setTimer(timeToSet);
            setIsActive(true);
        } else {
            setTimer(0);
            setIsActive(false);
            clearTimestamp();
        }
    }, [getRemainingTime, clearTimestamp]);

    const resetTimer = useCallback((newTime: number) => {
        setIsActive(false);
        setTimeout(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setTimer(newTime);
            setIsActive(true);
        }, 200);
    }, []);

    // Timer countdown effect
    useEffect(() => {
        if (!isActive) {
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
            setTimer((current) => {
                const newTime = current - 1;
                if (newTime <= 0) {
                    setIsActive(false);
                    clearTimestamp();
                    return 0;
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
    }, [isActive, clearTimestamp]);

    // Cleanup on unmount
    useEffect(() => () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }, []);

    return {
        timer,
        isActive,
        startTimer,
        resetTimer,
        saveTimestamp,
        getRemainingTime,
        clearTimestamp,
    };
};

