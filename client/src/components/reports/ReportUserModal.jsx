/**
 * ReportUserModal (US29): reason + description form that posts to POST /users/:id/report.
 */
import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import '../common/features.css';

export const REPORT_REASONS = [
  { value: 'abusive_behavior', label: 'Abusive behaviour' },
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'no_show', label: 'No-show' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

const MIN_LENGTH = 20;

function ReportUserModal({ userId, userName, bookingId, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!reason) return setError('Please choose a reason.');
    if (description.trim().length < MIN_LENGTH) return setError(`Please describe the problem in at least ${MIN_LENGTH} characters.`);
    setSubmitting(true);
    try {
      await axiosInstance.post(`/users/${userId}/report`, { reason, description: description.trim(), bookingId: bookingId || undefined });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit the report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fx-overlay" role="dialog" aria-modal="true" aria-label="Report user" onClick={onClose}>
      <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Report {userName || 'this user'}</h3>
        <p className="fx-sub">Reports are reviewed by the Rentify team. False reports may affect your account.</p>
        {done ? (
          <>
            <div className="fx-alert fx-alert--success">Thank you. Your report was submitted and will be reviewed.</div>
            <div className="fx-actions"><button className="fx-btn fx-btn--primary" onClick={onClose}>Close</button></div>
          </>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="fx-alert fx-alert--error" role="alert">{error}</div>}
            <div className="fx-field">
              <label htmlFor="report-reason">Reason</label>
              <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select a reason…</option>
                {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="fx-field">
              <label htmlFor="report-description">What happened?</label>
              <textarea id="report-description" value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} placeholder="Give as much detail as you can." />
              <span className="fx-hint">{description.trim().length}/{MIN_LENGTH} minimum characters</span>
            </div>
            <div className="fx-actions">
              <button type="button" className="fx-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="fx-btn fx-btn--danger" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit report'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportUserModal;
