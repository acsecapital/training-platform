/**
 * Certificate utility functions
 */

import {v4 as uuidv4} from "uuid";

/**
 * Generate a unique certificate ID
 *
 * @return {string} A unique certificate ID with 'CERT-' prefix followed by a random
 *   alphanumeric string
 */
export const generateCertificateId = (): string => {
  return `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};


/**
 * Generate a verification code for certificates
 *
 * @return {string} A random 8-character verification code using alphanumeric
 *   characters
 */
export const generateVerificationCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
}

  return code;
};


/**
 * Generate a unique ID for a certificate using UUID
 *
 * @return {string} A UUID string
 */
export const generateUniqueId = (): string => {
  return uuidv4();
};

/**
 * Format a date for display on certificates
 *
 * @param {Date} date The date to format
 * @return {string} Formatted date string (e.g., "January 1, 2023")
 */
export const formatCertificateDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
});
};
