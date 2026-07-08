/**
 * @file booking.model.js
 * @module BookingModel
 * @description Data access layer for bookings. Manages booking records, including bundle bookings spanning multiple listings. Uses transactions where necessary to prevent double-booking.
 * @dependencies ../config/db.js
 * @exports findById, findByConsumer, findByProvider, create, updateStatus, checkAvailabilityConflict
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const { query, getClient } = require('../config/db');

const findById = async (id) => {
  const sql = `
    SELECT b.*,
           c.full_name AS consumer_name,
           c.email AS consumer_email,
           c.mobile AS consumer_mobile,
           p.full_name AS provider_name,
           p.email AS provider_email,
           p.mobile AS provider_mobile,
           sl.title AS service_listing_title,
           sl.photos AS service_listing_photos,
           sl.district AS service_listing_district,
           el.title AS equipment_listing_title,
           el.photos AS equipment_listing_photos,
           el.district AS equipment_listing_district
    FROM bookings b
    LEFT JOIN users c ON b.consumer_id = c.id
    LEFT JOIN users p ON b.provider_id = p.id
    LEFT JOIN listings sl ON b.service_listing_id = sl.id
    LEFT JOIN listings el ON b.equipment_listing_id = el.id
    WHERE b.id = $1
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

const findByConsumer = async (consumerId, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  const countSql = `SELECT COUNT(*) FROM bookings WHERE consumer_id = $1`;
  const countRes = await query(countSql, [consumerId]);
  const totalCount = parseInt(countRes.rows[0].count, 10);

  const sql = `
    SELECT b.*,
           COALESCE(sl.id, el.id) AS primary_listing_id,
           COALESCE(sl.title, el.title, '') AS listing_title,
           COALESCE(sl.photos, el.photos, '[]'::jsonb) AS listing_photos,
           COALESCE(sl.district, el.district, '') AS listing_district,
           sl.title AS service_listing_title,
           el.title AS equipment_listing_title,
           p.full_name AS provider_name
    FROM bookings b
    LEFT JOIN listings sl ON b.service_listing_id = sl.id
    LEFT JOIN listings el ON b.equipment_listing_id = el.id
    LEFT JOIN users p ON b.provider_id = p.id
    WHERE b.consumer_id = $1
    ORDER BY b.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await query(sql, [consumerId, limit, offset]);
  return { bookings: result.rows, totalCount };
};

const findByProvider = async (providerId, options = {}) => {
  const { limit = 20, offset = 0, upcoming = false } = options;

  let dateFilter = '';
  if (upcoming) {
    dateFilter = `AND b.scheduled_date >= CURRENT_DATE AND b.status IN ('pending', 'confirmed')`;
  }

  const countSql = `SELECT COUNT(*) FROM bookings b WHERE b.provider_id = $1 ${dateFilter}`;
  const countRes = await query(countSql, [providerId]);
  const totalCount = parseInt(countRes.rows[0].count, 10);

  const sql = `
    SELECT b.*,
           COALESCE(sl.id, el.id) AS primary_listing_id,
           COALESCE(sl.title, el.title, '') AS listing_title,
           COALESCE(sl.photos, el.photos, '[]'::jsonb) AS listing_photos,
           COALESCE(sl.district, el.district, '') AS listing_district,
           sl.title AS service_listing_title,
           el.title AS equipment_listing_title,
           c.full_name AS consumer_name
    FROM bookings b
    LEFT JOIN listings sl ON b.service_listing_id = sl.id
    LEFT JOIN listings el ON b.equipment_listing_id = el.id
    LEFT JOIN users c ON b.consumer_id = c.id
    WHERE b.provider_id = $1 ${dateFilter}
    ORDER BY b.scheduled_date ASC, b.scheduled_time ASC
    LIMIT $2 OFFSET $3
  `;
  const result = await query(sql, [providerId, limit, offset]);
  return { bookings: result.rows, totalCount };
};

const create = async (bookingData) => {
  const {
    consumer_id,
    provider_id,
    service_listing_id,
    equipment_listing_id,
    equipment_items = [],
    booking_type,
    scheduled_date,
    scheduled_time,
    duration_hours,
    total_price,
    notes
  } = bookingData;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock the listings using SELECT FOR UPDATE
    const listingIds = [];
    if (service_listing_id) listingIds.push(service_listing_id);
    if (equipment_listing_id) listingIds.push(equipment_listing_id);
    for (const item of equipment_items) {
      if (!listingIds.includes(item.id)) listingIds.push(item.id);
    }

    // Sort to prevent deadlocks
    listingIds.sort();

    for (const lid of listingIds) {
      await client.query('SELECT 1 FROM listings WHERE id = $1 FOR UPDATE', [lid]);

      const blockedRes = await client.query(
        `SELECT 1 FROM listing_availability
         WHERE listing_id = $1 AND date = $2 AND is_available = false`,
        [lid, scheduled_date]
      );
      if (blockedRes.rowCount > 0) {
        throw new Error('AvailabilityConflict');
      }

      // 2. Perform booking conflict check inside transaction
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
      const conflictRes = await client.query(conflictSql, [lid, scheduled_date, scheduled_time, duration_hours]);
      if (conflictRes.rowCount > 0) {
        throw new Error('AvailabilityConflict');
      }
    }

    // 3. Insert the booking with status 'pending'
    const sql = `
      INSERT INTO bookings (
        consumer_id,
        provider_id,
        service_listing_id,
        equipment_listing_id,
        booking_type,
        status,
        scheduled_date,
        scheduled_time,
        duration_hours,
        total_price,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      consumer_id,
      provider_id,
      service_listing_id || null,
      equipment_listing_id || null,
      booking_type,
      scheduled_date,
      scheduled_time,
      duration_hours,
      total_price,
      notes || ''
    ];

    const result = await client.query(sql, values);
    const created = result.rows[0];

    // Link every bundled equipment item to the booking, atomically with the booking row
    for (const item of equipment_items) {
      await client.query(
        'INSERT INTO booking_equipment (booking_id, listing_id, price) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [created.id, item.id, item.price]
      );
    }

    await client.query('COMMIT');
    return created;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

