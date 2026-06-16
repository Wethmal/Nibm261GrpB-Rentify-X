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
