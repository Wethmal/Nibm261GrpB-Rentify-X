/**
 * ReviewForm (US16): star rating + comment for a completed booking. Creates a review via
 * POST /reviews, or edits an existing one (`review` prop) via PUT /reviews/:id.
 * Validation: rating 1-5, comment of at least 10 characters.
 */
import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import '../common/features.css';

const MIN_COMMENT = 10;

function ReviewForm({ bookingId, review = null, onSubmitSuccess, onCancel }) {
  const [rating, setRating] = useState(review ? Number(review.rating) : 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(review?.comment || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating < 1) return setError('Please choose a star rating.');
    if (comment.trim().length < MIN_COMMENT) return setError(`Please write at least ${MIN_COMMENT} characters.`);
    setSubmitting(true);
    try {
      const payload = { rating, comment: comment.trim() };
      const res = review
        ? await axiosInstance.put(`/reviews/${review.id}`, payload)
        : await axiosInstance.post('/reviews', { bookingId, ...payload });
      setDone(true);
      if (onSubmitSuccess) onSubmitSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your review.');
    } finally {
      setSubmitting(false);
    }
  };

