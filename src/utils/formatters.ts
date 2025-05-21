/**
 * Format a duration in seconds to a human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m" or "45m" or "30s")
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) {
    return '0s';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  if (remainingSeconds > 0 && hours === 0) {
    result += `${remainingSeconds}s`;
  }
  
  return result.trim();
};

/**
 * Format a date string to a human-readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Jan 1, 2023")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) {
    return '';
  }
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a number as a percentage
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted percentage string (e.g., "75.5%")
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (value === undefined || value === null) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$99.99")
 */
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  if (value === undefined || value === null) {
    return '';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
}).format(value);
};

/**
 * Format a number with commas
 * @param value Number to format
 * @returns Formatted number string (e.g., "1,234,567")
 */
export const formatNumber = (value: number): string => {
  if (value === undefined || value === null) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Truncate a string to a maximum length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @param suffix Suffix to add when truncated (default: '...')
 * @returns Truncated string
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (!text) {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
}
  
  return `${text.substring(0, maxLength)}${suffix}`;
};
