const notificationModel = require('../models/notification.model');
const userModel = require('../models/user.model');

const DEFAULT_PREFERENCES = {
  newBookings: { inApp: true, email: true, sms: false },
  bookingUpdates: { inApp: true, email: true, sms: true },
  messages: { inApp: true, email: false, sms: false },
  marketing: { inApp: false, email: false, sms: false }
};

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const notifications = await notificationModel.findByUserId(req.user.userId, { limit, offset });
    res.status(200).json({ notifications, page, limit });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationModel.markAsRead(req.params.id, req.user.userId);
    if (!notification) {
      return res.status(404).json({ error: 'Not Found', message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const notifications = await notificationModel.markAllAsRead(req.user.userId);
    res.status(200).json({ updated: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.userId);
    res.status(200).json(user?.notification_preferences || DEFAULT_PREFERENCES);
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const updated = await userModel.update(req.user.userId, {
      notification_preferences: req.body || DEFAULT_PREFERENCES
    });
    res.status(200).json(updated?.notification_preferences || req.body || DEFAULT_PREFERENCES);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, markAsRead, markAllAsRead, getPreferences, updatePreferences };
