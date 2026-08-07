/**
 * ListingPolicyControl (US26): lets a provider choose the cancellation policy of a listing.
 * Saves independently through PUT /listings/:id/cancellation-policy.
 */
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import CancellationPolicy from '../bookings/CancellationPolicy';
import '../common/features.css';

const OPTIONS = [
  { value: 'flexible', label: 'Flexible: full refund 24h+ before start' },
  { value: 'moderate', label: 'Moderate: full refund 48h+, 50% 24-48h' },
  { value: 'strict', label: 'Strict: full refund 7 days+, 50% 3-7 days' },
  { value: 'non_refundable', label: 'Non-refundable' },
];

function ListingPolicyControl({ listingId }) {
  const [policy, setPolicy] = useState(null);
  const [selected, setSelected] = useState('moderate');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let alive = true;
    axiosInstance.get(`/listings/${listingId}/cancellation-policy`)
      .then((res) => { if (alive) { setPolicy(res.data.policy); setSelected(res.data.policy.policy_type); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [listingId]);

  const save = async () => {
    setStatus('Saving…');
    try {
      const res = await axiosInstance.put(`/listings/${listingId}/cancellation-policy`, { policy_type: selected });
      setPolicy(res.data.policy);
      setStatus('Saved');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Could not save the policy');
    }
  };

  return (
    <div className="fx-field" data-testid="listing-policy-control">
      <label htmlFor={`policy-${listingId}`}>Cancellation policy</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select id={`policy-${listingId}`} value={selected} onChange={(e) => { setSelected(e.target.value); setStatus(''); }} style={{ flex: 1, minWidth: 220 }}>
          {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button type="button" className="fx-btn fx-btn--primary" onClick={save} disabled={policy && selected === policy.policy_type && policy.source === 'listing'}>Save policy</button>
      </div>
      {status && <span className="fx-hint">{status}</span>}
      {policy && <CancellationPolicy policy={policy} />}
    </div>
  );
}

export default ListingPolicyControl;
