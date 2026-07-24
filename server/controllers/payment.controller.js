const crypto = require('crypto');
const bookingModel = require('../models/booking.model');
const paymentModel = require('../models/payment.model');

const canAccessPayment = (payment, user) => {
  return user.role === 'admin' || payment.consumer_id === user.userId || payment.provider_id === user.userId;
};

