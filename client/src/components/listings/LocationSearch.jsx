/**
 * LocationSearch (US10): "Use My Location" button plus a manual city / postal-code fallback.
 * Calls onLocation({ lat, lng, label }) or onClear(). Handles permission denial gracefully.
 */
import React, { useState } from 'react';
import { MapPin, LocateFixed, X } from 'lucide-react';
import { geocodeSriLanka, getCurrentPosition } from '../../utils/geo';
import '../common/features.css';

const RADII = [5, 10, 25, 50, 100];

function LocationSearch({ active, radius, onLocation, onRadius, onClear }) {
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showManual, setShowManual] = useState(false);

  const useMyLocation = async () => {
    setBusy(true);
    setMessage('');
    try {
      const pos = await getCurrentPosition();
      onLocation({ ...pos, label: 'My location' });
      setShowManual(false);
    } catch (err) {
      setShowManual(true);
      setMessage(err.code === 'denied'
        ? 'Location permission was denied. Enter your city or postal code instead.'
        : 'We could not detect your location. Enter your city or postal code instead.');
    } finally {
      setBusy(false);
    }
  };

  const submitManual = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const hit = await geocodeSriLanka(manual);
    setBusy(false);
    if (!hit) return setMessage('We could not find that place in Sri Lanka. Try a nearby city or district.');
    onLocation(hit);
  };

  return (
    <div className="location-search" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="fx-btn fx-btn--primary" onClick={useMyLocation} disabled={busy} data-testid="use-my-location">
          <LocateFixed size={14} /> {busy ? 'Locating…' : 'Use My Location'}
        </button>
        <button type="button" className="fx-link-btn" onClick={() => setShowManual((s) => !s)}>Enter city / ZIP instead</button>
        {active && (
          <>
            <span className="fx-badge"><MapPin size={11} /> {active}</span>
            <select value={radius} onChange={(e) => onRadius(Number(e.target.value))} aria-label="Search radius">
              {RADII.map((r) => <option key={r} value={r}>{r} km</option>)}
            </select>
            <button type="button" className="fx-link-btn" onClick={onClear}><X size={12} /> Clear location</button>
          </>
        )}
      </div>
      {showManual && (
        <form onSubmit={submitManual} style={{ display: 'flex', gap: 8 }}>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="City or postal code (e.g. Kandy, 10100)"
            aria-label="City or postal code"
            style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px' }}
          />
          <button type="submit" className="fx-btn" disabled={busy || !manual.trim()}>Search</button>
        </form>
      )}
      {message && <div className="fx-alert fx-alert--error" role="alert" style={{ margin: 0 }}>{message}</div>}
    </div>
  );
}

export default LocationSearch;
