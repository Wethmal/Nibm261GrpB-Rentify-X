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

  if (done) {
    return <div className="fx-alert fx-alert--success" role="status">Thank you for your review!</div>;
  }

  const shown = hover || rating;
  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>{review ? 'Edit your review' : 'Leave a Review'}</h3>
      {error && <div className="fx-alert fx-alert--error" role="alert">{error}</div>}
      <div className="review-form__stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.7rem', color: n <= shown ? '#f59e0b' : '#cbd5e1', padding: 2 }}
          >
            ★
          </button>
        ))}
        <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: 6 }}>{rating}/5</span>
      </div>
      <div className="fx-field">
        <textarea
          className="review-form__comment"
          value={comment}
          maxLength={2000}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Share your experience (minimum ${MIN_COMMENT} characters)...`}
          rows={4}
        />
      </div>
      <div className="fx-actions">
        {onCancel && <button type="button" className="fx-btn" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="fx-btn fx-btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : review ? 'Save changes' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

export default ReviewForm;
