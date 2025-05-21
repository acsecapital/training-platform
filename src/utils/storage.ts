/**
 * Local storage utility functions
 */

interface StorageItem<T> {
  value: T;
  expiry: number | null;
}

/**
 * Set an item in local storage with optional expiration
 * @param {string} key The storage key
 * @param {unknown} value The value to store
 * @param {number} [expirationMinutes] Optional expiration time in minutes
 * @return {void} Nothing
 */
export const setStorageItem = (
  key: string,
  value: unknown,
  expirationMinutes?: number
): void => {
  try {
    const item: StorageItem<unknown> = {
      value,
      expiry: expirationMinutes ?
        new Date().getTime() + expirationMinutes * 60 * 1000 :
        null,
  };
    localStorage.setItem(key, JSON.stringify(item));
} catch (error) {
    console.error(`Error setting localStorage item "${key}":`, error);
}
};

/**
 * Get an item from local storage
 * @param {string} key The storage key
 * @param {T} defaultValue Default value if the item doesn't exist or has
 *   expired
 * @return {T} The stored value or the default value
 * @template T
 */
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const itemStr = localStorage.getItem(key);

    // Return default value if the item doesn't exist
    if (!itemStr) {
      return defaultValue;
  }

    const item: StorageItem<T> = JSON.parse(itemStr) as StorageItem<T>;

    // Check if the item has expired
    if (item.expiry && new Date().getTime() > item.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
  }
    return item.value; // Ensure the returned type matches T
} catch (error) {
    console.error(`Error getting localStorage item "${key}":`, error);
    return defaultValue;
}
};

/**
 * Remove an item from local storage
 * @param {string} key The storage key
 * @return {void} Nothing
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
} catch (error) {
    console.error(`Error removing localStorage item "${key}":`, error);
}
};

/**
 * Clear all items from local storage
 * @return {void} Nothing
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
} catch (error) {
    console.error("Error clearing localStorage:", error);
}
};

/**
 * Get all keys from local storage
 * @return {string[]} Array of storage keys
 */
export const getStorageKeys = (): string[] => {
  try {
    return Object.keys(localStorage);
} catch (error) {
    console.error("Error getting localStorage keys:", error);
    return [];
}
};

/**
 * Check if local storage is available
 * @return {boolean} Boolean indicating if local storage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
} catch (_) { // Using underscore to indicate we don't need the error object
    return false;
}
};

/**
 * Get the total size of data in local storage
 * @return {number} Size in bytes
 */
export const getStorageSize = (): number => {
  try {
    let totalSize = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          // UTF-16 uses 2 bytes per character
          totalSize += (value.length + key.length) * 2;
        }
    }
  }
    return totalSize;
} catch (error) {
    console.error("Error calculating localStorage size:", error);
    return 0;
}
};
