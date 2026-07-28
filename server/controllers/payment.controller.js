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

    const gatewayReference = `local_${crypto.randomUUID()}`;
    const payment = await paymentModel.create({
      booking_id: booking.id,
      amount: booking.total_price,
      gateway_reference: gatewayReference
    });

    res.status(200).json({
      payment,
      redirectUrl: null,
      clientSecret: gatewayReference,
      message: 'Payment intent created'
    });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const { paymentId, status = 'escrowed', gatewayReference } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Bad Request', message: 'paymentId is required' });
    }
    const payment = await paymentModel.updateStatusAndGatewayRef(paymentId, status, gatewayReference);
    if (!payment) {
      return res.status(404).json({ error: 'Not Found', message: 'Payment not found' });
    }
    res.status(200).json({ received: true, payment });
  } catch (error) {
    next(error);
  }
};

const releaseFunds = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can release funds' });
    }
    const payment = await paymentModel.updateStatusAndGatewayRef(req.params.id, 'released');
    if (!payment) return res.status(404).json({ error: 'Not Found', message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

const refund = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only admins can refund payments' });
    }
    const payment = await paymentModel.updateStatusAndGatewayRef(req.params.id, 'refunded');
    if (!payment) return res.status(404).json({ error: 'Not Found', message: 'Payment not found' });
    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

const getReceipt = async (req, res, next) => {
  try {
    const payment = await paymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not Found', message: 'Payment not found' });
    if (!canAccessPayment(payment, req.user)) {
      return res.status(403).json({ error: 'Forbidden', message: 'You cannot access this receipt' });
    }
    res.status(200).json({ receipt: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = { initiate, handleWebhook, releaseFunds, refund, getReceipt };
