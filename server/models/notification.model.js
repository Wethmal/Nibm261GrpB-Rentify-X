/**
 * @file notification.model.js
 * @module NotificationModel
 * @description Data access layer for in-app notifications. Tracks read/unread status.
 * @dependencies ../config/db.js
 * @exports findByUserId, create, markAsRead, markAllAsRead
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const { query } = require('../config/db');

const findByUserId = async (userId, pagination = {}) => {
  const { limit = 20, offset = 0 } = pagination;
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  return result.rows;
};

const create = async (notificationData) => {
  const { user_id, type, title, body, metadata = {} } = notificationData;
  const sql = `
    INSERT INTO notifications (user_id, type, title, body, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await query(sql, [user_id, type, title, body, JSON.stringify(metadata)]);
  const row = result.rows[0];
  // Live delivery (SSE) + email for important events; never let delivery failures break the caller
  try {
    require('../services/realtime').publish(user_id, 'notification', row);
    require('../services/notification.service').deliverExternal(row);
  } catch (err) {
    console.error('Notification delivery hook failed:', err.message);
  }
  return row;
};

const markAsRead = async (id, userId) => {
  const result = await query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rows[0] || null;
};

