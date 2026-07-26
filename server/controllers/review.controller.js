const bookingModel = require('../models/booking.model');
const reviewModel = require('../models/review.model');
const userModel = require('../models/user.model');
const { query } = require('../config/db');

const create = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const parsedRating = Number(rating);

    if (!bookingId || !Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Bad Request', message: 'bookingId and a 1-5 rating are required' });
    }

