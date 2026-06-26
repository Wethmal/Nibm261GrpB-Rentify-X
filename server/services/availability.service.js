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
