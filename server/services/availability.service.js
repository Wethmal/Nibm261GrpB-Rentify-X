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

  // 1. If equipment, check listing_availability table
  if (listing.type === 'equipment') {
    const availRes = await query(
      'SELECT is_available FROM listing_availability WHERE listing_id = $1 AND date = $2',
      [listingId, date]
    );
    if (availRes.rowCount > 0 && availRes.rows[0].is_available === false) {
      const nextDate = await findNextAvailableDate(listing, date, time, durationHours);
      return { isAvailable: false, nextAvailableDate: nextDate };
    }
  }

  // 2. Check bookings table for confirmed booking overlaps
  const conflictSql = `
    SELECT 1 FROM bookings
    WHERE (service_listing_id = $1 OR equipment_listing_id = $1)
      AND status = 'confirmed'
      AND scheduled_date = $2
      AND (
        (scheduled_time, scheduled_time + (duration_hours || ' hours')::INTERVAL)
        OVERLAPS
        ($3::TIME, $3::TIME + ($4 || ' hours')::INTERVAL)
      )
  `;
  const bookingsRes = await query(conflictSql, [listingId, date, time, durationHours]);
  if (bookingsRes.rowCount > 0) {
    const nextDate = await findNextAvailableDate(listing, date, time, durationHours);
    return { isAvailable: false, nextAvailableDate: nextDate };
  }

  return { isAvailable: true };
};

/**
 * Helper to scan forward for the next available date.
 */
const findNextAvailableDate = async (listing, startDate, time, durationHours) => {
  let currentDate = new Date(startDate);
  let attempts = 0;
  
  while (attempts < 30) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check listing_availability if equipment
    let isBlocked = false;
    if (listing.type === 'equipment') {
      const availRes = await query(
        'SELECT is_available FROM listing_availability WHERE listing_id = $1 AND date = $2',
        [listing.id, dateStr]
      );
      if (availRes.rowCount > 0 && availRes.rows[0].is_available === false) {
        isBlocked = true;
      }
    }
    
