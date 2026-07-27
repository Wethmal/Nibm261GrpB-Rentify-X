const crypto = require('crypto');
const bookingModel = require('../models/booking.model');
const paymentModel = require('../models/payment.model');

const canAccessPayment = (payment, user) => {
  return user.role === 'admin' || payment.consumer_id === user.userId || payment.provider_id === user.userId;
};

const initiate = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await bookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
    }
    if (booking.consumer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the booking consumer can pay' });
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Bad Request', message: 'This booking cannot be paid now' });
    }

    const existing = await paymentModel.findByBookingId(booking.id);
    if (existing && existing.status !== 'failed') {
      return res.status(200).json({ payment: existing, redirectUrl: null, clientSecret: existing.gateway_reference });
    }

