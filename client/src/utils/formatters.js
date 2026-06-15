/**
 * @file formatters.js
 * @module Formatters
 *
 * @description
 * Client-side formatting utility functions for the Rentify application. Provides
 * consistent formatting for dates, currency (LKR), durations, and phone numbers
 * across all UI components. These functions are pure and stateless — they transform
 * input values into display-ready strings. All components should use these formatters
 * instead of inline formatting to maintain consistency.
 *
 * @dependencies
 * - None (pure JavaScript utility functions)
 *
 * @exports
 * - formatCurrency: Formats a number as Sri Lankan Rupees (LKR)
 * - formatDate: Formats a date string/object into a readable format
 * - formatDuration: Converts hours into a human-readable duration string
 * - formatPhoneNumber: Formats a Sri Lankan mobile number for display
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

/**
 * Formats a numeric value as Sri Lankan Rupees (LKR).
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "LKR 5,000.00")
 */
export function formatCurrency(amount) {
  // TODO: Use Intl.NumberFormat with 'si-LK' locale and 'LKR' currency
  // TODO: Handle null/undefined/NaN gracefully, returning 'LKR 0.00'
  // TODO: Consider adding options for decimal precision (0 or 2 places)
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'LKR 0.00';
  }
  return `LKR ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a date value into a human-readable string.
 * @param {string|Date} dateValue - ISO string or Date object
 * @param {object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date string (e.g., "15 Jun 2026")
 */
export function formatDate(dateValue, options = {}) {
  // TODO: Parse the date string/object safely, handle invalid dates
  // TODO: Use Intl.DateTimeFormat with sensible defaults for Sri Lankan locale
  // TODO: Support options for showing time, relative dates ("2 hours ago"), etc.
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Converts a duration in hours to a human-readable string.
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export function formatDuration(hours) {
  // TODO: Handle fractional hours (e.g., 1.5 → "1h 30m")
  // TODO: Handle edge cases: 0 hours, negative values, null/undefined
  // TODO: For durations >= 24h, consider showing days
  if (!hours || hours <= 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Formats a Sri Lankan phone number for display.
 * @param {string} phone - Phone number string (e.g., "0771234567" or "+94771234567")
 * @returns {string} Formatted phone number (e.g., "+94 77 123 4567")
 */
export function formatPhoneNumber(phone) {
  // TODO: Normalize to +94 format if local format (07x) is provided
  // TODO: Insert spaces for readability: +94 XX XXX XXXX
  // TODO: Handle invalid/empty phone numbers gracefully
  if (!phone) return '';
  return phone;
}
