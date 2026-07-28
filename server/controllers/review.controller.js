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

    const booking = await bookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Not Found', message: 'Booking not found' });
    }
    if (booking.consumer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Only the booking consumer can review it' });
    }
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Bad Request', message: 'Only completed bookings can be reviewed' });
    }

    const listingId = booking.service_listing_id || booking.equipment_listing_id;
    const review = await reviewModel.create({
      booking_id: booking.id,
      reviewer_id: req.user.userId,
      reviewee_id: booking.provider_id,
      listing_id: listingId,
      rating: parsedRating,
      comment
    });

    const listingStats = await reviewModel.calculateAverageRating(listingId, 'listing');
    await query(
      'UPDATE listings SET average_rating = $1, review_count = $2, updated_at = NOW() WHERE id = $3',
      [listingStats.average_rating, listingStats.review_count, listingId]
    );

    const providerStats = await reviewModel.calculateAverageRating(booking.provider_id, 'provider');
    await userModel.updateTrustScore(booking.provider_id, providerStats.average_rating);

    res.status(201).json(review);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Conflict', message: 'This booking has already been reviewed' });
    }
    next(error);
  }
};

const refreshAggregates = async (review) => {
  if (review.listing_id) {
    const listingStats = await reviewModel.calculateAverageRating(review.listing_id, 'listing');
    await query('UPDATE listings SET average_rating = $1, review_count = $2, updated_at = NOW() WHERE id = $3',
      [listingStats.average_rating, listingStats.review_count, review.listing_id]);
  }
  const providerStats = await reviewModel.calculateAverageRating(review.reviewee_id, 'provider');
  await userModel.updateTrustScore(review.reviewee_id, providerStats.average_rating);
};

const findOwnReview = async (req, res) => {
  const { rows } = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
  const review = rows[0];
  if (!review) { res.status(404).json({ error: 'Not Found', message: 'Review not found' }); return null; }
  if (review.reviewer_id !== req.user.userId) {
    res.status(403).json({ error: 'Forbidden', message: 'You can only change your own reviews' });
    return null;
  }
  return review;
};

const update = async (req, res, next) => {
  try {
    const review = await findOwnReview(req, res);
    if (!review) return;
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Bad Request', message: 'A 1-5 rating is required' });
    }
    const comment = String(req.body.comment || '').slice(0, 2000);
    const { rows } = await query(
      'UPDATE reviews SET rating = $1, comment = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [rating, comment, review.id]
    );
    await refreshAggregates(rows[0]);
    res.status(200).json(rows[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const review = await findOwnReview(req, res);
    if (!review) return;
    await query('DELETE FROM reviews WHERE id = $1', [review.id]);
    await refreshAggregates(review);
    res.status(200).json({ message: 'Review deleted' });
  } catch (error) { next(error); }
};

