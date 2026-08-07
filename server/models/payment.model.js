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

const create = async (paymentData) => {
  const { booking_id, amount, platform_fee = Number(amount) * 0.1, status = 'pending', gateway_reference = null } = paymentData;
  const { rows } = await query(
    `INSERT INTO payments (booking_id, amount, platform_fee, status, gateway_reference)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [booking_id, amount, platform_fee, status, gateway_reference]
  );
  return rows[0];
};

const updateStatusAndGatewayRef = async (id, status, gatewayRef) => {
  const { rows } = await query(
    `UPDATE payments
     SET status = $1, gateway_reference = COALESCE($2, gateway_reference), updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, gatewayRef || null, id]
  );
  return rows[0] || null;
};

module.exports = { findById, findByBookingId, create, updateStatusAndGatewayRef };
