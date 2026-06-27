/**
 * @file availability.service.js
 * @module AvailabilityService
 * @description Logic for listing availability checks and scanning.
 */
const { query } = require('../config/db');

/**
 * Checks if a specific date, time, and duration is available for booking.
 * 
 * @param {string} listingId - UUID of the listing
 * @param {string} date - 'YYYY-MM-DD'
 * @param {string} time - 'HH:MM'
 * @param {number} durationHours - Decimal duration in hours
 * @returns {Promise<{ isAvailable: boolean, nextAvailableDate?: string }>}
 */
const checkAvailability = async (listingId, date, time, durationHours) => {
  // Fetch listing details to know type
  const listingRes = await query('SELECT * FROM listings WHERE id = $1', [listingId]);
  if (listingRes.rowCount === 0) {
    return { isAvailable: false };
  }
  const listing = listingRes.rows[0];

