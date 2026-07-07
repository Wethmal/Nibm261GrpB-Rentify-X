/**
 * @file BookingRequestsPage.jsx
 * @module BookingRequestsPage
 *
 * @description
 * Booking requests management page for Rentify providers (US012). Lists all pending
 * booking requests with Accept/Reject action buttons. Shows request details including
 * consumer profile, requested date/time, listing details, and notes. Accepting a
 * request blocks the calendar slot and notifies the consumer. Rejecting sends a
 * decline notification. Prevents double-booking on acceptance.
 *
 * @dependencies
 * - react: useState, useEffect for data fetching
 * - ../../api/axiosInstance.js: Fetch and update booking requests
 * - ../../hooks/useAuth.js: Get current provider user
 * - ../../components/common/Badge.jsx: Status badges
 * - ../../components/common/Button.jsx: Accept/Reject buttons
 * - ../../utils/formatters.js: Date formatting
 *
 * @exports
 * - BookingRequestsPage: React functional component
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import CancelBookingModal from '../../components/bookings/CancelBookingModal';
import ReportButton from '../../components/reports/ReportButton';
import '../../components/common/features.css';
import './BookingRequestsPage.css';

function BookingRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmed, setConfirmed] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch bookings where provider is the user and status is pending (handled by backend or we filter here)
      // Actually we just fetch all for provider, then filter for pending
      const response = await axiosInstance.get('/bookings?limit=100');
      if (response.data && response.data.bookings) {
        const pending = response.data.bookings.filter(b => b.status === 'pending');
        setRequests(pending);
        setConfirmed(response.data.bookings.filter(b => b.status === 'confirmed'));
      }
    } catch (err) {
      console.error('Failed to fetch booking requests:', err);
      setError('Could not load booking requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      setActionLoading(id);
      await axiosInstance.put(`/bookings/${id}/${action}`);
      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== id));
      alert(`Booking ${action}ed successfully.`);
    } catch (err) {
      console.error(`Failed to ${action} booking:`, err);
      if (err.response?.status === 409) {
        alert('Cannot accept: this slot is already booked.');
      } else {
        alert(`Failed to ${action} booking.`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Marking a booking completed also creates the provider's pending payout (US27)
  const handleComplete = async (id) => {
    if (!window.confirm('Mark this booking as completed?')) return;
    try {
      setActionLoading(id);
      await axiosInstance.put(`/bookings/${id}/complete`);
      setConfirmed(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete booking.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="booking-requests-page loading">Loading requests...</div>;
  }

  if (error) {
    return <div className="booking-requests-page error">{error}</div>;
  }

  return (
    <div className="booking-requests-page">
      <div className="requests-header">
        <h1>Booking Requests</h1>
        <p>Review and respond to incoming requests.</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <h3>No Pending Requests</h3>
          <p>Your calendar is clear! Check back later for new bookings.</p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>{request.listing_title}</h3>
                <span className="badge badge--pending">Pending</span>
              </div>
              <div className="request-details">
                <p><strong>Consumer:</strong> {request.consumer_name}</p>
                <p><strong>Date:</strong> {new Date(request.scheduled_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {request.scheduled_time}</p>
                <p><strong>Duration:</strong> {request.duration_hours} hours</p>
                <p><strong>Total Price:</strong> Rs. {request.total_price}</p>
                {request.notes && <p className="request-notes"><strong>Notes:</strong> {request.notes}</p>}
              </div>
              <div className="request-actions">
                <button
                  className="btn btn-reject"
                  onClick={() => handleAction(request.id, 'reject')}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id ? 'Processing...' : 'Reject'}
                </button>
                <button
                  className="btn btn-accept"
                  onClick={() => handleAction(request.id, 'accept')}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id ? 'Processing...' : 'Accept'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmed.length > 0 && (
        <div className="confirmed-bookings" style={{ marginTop: '2rem' }}>
          <div className="requests-header">
            <h2>Confirmed Bookings</h2>
            <p>Mark work as completed to generate your payout, or cancel if you can no longer attend (the consumer is fully refunded).</p>
          </div>
          <div className="requests-grid">
            {confirmed.map(booking => (
              <div key={booking.id} className="request-card" data-testid="confirmed-booking-card">
                <div className="request-header">
                  <h3>{booking.listing_title}</h3>
                  <span className="badge badge--confirmed">Confirmed</span>
                </div>
                <div className="request-details">
                  <p><strong>Consumer:</strong> {booking.consumer_name}</p>
                  <p><strong>Date:</strong> {new Date(booking.scheduled_date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {booking.scheduled_time}</p>
                  <p><strong>Total Price:</strong> Rs. {booking.total_price}</p>
                </div>
                <div className="request-actions">
                  <button className="btn btn-reject" onClick={() => setCancelTarget(booking)} disabled={actionLoading === booking.id}>
                    Cancel booking
                  </button>
                  <button className="btn btn-accept" onClick={() => handleComplete(booking.id)} disabled={actionLoading === booking.id}>
                    Mark completed
                  </button>
                </div>
                <div style={{ marginTop: 8 }}>
                  <ReportButton userId={booking.consumer_id} userName={booking.consumer_name} bookingId={booking.id} label="Report consumer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelTarget && (
        <CancelBookingModal
          booking={cancelTarget}
          asProvider
          onClose={() => setCancelTarget(null)}
          onCancelled={() => { setConfirmed(prev => prev.filter(b => b.id !== cancelTarget.id)); setCancelTarget(null); }}
        />
      )}
    </div>
  );
}

export default BookingRequestsPage;
