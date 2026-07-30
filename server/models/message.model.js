const { query } = require('../config/db');

const findConversationsByUser = async (userId) => {
  const sql = `
    SELECT b.id AS booking_id,
           b.status AS booking_status,
           b.scheduled_date,
           COALESCE(sl.title, el.title, 'Booking') AS listing_title,
           CASE WHEN b.consumer_id = $1 THEN b.provider_id ELSE b.consumer_id END AS other_user_id,
           CASE WHEN b.consumer_id = $1 THEN provider.full_name ELSE consumer.full_name END AS other_party_name,
           latest.content AS last_message,
           latest.created_at AS last_message_at,
           COALESCE(unread.unread_count, 0)::int AS unread_count
    FROM bookings b
    LEFT JOIN users consumer ON consumer.id = b.consumer_id
    LEFT JOIN users provider ON provider.id = b.provider_id
    LEFT JOIN listings sl ON sl.id = b.service_listing_id
    LEFT JOIN listings el ON el.id = b.equipment_listing_id
    LEFT JOIN LATERAL (
      SELECT content, created_at
      FROM messages m
      WHERE m.booking_id = b.id
      ORDER BY created_at DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS unread_count
      FROM messages m
      WHERE m.booking_id = b.id AND m.recipient_id = $1 AND m.is_read = false
    ) unread ON true
    WHERE b.consumer_id = $1 OR b.provider_id = $1
    ORDER BY COALESCE(latest.created_at, b.created_at) DESC
  `;
  const { rows } = await query(sql, [userId]);
  return rows;
};

const findByBookingId = async (bookingId) => {
  const sql = `
    SELECT m.*, sender.full_name AS sender_name, recipient.full_name AS recipient_name
    FROM messages m
    LEFT JOIN users sender ON sender.id = m.sender_id
    LEFT JOIN users recipient ON recipient.id = m.recipient_id
    WHERE m.booking_id = $1
    ORDER BY m.created_at ASC
  `;
  const { rows } = await query(sql, [bookingId]);
  return rows;
};

