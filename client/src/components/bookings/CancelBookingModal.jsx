/**
 * CancelBookingModal (US26): shows the refund preview from GET /bookings/:id/cancellation-preview
 * and confirms with POST /bookings/:id/cancel (consumer) or /cancel-by-provider (provider).
 */
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import CancellationPolicy from './CancellationPolicy';
import '../common/features.css';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function CancelBookingModal({ booking, asProvider = false, onClose, onCancelled }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(!asProvider);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (asProvider) return undefined;
    let alive = true;
    axiosInstance.get(`/bookings/${booking.id}/cancellation-preview`)
      .then((res) => { if (alive) setPreview(res.data); })
      .catch((err) => { if (alive) setError(err.response?.data?.message || 'Could not load the refund preview.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [booking.id, asProvider]);

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const url = asProvider ? `/bookings/${booking.id}/cancel-by-provider` : `/bookings/${booking.id}/cancel`;
      const res = await axiosInstance.post(url, { reason: reason.trim() || undefined });
      onCancelled(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this booking.');
      setBusy(false);
    }
  };

  return (
    <div className="fx-overlay" role="dialog" aria-modal="true" aria-label="Cancel booking" onClick={onClose}>
      <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Cancel this booking?</h3>
        {asProvider ? (
          <p className="fx-sub">The consumer will receive a full refund regardless of the cancellation policy.</p>
        ) : loading ? (
          <p className="fx-sub">Calculating your refund…</p>
        ) : preview ? (
          <>
            <p className="fx-sub">Here is what you would get back if you cancel now.</p>
            <div className="fx-refund" data-testid="refund-preview">
              <div className="fx-refund-row"><span>Booking total</span><strong>{money(preview.totalPaid)}</strong></div>
              <div className="fx-refund-row"><span>Refund ({preview.refundPercent}%)</span><strong>{money(preview.refundAmount)}</strong></div>
              <div className="fx-refund-row fx-refund-total"><span>Non-refundable</span><strong>{money(preview.totalPaid - preview.refundAmount)}</strong></div>
            </div>
            <CancellationPolicy policy={preview.policy} defaultOpen />
          </>
        ) : null}
        {error && <div className="fx-alert fx-alert--error" role="alert" style={{ marginTop: 10 }}>{error}</div>}
        <div className="fx-field" style={{ marginTop: 12 }}>
          <label htmlFor="cancel-reason">Reason (optional)</label>
          <input id="cancel-reason" value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="fx-actions">
          <button className="fx-btn" onClick={onClose} disabled={busy}>Keep booking</button>
          <button className="fx-btn fx-btn--danger" onClick={confirm} disabled={busy || (!asProvider && loading)}>
            {busy ? 'Cancelling…' : 'Confirm cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelBookingModal;
