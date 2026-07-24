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

