/**
 * @file BundleBookingPage.jsx
 * @module BundleBookingPage
 *
 * @description
 * Bundle booking page for Rentify (US013). Allows consumers to combine a service
 * listing and an equipment listing into a single bundled transaction. Displays
 * selected service, lets the user add compatible equipment, shows combined pricing,
 * and validates that both listings share the same available date/time. This is
 * Rentify's unique differentiating feature enabling single-transaction convenience.
 *
 * @dependencies
 * - react: useState, useEffect for state management
 * - react-router-dom: useSearchParams for pre-selected listing IDs
 * - ../../api/axiosInstance.js: Fetch listings and create bundle booking
 * - ../../utils/formatters.js: Currency formatting for combined pricing
 * - ../../components/common/Button.jsx: Submit booking button
 * - ../../components/common/Spinner.jsx: Loading indicator
 *
 * @exports
 * - BundleBookingPage: React functional component for bundle booking flow
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import CancellationPolicy from '../../components/bookings/CancellationPolicy';
import './BundleBookingPage.css';

function BundleBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceListingId = searchParams.get('service_listing_id');

  const [serviceListing, setServiceListing] = useState(null);
  const [equipmentListings, setEquipmentListings] = useState([]);
  // A bundle can hold several equipment items (US13)
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const toggleEquipment = (equip) => setSelectedEquipment((prev) => (prev.some((e) => e.id === equip.id) ? prev.filter((e) => e.id !== equip.id) : [...prev, equip]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (!serviceListingId) {
      setError('No service selected for bundle booking.');
      setLoading(false);
      return;
    }
    fetchData();
  }, [serviceListingId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch service details
      const serviceRes = await axiosInstance.get(`/listings/${serviceListingId}`);
      setServiceListing(serviceRes.data);

      // Fetch equipment to bundle
      const equipRes = await axiosInstance.get('/search?type=equipment&limit=20');
      if (equipRes.data && equipRes.data.results) {
        setEquipmentListings(equipRes.data.results);
      }
    } catch (err) {
      console.error('Failed to load bundle data', err);
      setError('Could not load booking details.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    if (serviceListing) {
      total += Number(serviceListing.price_per_unit) * duration;
    }
    for (const equip of selectedEquipment) {
      total += Number(equip.price_per_unit) * duration;
    }
    return total;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (selectedEquipment.length === 0) {
      alert('Please select at least one equipment item to bundle with your service.');
      return;
    }
    try {
      setBookingLoading(true);
      await axiosInstance.post('/bookings', {
        listing_id: serviceListing.id,
        equipment_listing_ids: selectedEquipment.map((e) => e.id),
        scheduled_date: date,
        scheduled_time: time,
        duration: Number(duration),
        notes
      });
      alert('Bundle booked successfully!');
      navigate('/bookings');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        alert('Conflict: The selected time is not available for one of the listings.');
      } else {
        alert('Failed to submit bundle booking.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="bundle-booking-page loading">Loading...</div>;
  if (error) return <div className="bundle-booking-page error">{error}</div>;

  return (
    <div className="bundle-booking-page">
      <div className="bundle-header">
        <h1>Bundle Booking</h1>
        <p>Combine a service and equipment into a single booking for convenience.</p>
      </div>

      <div className="bundle-content">
        <div className="listings-selection">
          <div className="selected-service card">
            <h3>Selected Service</h3>
            {serviceListing && (
              <div className="listing-preview">
                <h4>{serviceListing.title}</h4>
                <p>Rs. {serviceListing.price_per_unit} / {serviceListing.unit_label}</p>
                <p className="district">{serviceListing.district}</p>
              </div>
            )}
          </div>

          <div className="equipment-selection card">
            <h3>Add Equipment <small style={{ fontWeight: 400, color: '#64748b' }}>(select one or more from the same provider)</small></h3>
            {equipmentListings.length === 0 ? (
              <p>No equipment available right now.</p>
            ) : (
              <div className="equipment-grid">
                {equipmentListings
                  .filter(equip => !serviceListing?.provider_id || equip.provider_id === serviceListing.provider_id)
                  .map(equip => (
                  <div
                    key={equip.id}
                    className={`equipment-item ${selectedEquipment.some(e => e.id === equip.id) ? 'selected' : ''}`}
                    onClick={() => toggleEquipment(equip)}
                  >
                    <h4>{equip.title}</h4>
                    <p>Rs. {equip.price_per_unit} / {equip.unit_label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="booking-form-wrapper card">
          <h3>Booking Details</h3>
          <form onSubmit={handleBooking} className="booking-form">
            <div className="form-group">
              <label>Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" required value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Duration (hours)</label>
              <input type="number" min="1" max="24" required value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special requirements..."></textarea>
            </div>

            <div className="price-breakdown">
              <h4>Price Breakdown</h4>
              <div className="breakdown-row">
                <span>Service Subtotal:</span>
                <span>Rs. {serviceListing ? (Number(serviceListing.price_per_unit) * duration).toLocaleString() : 0}</span>
              </div>
              {selectedEquipment.map((equip) => (
                <div className="breakdown-row" key={equip.id}>
                  <span>{equip.title}:</span>
                  <span>Rs. {(Number(equip.price_per_unit) * duration).toLocaleString()}</span>
                </div>
              ))}
              <div className="breakdown-row total">
                <span>Total:</span>
                <span>Rs. {calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            {serviceListing && <CancellationPolicy listingId={serviceListing.id} />}

            <button type="submit" className="btn btn-primary btn-block" disabled={bookingLoading || selectedEquipment.length === 0}>
              {bookingLoading ? 'Booking...' : 'Confirm Bundle Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BundleBookingPage;
