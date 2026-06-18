/**
 * @file validators.js
 * @module Validators
 *
 * @description
 * Client-side form validation helper functions for the Rentify application. Provides
 * reusable validation logic for common fields: email, mobile (Sri Lankan format),
 * NIC number (old 9-digit and new 12-digit formats), password strength, and required
 * fields. Returns validation result objects { valid, message } for consistent error
 * display across all form components. These run on the client for UX; server-side
 * validation is still mandatory.
 *
 * @dependencies
 * - None (pure JavaScript utility functions)
 *
 * @exports
 * - validateEmail: Validates email format
 * - validateMobile: Validates Sri Lankan mobile number format
 * - validateNIC: Validates Sri Lankan NIC number format
 * - validatePassword: Validates password strength requirements
 * - validateRequired: Validates that a field is not empty
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

/**
 * Validates an email address format.
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEmail(email) {
  // TODO: Use a robust email regex pattern
  // TODO: Trim whitespace before validation
  // TODO: Return { valid: false, message: 'Email is required' } if empty
  // TODO: Return { valid: false, message: 'Invalid email format' } if malformed
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, message: 'Invalid email format' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates a Sri Lankan mobile number.
 * @param {string} mobile - Mobile number (e.g., "0771234567" or "+94771234567")
 * @returns {{ valid: boolean, message: string }}
 */
export function validateMobile(mobile) {
  // TODO: Accept formats: 07XXXXXXXX (10 digits) or +947XXXXXXXX (12 chars)
  // TODO: Validate that the number starts with valid Sri Lankan prefixes (070-079)
  // TODO: Strip spaces and dashes before validation
  if (!mobile || !mobile.trim()) {
    return { valid: false, message: 'Mobile number is required' };
  }
  const mobileRegex = /^(?:0|(?:\+94))7[0-9]{8}$/;
  if (!mobileRegex.test(mobile.replace(/[\s-]/g, ''))) {
    return { valid: false, message: 'Invalid Sri Lankan mobile number' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates a Sri Lankan NIC number (old 9+V/X or new 12-digit format).
 * @param {string} nic - NIC number to validate
 * @returns {{ valid: boolean, message: string }}
 */
export function validateNIC(nic) {
  // TODO: Old format: 9 digits followed by V or X (e.g., 901234567V)
  // TODO: New format: exactly 12 digits (e.g., 200012345678)
  // TODO: Trim and uppercase before validation
  if (!nic || !nic.trim()) {
    return { valid: false, message: 'NIC number is required' };
  }
  const oldFormat = /^[0-9]{9}[vVxX]$/;
  const newFormat = /^[0-9]{12}$/;
  const trimmed = nic.trim();
  if (!oldFormat.test(trimmed) && !newFormat.test(trimmed)) {
    return { valid: false, message: 'Invalid NIC format. Use 9-digit+V/X or 12-digit format' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates password strength.
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password) {
  // TODO: Minimum 8 characters
  // TODO: At least one uppercase letter, one lowercase letter, one digit
  // TODO: At least one special character (!@#$%^&*)
  // TODO: Return specific messages for each missing requirement
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates that a field value is not empty.
 * @param {string} value - Field value to check
 * @param {string} fieldName - Human-readable field name for error message
 * @returns {{ valid: boolean, message: string }}
 */
export function validateRequired(value, fieldName = 'This field') {
  // TODO: Handle string, number, array, and object types
  // TODO: Trim strings before checking emptiness
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: '' };
}
