/**
 * Form validation utility functions
 */

/**
 * Validate an email address
 * @param {string} email The email to validate
 * @return {boolean} Boolean indicating if the email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate a password
 * @param {string} password The password to validate
 * @param {Object} options Validation options
 * @return {{isValid: boolean, message: string}} Object with validation result
 *   and error message
 */
export const validatePassword = (
  password: string,
  options = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
}
): {isValid: boolean; message: string } => {
  if (!password) {
    return {isValid: false, message: "Password is required"};
}
  if (password.length < options.minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${options.minLength} characters long`,
  };
}

  if (options.requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
  };
}

  if (options.requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
  };
}

  if (options.requireNumbers && !/\d/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
  };
}

  if (options.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one special character",
    };
  }

  return {isValid: true, message: "Password is valid"};
};

/**
 * Validate a URL
 * @param {string} url The URL to validate
 * @return {boolean} Boolean indicating if the URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
} catch (_) { // Using underscore to indicate we don't need the error object
    return false;
}
};

/**
 * Validate a phone number
 * @param {string} phoneNumber The phone number to validate
 * @return {boolean} Boolean indicating if the phone number is valid
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // This is a simple validation for demonstration purposes
  // In a real application, you might want to use a library like libphonenumber-js
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  const sanitizedNumber = phoneNumber.replace(/\s+/g, "");
  return phoneRegex.test(sanitizedNumber);
};

/**
 * Validate a credit card number using the Luhn algorithm
 * @param {string} cardNumber The credit card number to validate
 * @return {boolean} Boolean indicating if the credit card number is valid
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  // Remove spaces and dashes
  const sanitizedNumber = cardNumber.replace(/[\s-]/g, "");

  // Check if the number contains only digits
  if (!/^\d+$/.test(sanitizedNumber)) {
    return false;
    }

  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitizedNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitizedNumber.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/**
 * Check if a string is empty or contains only whitespace
 * @param {string} value The string to check
 * @return {boolean} Boolean indicating if the string is empty or whitespace
 */
export const isEmptyOrWhitespace = (value: string): boolean => {
  return value === null || value === undefined || value.trim() === "";
};

/**
 * Validate a form field
 * @param {string} value The field value
 * @param {Array<Object>} validations Array of validation functions
 * @param {Function} validations[].validator Function that validates the value
 * @param {string} validations[].message Error message if validation fails
 * @return {{isValid: boolean, message: string}} Object with validation result
 *   and error message
 */
export const validateField = (
  value: string,
  validations: Array<{
    validator: (value: string) => boolean;
    message: string;
}>
): {isValid: boolean; message: string} => {
  for (const validation of validations) {
    if (!validation.validator(value)) {
      return {isValid: false, message: validation.message};
    }
  }

  return {isValid: true, message: ""};
};
