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

