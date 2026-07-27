const { query } = require('../config/db');

const findById = async (id) => {
  const { rows } = await query(
    `SELECT p.*, b.consumer_id, b.provider_id, b.status AS booking_status
     FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findByBookingId = async (bookingId) => {
  const { rows } = await query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 1', [bookingId]);
  return rows[0] || null;
};

