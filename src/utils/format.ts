/**
 * Text formatting utility functions
 */

/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param text The text to truncate
 * @param maxLength Maximum length (default: 100)
 * @param ellipsis Ellipsis string (default: '...')
 * @returns Truncated text
 */
export const truncateText = (
  text: string,
  maxLength = 100,
  ellipsis = '...'
): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Format a number with commas as thousands separators
 * @param number The number to format
 * @param decimalPlaces Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (
  number: number,
  decimalPlaces = 0
): string => {
  return number.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
});
};

/**
 * Format a price
 * @param price The price to format
 * @param currency Currency code (default: 'USD')
 * @param decimalPlaces Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number,
  currency = 'USD',
  decimalPlaces = 2
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
}).format(price);
};

/**
 * Format a percentage
 * @param value The value to format as percentage
 * @param decimalPlaces Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  decimalPlaces = 0
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
}).format(value / 100);
};

/**
 * Format a file size
 * @param bytes File size in bytes
 * @param decimalPlaces Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export const formatFileSize = (
  bytes: number,
  decimalPlaces = 2
): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimalPlaces)) + ' ' + sizes[i];
};

/**
 * Convert a string to title case
 * @param text The text to convert
 * @returns Title case string
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Convert a string to camel case
 * @param text The text to convert
 * @returns Camel case string
 */
export const toCamelCase = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_match: string, chr: string) => chr.toUpperCase());
};

/**
 * Convert a string to kebab case
 * @param text The text to convert
 * @returns Kebab case string
 */
export const toKebabCase = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

/**
 * Convert a string to snake case
 * @param text The text to convert
 * @returns Snake case string
 */
export const toSnakeCase = (text: string): string => {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};
