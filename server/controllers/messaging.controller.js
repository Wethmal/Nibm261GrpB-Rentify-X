const messageModel = require('../models/message.model');
const bookingModel = require('../models/booking.model');
const notificationModel = require('../models/notification.model');
const realtime = require('../services/realtime');
const { query } = require('../config/db');

const getBookingForParticipant = async (bookingId, userId) => {
  const booking = await bookingModel.findById(bookingId);
  if (!booking) return { status: 404, error: 'Booking not found' };
  if (booking.consumer_id !== userId && booking.provider_id !== userId) {
    return { status: 403, error: 'You are not part of this booking' };
  }
  return { booking };
};

