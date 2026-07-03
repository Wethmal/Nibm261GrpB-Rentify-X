import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, CheckCircle, AlertCircle, Plus, RefreshCw, Lock, ChevronDown } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import './AvailabilityCalendarPage.css';

// Helper to format Date object into local YYYY-MM-DD string without UTC shift
const formatDateLocal = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to safely extract YYYY-MM-DD from string or Date
const normalizeDateStr = (rawDate) => {
  if (!rawDate) return '';
  if (typeof rawDate === 'string') {
    return rawDate.split('T')[0];
  }
  return formatDateLocal(new Date(rawDate));
};

function AvailabilityCalendarPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState('');
  const [availability, setAvailability] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [daysHorizon, setDaysHorizon] = useState(60); // Default to 60 days
  const [dates, setDates] = useState([]);

  // Generate days based on daysHorizon
  useEffect(() => {
    const generatedDates = [];
    const today = new Date();
    for (let i = 0; i < daysHorizon; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      generatedDates.push(formatDateLocal(d));
    }
    setDates(generatedDates);
  }, [daysHorizon]);

  // Group dates by Month (e.g., "July 2026", "August 2026")
  const monthGroupedDates = useMemo(() => {
    const groups = {};
    dates.forEach(dateStr => {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthLabel = new Date(year, monthIdx, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthLabel]) {
        groups[monthLabel] = [];
      }
      groups[monthLabel].push(dateStr);
    });
    return groups;
  }, [dates]);

  // Fetch provider's listings
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const providerId = user?.id || user?.userId || '';
      const endpoint = providerId 
        ? `/listings?provider_id=${providerId}&status=all&limit=100`
        : `/listings?status=all&limit=100`;

      const res = await axiosInstance.get(endpoint);
      const rawData = res.data;
      
      const fetchedListings = rawData?.results || rawData?.listings || (Array.isArray(rawData) ? rawData : []);
      
      setListings(fetchedListings);
      if (fetchedListings.length > 0 && !selectedListing) {
        setSelectedListing(fetchedListings[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch provider listings:', err);
      setError('Could not load your listings. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedListing]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Fetch availability and confirmed bookings
  const fetchAvailability = useCallback(async (listingId) => {
    if (!listingId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/listings/${listingId}/availability`);
      if (res.data) {
        const availDict = {};
        if (Array.isArray(res.data.availability)) {
          res.data.availability.forEach(item => {
            const dateStr = normalizeDateStr(item.date);
            if (dateStr) {
              availDict[dateStr] = {
                isAvailable: item.is_available ?? item.isAvailable ?? true,
                blockedReason: item.blocked_reason || item.blockedReason || ''
              };
            }
          });
        }
        setAvailability(availDict);
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setError('Could not load availability for the selected listing.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedListing) {
      fetchAvailability(selectedListing);
    }
  }, [selectedListing, fetchAvailability]);

  const isDateBooked = (dateStr) => {
    return bookings.some(b => normalizeDateStr(b.scheduled_date) === dateStr);
  };

  const toggleDate = (dateStr) => {
    if (isDateBooked(dateStr)) return; // Can't toggle confirmed booking dates

    setAvailability(prev => {
      const current = prev[dateStr] || { isAvailable: true };
      return {
        ...prev,
        [dateStr]: { ...current, isAvailable: !current.isAvailable }
      };
    });
  };

  const handleBulkToggle = (makeAvailable, filterFn = null) => {
    setAvailability(prev => {
      const updated = { ...prev };
      dates.forEach(dateStr => {
        if (!isDateBooked(dateStr)) {
          if (!filterFn || filterFn(dateStr)) {
            updated[dateStr] = {
              ...(updated[dateStr] || {}),
              isAvailable: makeAvailable
            };
          }
        }
      });
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedListing) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      // Exclude confirmed booked dates from the payload to prevent 409 conflict
      const payload = Object.keys(availability)
        .filter(date => !isDateBooked(date))
        .map(date => ({
          date,
          isAvailable: availability[date].isAvailable,
          blockedReason: availability[date].blockedReason || null
        }));

      await axiosInstance.put(`/listings/${selectedListing}/availability`, { dates: payload });
      setSuccessMsg('Availability settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to save availability:', err);
      if (err.response?.status === 409) {
        setError(err.response.data.message || 'Cannot block a date with confirmed bookings.');
      } else {
        setError('Failed to save availability. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="availability-calendar-page">
      <div className="calendar-header">
        <h1>Manage Availability</h1>
        <p>Set your available dates and block periods for each listing to prevent double-bookings.</p>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#047857', borderRadius: '8px' }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {listings.length === 0 && !loading ? (
        <div className="empty-listings-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--color-surface, #ffffff)', borderRadius: '12px', border: '1px solid var(--color-border, #e2e8f0)' }}>
          <CalendarIcon size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.5rem' }}>No Listings Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>You don't have any listings created yet. Create a service or equipment listing to manage availability.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/provider/listings/new/service" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <Plus size={18} /> Create Service Listing
            </Link>
            <Link to="/provider/listings/new/equipment" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: '#f1f5f9', color: '#334155', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
              <Plus size={18} /> Create Equipment Listing
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="calendar-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="listing-select" style={{ fontWeight: 600 }}>Select Listing:</label>
              <select
                id="listing-select"
                value={selectedListing}
                onChange={(e) => setSelectedListing(e.target.value)}
                disabled={loading || saving}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
              >
                {listings.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.type === 'service' ? 'Service' : 'Equipment'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="horizon-select" style={{ fontWeight: 600 }}>View Horizon:</label>
              <select
                id="horizon-select"
                value={daysHorizon}
                onChange={(e) => setDaysHorizon(Number(e.target.value))}
                disabled={loading || saving}
                style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#f8fafc' }}
              >
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
                <option value={90}>90 Days (3 Months)</option>
                <option value={180}>180 Days (6 Months)</option>
                <option value={365}>365 Days (1 Year)</option>
              </select>
            </div>

            <div className="bulk-actions" style={{ marginLeft: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => handleBulkToggle(true)}
                className="btn-sm"
                style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
              >
                Mark All Available
              </button>
              <button 
                type="button" 
                onClick={() => handleBulkToggle(false, (dStr) => {
                  const day = new Date(dStr).getDay();
                  return day === 0 || day === 6; // Block weekends
                })}
                className="btn-sm"
                style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
              >
                Block Weekends
              </button>
              <button 
                type="button" 
                onClick={() => handleBulkToggle(false)}
                className="btn-sm"
                style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
              >
                Block All Dates
              </button>
            </div>
          </div>

          <div className="calendar-legend" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span className="legend-item"><span className="swatch available"></span> Available</span>
            <span className="legend-item"><span className="swatch blocked"></span> Blocked</span>
            <span className="legend-item"><span className="swatch booked"></span> Booked (Confirmed)</span>
            <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.9rem' }}>Showing <strong>{dates.length} days</strong> ahead</span>
          </div>

          {loading ? (
            <div className="loading" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <RefreshCw className="spin" size={24} style={{ marginBottom: '0.5rem' }} />
              <p>Loading calendar availability...</p>
            </div>
          ) : (
            <div className="calendar-months-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
              {Object.keys(monthGroupedDates).map(monthLabel => (
                <div key={monthLabel} className="month-section">
                  <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarIcon size={18} style={{ color: 'var(--color-primary, #3b82f6)' }} />
                    {monthLabel}
                  </h3>

                  <div className="calendar-grid">
                    {monthGroupedDates[monthLabel].map(dateStr => {
                      const isBooked = isDateBooked(dateStr);
                      const isAvailable = availability[dateStr] ? availability[dateStr].isAvailable : true;

                      let statusClass = 'available';
                      if (isBooked) statusClass = 'booked';
                      else if (!isAvailable) statusClass = 'blocked';

                      // Parse components for display
                      const parts = dateStr.split('-');
                      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                      const month = d.toLocaleDateString('en-US', { month: 'short' });
                      const dayNum = d.getDate();

                      return (
                        <div
                          key={dateStr}
                          className={`calendar-cell ${statusClass} ${isBooked ? 'disabled' : ''}`}
                          onClick={() => toggleDate(dateStr)}
                          title={isBooked ? 'Confirmed Booking (Cannot be unblocked)' : 'Click to toggle availability'}
                        >
                          <div className="cell-date">{month} {dayNum}</div>
                          <div className="cell-day">{dayName}</div>
                          <div className="cell-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            {isBooked && <Lock size={12} />}
                            {isBooked ? 'Booked' : (isAvailable ? 'Available' : 'Blocked')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="calendar-actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || loading || !selectedListing}
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AvailabilityCalendarPage;


