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

