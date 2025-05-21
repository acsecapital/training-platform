import {createHmac} from "crypto";

/**
 * Secret key for signing certificates
 * In a production environment, this should be stored securely in environment
 * variables
 */
const SECRET_KEY = process.env.CERTIFICATE_SIGNATURE_SECRET ||
  "certificate-signature-secret-key";

/**
 * Generate a digital signature for a certificate
 * @param {Record<string, unknown>} data The data to sign
 * @return {string} The digital signature
 */
export const generateSignature = (data: Record<string, unknown>): string => {
  // Create a deterministic string representation of the data
  const sortedData = sortObjectKeys(data);
  const dataString = JSON.stringify(sortedData);

  // Generate HMAC signature using SHA-256
  return createHmac("sha256", SECRET_KEY)
    .update(dataString)
    .digest("hex");
};

/**
 * Verify a digital signature for a certificate
 * @param {Record<string, unknown>} data The data that was signed
 * @param {string} signature The signature to verify
 * @return {boolean} Whether the signature is valid
 */
export const verifySignature = (
  data: Record<string, unknown>,
  signature: string
): boolean => {
  // Generate a new signature from the data
  const expectedSignature = generateSignature(data);

  // Compare the signatures
  return expectedSignature === signature;
};

/**
 * Sort object keys recursively to ensure deterministic JSON stringification
 * @param {unknown} obj The object to sort
 * @return {unknown} A new object with sorted keys
 */
const sortObjectKeys = (obj: unknown): unknown => {
  // If not an object or null, return as is
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
}

  // Get all keys and sort them
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();

  // Create a new object with sorted keys
  const sortedObj: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
}

  return sortedObj;
};
