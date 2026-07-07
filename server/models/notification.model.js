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

