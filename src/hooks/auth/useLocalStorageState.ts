import { useCallback } from "react";

import { STORAGE_KEYS } from "../../utils/Constants";
import { storageUtils } from "../../utils/localStorageutils";

/**
 * A custom hook for managing local storage state.
 * It provides methods to check if an initial request has been made, mark an initial request as made, clear the initial request flag, get the page load count, increment the page load count, and clear the page load count.
 * @param initialRequestKey - The storage key for initial request flag (defaults to MAGIC_LINK)
 * @param pageLoadsKey - The storage key for page loads count (defaults to MAGIC_LINK)
 * @returns An object containing the following methods:
 * - hasInitialRequestBeenMade(): A callback to check if an initial request has been made.
 * - markInitialRequestAsMade(): A callback to mark an initial request as made.
 * - clearInitialRequestFlag(): A callback to clear the initial request flag.
 * - getPageLoadCount(): A callback to get the page load count.
 * - incrementPageLoadCount(): A callback to increment the page load count.
 * - clearPageLoadCount(): A callback to clear the page load count.
 */
export const useLocalStorageState = (
    initialRequestKey: string = STORAGE_KEYS.INITIAL_REQUEST,
    pageLoadsKey: string = STORAGE_KEYS.PAGE_LOADS
) => {
    const hasInitialRequestBeenMade = useCallback(() =>
        storageUtils.get(initialRequestKey) === 'true', [initialRequestKey]);

    const markInitialRequestAsMade = useCallback(() => {
        storageUtils.save(initialRequestKey, 'true');
    }, [initialRequestKey]);

    const clearInitialRequestFlag = useCallback(() => {
        storageUtils.remove(initialRequestKey);
    }, [initialRequestKey]);

    const getPageLoadCount = useCallback(() =>
        storageUtils.getNumber(pageLoadsKey), [pageLoadsKey]);

    const incrementPageLoadCount = useCallback(() => {
        const currentCount = getPageLoadCount();
        storageUtils.save(pageLoadsKey, (currentCount + 1).toString());
    }, [getPageLoadCount, pageLoadsKey]);

    const clearPageLoadCount = useCallback(() => {
        storageUtils.remove(pageLoadsKey);
    }, [pageLoadsKey]);

    return {
        hasInitialRequestBeenMade,
        markInitialRequestAsMade,
        clearInitialRequestFlag,
        getPageLoadCount,
        incrementPageLoadCount,
        clearPageLoadCount,
    };
};