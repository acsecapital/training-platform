/**
 * Utility functions for exporting data to CSV and other formats
 */

// Define a type for Firebase Timestamp-like objects
interface TimestampLike {
  toDate: () => Date;
}

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV string
 */
export const convertToCSV = <T extends Record<string, unknown>>(
  data: T[],
  headers?: {key: keyof T; label: string }[]
): string => {
  if (!data || !data.length) {
    return '';
}

  // If headers not provided, use object keys from the first non-null item
  const firstValidItem = data.find(item => item !== null && item !== undefined);
  if (!firstValidItem) {
    return '';
}

  // If headers not provided, use object keys
  const headerKeys = headers ? headers.map(h => h.key) : Object.keys(firstValidItem) as (keyof T)[];
  const headerLabels = headers ? headers.map(h => h.label) : headerKeys as string[];

  // Create CSV header row
  const headerRow = headerLabels.map(label => `"${String(label).replace(/"/g, '""')}"`).join(',');

  // Create CSV data rows
  const rows = data.map(item => {
    if (!item) return headerKeys.map(() => '""').join(',');

    return headerKeys
      .map(key => {
        const value = item[key];

        // Handle different value types
        if (value === null || value === undefined) {
          return '""';
      } else if (typeof value === 'object') {
          // Handle Date objects
          if (value instanceof Date) {
            return `"${value.toISOString()}"`;
          }
          // Handle objects with toISOString method
          else if (value && 'toISOString' in value && typeof (value as { toISOString: () => string }).toISOString === 'function') {
            return `"${(value as { toISOString: () => string }).toISOString()}"`;
          } else {
            try {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            } catch {
              return '""';
            }
          }
      } else {
          return `"${String(value).replace(/"/g, '""')}"`;
      }
    })
      .join(',');
});

  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Download data as a CSV file
 * @param data Array of objects to convert to CSV
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 */
export const downloadCSV = <T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: {key: keyof T; label: string }[]
): void => {
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format a date for CSV export
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDateForExport = (date: Date | string | null | undefined): string => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
    return '';
}

  return dateObj.toISOString().split('T')[0];
};

/**
 * Format a timestamp for CSV export
 * @param timestamp Timestamp to format (Firebase Timestamp, Date, or string)
 * @returns Formatted timestamp string
 */
export const formatTimestampForExport = (
  timestamp: TimestampLike | Date | string | null | undefined
): string => {
  if (!timestamp) return '';

  try {
    // Handle Firebase Timestamp objects
    if (
      typeof timestamp === 'object' &&
      'toDate' in timestamp &&
      typeof timestamp.toDate === 'function'
    ) {
      const date = timestamp.toDate();
      return date.toISOString();
    }

    // Handle Date objects
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }

    // Handle string dates
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toISOString();
    }

    return '';
  } catch {
    return '';
  }
}
