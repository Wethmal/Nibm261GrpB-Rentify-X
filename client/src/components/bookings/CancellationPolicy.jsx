/**
 * CancellationPolicy (US26): collapsible plain-language summary of a listing's refund rules.
 * Pass `listingId` to fetch, or a ready `policy` object.
 */
import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import '../common/features.css';

const LABELS = { flexible: 'Flexible', moderate: 'Moderate', strict: 'Strict', non_refundable: 'Non-refundable' };

function CancellationPolicy({ listingId, policy: given, defaultOpen = false }) {
  const [policy, setPolicy] = useState(given || null);

  useEffect(() => {
    if (given || !listingId) return undefined;
    let cancelled = false;
    axiosInstance.get(`/listings/${listingId}/cancellation-policy`)
      .then((res) => { if (!cancelled) setPolicy(res.data.policy); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [listingId, given]);

  if (!policy) return null;
  return (
    <details className="fx-policy" open={defaultOpen} data-testid="cancellation-policy">
      <summary>
        <ShieldCheck size={16} /> Cancellation policy <span className="fx-badge">{LABELS[policy.policy_type] || policy.policy_type}</span>
      </summary>
      <div className="fx-policy-body">
        <ul>{(policy.summary || []).map((line) => <li key={line}>{line}</li>)}</ul>
      </div>
    </details>
  );
}

export default CancellationPolicy;
