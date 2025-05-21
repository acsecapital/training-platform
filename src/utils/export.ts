/**
 * Export utility functions
 */

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Filename for the exported file
 */
export const exportToCsv = <T extends Record<string, unknown>>(data: T[], filename: string): void => {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
}

  try {
    // Convert data to CSV format
    const csvContent = convertToCSV(data);

    // Create a blob and download link
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    // Append to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
} catch (error) {
    console.error('Error exporting to CSV:', error);
}
};

/**
 * Convert data to CSV format
 * @param data Array of objects to convert
 * @returns CSV string
 */
const convertToCSV = <T extends Record<string, unknown>>(data: T[]): string => {
  if (data.length === 0) return '';

  // Get headers from the first item
  const firstItem = data[0];
  const headers = Object.keys(firstItem);

  // Create CSV rows
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header as keyof T];
      const valueStr = value === null || value === undefined ? '' : String(value);

      // Escape quotes and wrap in quotes
      return `"${valueStr.replace(/"/g, '""')}"`;
  });

    csvRows.push(values.join(','));
}

  return csvRows.join('\n');
};

/**
 * Export data to Excel file
 * @param data Array of objects to export
 * @param filename Filename for the exported file
 * @param sheetName Sheet name (default: 'Sheet1')
 */
export const exportToExcel = <T extends Record<string, unknown>>(data: T[], filename: string, sheetName = 'Sheet1'): void => {
  // This is a placeholder for Excel export functionality
  // In a real implementation, you would use a library like xlsx or exceljs
  console.log(`Exporting ${data.length} rows to Excel file: ${filename}, Sheet: ${sheetName}`);

  // For now, fall back to CSV export
  exportToCsv(data, filename.replace(/\.xlsx$/, '.csv'));
};

/**
 * Export data to PDF file
 * @param data Array of objects to export
 * @param filename Filename for the exported file
 * @param title Document title
 */
export const exportToPdf = <T extends Record<string, unknown>>(data: T[], filename: string, title = 'Export'): void => {
  // This is a placeholder for PDF export functionality
  // In a real implementation, you would use a library like jspdf or pdfmake
  console.log(`Exporting ${data.length} rows to PDF file: ${filename}, Title: ${title}`);

  // For now, fall back to CSV export
  exportToCsv(data, filename.replace(/\.pdf$/, '.csv'));
};
