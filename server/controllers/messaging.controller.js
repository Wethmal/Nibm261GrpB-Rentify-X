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

const getConversations = async (req, res, next) => {
  try {
    const conversations = await messageModel.findConversationsByUser(req.user.userId);
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const result = await getBookingForParticipant(req.params.bookingId, req.user.userId);
    if (result.error) {
      return res.status(result.status).json({ error: result.error, message: result.error });
    }

    const readRows = await messageModel.markAsRead(req.params.bookingId, req.user.userId);
    // Let the sender see read receipts live
    const otherId = result.booking.consumer_id === req.user.userId ? result.booking.provider_id : result.booking.consumer_id;
    if (readRows.length) realtime.publish(otherId, 'message_read', { bookingId: req.params.bookingId, ids: readRows.map((m) => m.id) });
    const messages = await messageModel.findByBookingId(req.params.bookingId);
    res.status(200).json({ booking: result.booking, messages });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ error: 'Bad Request', message: 'Message content is required' });
    }

    const result = await getBookingForParticipant(req.params.bookingId, req.user.userId);
    if (result.error) {
      return res.status(result.status).json({ error: result.error, message: result.error });
    }

    const recipientId = result.booking.consumer_id === req.user.userId
      ? result.booking.provider_id
      : result.booking.consumer_id;

