/**
 * @file notification.service.js
 * @module NotificationService
 * @description Notification dispatch service that triggers notifications via multiple channels: in-app (database), email (SMTP), and SMS. Called by controllers and services when events occur (booking status changes, messages, admin actions). Checks user preferences before sending. Email uses nodemailer; SMS uses a configurable provider.
 * @dependencies ../models/notification.model.js
 * @exports sendInApp, sendEmail, sendSMS, notify
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const notificationModel = require('../models/notification.model');

const sendInApp = async (userId, type, title, body, metadata = {}) => {
  const notification = await notificationModel.create({
    user_id: userId,
    type,
    title,
    body,
    metadata
  });
  return notification;
};

const sendEmail = async (toEmail, subject, htmlBody) => {
  // Mock email transport for development
  console.log(`\n=== EMAIL MOCK ===`);
  console.log(`To: ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${htmlBody}`);
  console.log(`==================\n`);
  return true;
};

const sendSMS = async (toMobile, message) => {
  // TODO: Integrate with SMS provider (Twilio, Dialog, Mobitel API for Sri Lanka)
  console.log(`\n=== SMS MOCK ===`);
  console.log(`To: ${toMobile}`);
  console.log(`Message: ${message}`);
  console.log(`==================\n`);
  return true;
};

const notify = async (userId, event, data = {}) => {
  // Currently, we only dispatch in-app notifications
  try {
    await sendInApp(userId, event, data.title || 'Notification', data.body || '', data.metadata || {});
    return true;
  } catch (err) {
    console.error('Failed to dispatch notification:', err);
    return false;
  }
};

const EMAIL_TYPES = new Set([
  'new_booking_request', 'booking_accepted', 'booking_rejected', 'booking_cancelled',
  'booking_completed', 'booking_confirmed', 'moderation_notice', 'report_update',
  'provider_approved', 'provider_rejected', 'nic_approved', 'nic_rejected',
]);

/**
 * Sends the email copy of an in-app notification (US18). Uses the mock transport unless
 * a real SMTP transport replaces sendEmail. Respects the user's notification preferences.
 */
const deliverExternal = (notification) => {
  if (!EMAIL_TYPES.has(notification.type)) return;
  setImmediate(async () => {
    try {
      const { query } = require('../config/db');
      const { rows } = await query('SELECT email, notification_preferences FROM users WHERE id = $1', [notification.user_id]);
      const u = rows[0];
      if (!u || !u.email) return;
      const prefs = u.notification_preferences || {};
      if (prefs.email === false) return;
      await sendEmail(u.email, `Rentify: ${notification.title}`, `<p>${notification.body}</p>`);
    } catch (err) {
      console.error('Email delivery failed:', err.message);
    }
  });
};

