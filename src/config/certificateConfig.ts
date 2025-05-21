/**
 * Default certificate configuration
 * 
 * This file contains default settings for certificate generation
 */

/**
 * Default certificate colors
 */
export const DEFAULT_CERTIFICATE_COLORS = {
  primary: '#0e0e4f', // Dark blue
  secondary: '#8a0200', // Dark red
  text: '#3c3c3c', // Dark gray
  background: '#f0f0ff' // Light blue
};

/**
 * Default certificate fonts
 */
export const DEFAULT_CERTIFICATE_FONTS = [
  'Helvetica',
  'Arial',
  'sans-serif'
];

/**
 * Default certificate dimensions (A4 landscape)
 */
export const DEFAULT_CERTIFICATE_DIMENSIONS = {
  width: 297,
  height: 210,
  unit: 'mm'
};

/**
 * Default certificate placeholders
 */
export const DEFAULT_CERTIFICATE_PLACEHOLDERS = [
  'studentName',
  'courseName',
  'completionDate',
  'certificateId',
  'issueDate',
  'verificationCode',
  'verificationUrl',
  'issuerName',
  'issuerTitle'
];
