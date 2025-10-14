// Local storage utilities
export const storageUtils = {
    save: (key: string, value: string) => localStorage.setItem(key, value),
    get: (key: string) => localStorage.getItem(key),
    remove: (key: string) => localStorage.removeItem(key),
    getNumber: (key: string, defaultValue = 0) => {
        const value = localStorage.getItem(key);
        return value ? parseInt(value, 10) : defaultValue;
    },
};