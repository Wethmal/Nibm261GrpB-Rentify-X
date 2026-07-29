const notificationModel = require('../models/notification.model');
const userModel = require('../models/user.model');

const DEFAULT_PREFERENCES = {
  newBookings: { inApp: true, email: true, sms: false },
  bookingUpdates: { inApp: true, email: true, sms: true },
  messages: { inApp: true, email: false, sms: false },
  marketing: { inApp: false, email: false, sms: false }
};

