import { useCallback } from "react";

import { STORAGE_KEYS } from "../../utils/Constants";
import { storageUtils } from "../../utils/localStorageutils";

/**
 * A custom hook for managing local storage state.
 * It provides methods to check if an initial request has been made, mark an initial request as made, clear the initial request flag, get the page load count, increment the page load count, and clear the page load count.
 * @returns An object containing the following methods:
 * - hasInitialRequestBeenMade(): A callback to check if an initial request has been made.
 * - markInitialRequestAsMade(): A callback to mark an initial request as made.
 * - clearInitialRequestFlag(): A callback to clear the initial request flag.
 * - getPageLoadCount(): A callback to get the page load count.
 * - incrementPageLoadCount(): A callback to increment the page load count.
 * - clearPageLoadCount(): A callback to clear the page load count.
 */
export const useLocalStorageState = () => {
    const hasInitialRequestBeenMade = useCallback(() =>
        storageUtils.get(STORAGE_KEYS.INITIAL_REQUEST) === 'true', []);

    const markInitialRequestAsMade = useCallback(() => {
        storageUtils.save(STORAGE_KEYS.INITIAL_REQUEST, 'true');
    }, []);

    const clearInitialRequestFlag = useCallback(() => {
        storageUtils.remove(STORAGE_KEYS.INITIAL_REQUEST);
    }, []);

    const getPageLoadCount = useCallback(() =>
        storageUtils.getNumber(STORAGE_KEYS.PAGE_LOADS), []);

    const incrementPageLoadCount = useCallback(() => {
        const currentCount = getPageLoadCount();
        storageUtils.save(STORAGE_KEYS.PAGE_LOADS, (currentCount + 1).toString());
    }, [getPageLoadCount]);

    const clearPageLoadCount = useCallback(() => {
        storageUtils.remove(STORAGE_KEYS.PAGE_LOADS);
    }, []);

    return {
        hasInitialRequestBeenMade,
        markInitialRequestAsMade,
        clearInitialRequestFlag,
        getPageLoadCount,
        incrementPageLoadCount,
        clearPageLoadCount,
    };
};