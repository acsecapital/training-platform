/**
 * Date utility functions
 */

/**
 * Format a date to a human-readable string
 * @param {Date|string} date Date object or ISO string
 * @param {string} format Format options: 'full', 'long', 'medium', 'short', or
 *   'relative'
 * @return {string} Formatted date string
 */
export const formatDate = (
  date: Date | string,
  format: "full" | "long" | "medium" | "short" | "relative" = "medium"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
}

  // For relative format, calculate time difference
  if (format === "relative") {
    return getRelativeTimeString(dateObj);
}
  // Format options for different formats
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    full: {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
  },
    long: {
      year: "numeric",
      month: "long",
      day: "numeric",
  },
    medium: {
      year: "numeric",
      month: "short",
      day: "numeric",
  },
    short: {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
  },
};

  return new Intl.DateTimeFormat("en-US", formatOptions[format]).format(dateObj);
};

/**
 * Get a relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {Date} date Date object to compare with current time
 * @return {string} Relative time string
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 5) {
    return "just now";
} else if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
} else if (diffInMinutes === 1) {
    return "1 minute ago";
} else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
} else if (diffInHours === 1) {
    return "1 hour ago";
} else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
} else if (diffInDays === 1) {
    return "yesterday";
} else if (diffInDays < 30) {
    return `${diffInDays} days ago`;
} else if (diffInMonths === 1) {
    return "1 month ago";
} else if (diffInMonths < 12) {
    return `${diffInMonths} months ago`;
} else if (diffInYears === 1) {
    return "1 year ago";
} else {
    return `${diffInYears} years ago`;
}
};

/**
 * Format a duration in seconds to a human-readable string
 * @param {number} durationInSeconds Duration in seconds
 * @param {string} format Format options: 'long', 'short', or 'compact'
 * @return {string} Formatted duration string
 */
export const formatDuration = (
  durationInSeconds: number,
  format: "long" | "short" | "compact" = "long"
): string => {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);

  if (format === "compact") {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
      return `${minutes}m`;
  } else {
      return `${seconds}s`;
  }
} else if (format === "short") {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(" ");
} else {
    const parts = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
    return parts.join(", ");
}
};

/**
 * Check if a date is today
 * @param {Date|string} date Date object or ISO string
 * @return {boolean} Boolean indicating if the date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past
 * @param {Date|string} date Date object or ISO string
 * @return {boolean} Boolean indicating if the date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  return dateObj.getTime() < now.getTime();
};

/**
 * Check if a date is in the future
 * @param {Date|string} date Date object or ISO string
 * @return {boolean} Boolean indicating if the date is in the future
 */
export const isFuture = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  return dateObj.getTime() > now.getTime();
};
