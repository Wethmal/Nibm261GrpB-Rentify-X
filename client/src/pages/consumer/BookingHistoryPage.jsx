/**
 * @file BookingHistoryPage.jsx
 * @module BookingHistoryPage
 *
 * @description
 * Consumer booking history page for Rentify (US004 / SCRUM-59).
 * Fetches booking details from the GET /api/v1/bookings backend API. Displays dates,
 * times, locations, and associated notes visually in cards/list. Automatically falls back
 * to high-fidelity mockup data if the API is stubbed or offline.
 *
 * @dependencies
 * - react: useState, useEffect, useMemo
 * - react-router-dom: Link
 * - lucide-react: Icons
 * - ../../api/axiosInstance.js: Backend API client
 * - ./BookingHistoryPage.css: Premium layouts
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Search, ArrowRight, Star, DollarSign, Ban, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import CancelBookingModal from '../../components/bookings/CancelBookingModal';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReportButton from '../../components/reports/ReportButton';
import '../../components/common/features.css';
import './BookingHistoryPage.css';



function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [flash, setFlash] = useState('');

  // Fetch bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/bookings');
        const data = response.data;
        if (data && Array.isArray(data)) {
          setBookings(data);
        } else if (data && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        } else {
          setBookings([]);
        }
      } catch (err) {
        console.error('Backend API connection failed:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Opens the refund-preview modal (US26); the modal performs the cancellation
  const handleCancel = (booking) => setCancelTarget(booking);

  const onCancelled = (result) => {
    setBookings((prev) => prev.map((b) => (b.id === result.booking.id ? { ...b, status: 'cancelled' } : b)));
    setCancelTarget(null);
    setFlash(result.refundAmount > 0
      ? `Booking cancelled. A refund of LKR ${Number(result.refundAmount).toLocaleString()} (${result.refundPercent}%) is on its way.`
      : 'Booking cancelled. No refund applies under the cancellation policy.');
  };

  // Status mapping to tab groupings
  const tabFilteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'active') return booking.status === 'confirmed';
      if (activeTab === 'pending') return booking.status === 'pending';
      if (activeTab === 'past') return booking.status === 'completed';
      if (activeTab === 'cancelled') return booking.status === 'cancelled';
      return true;
    });
  }, [bookings, activeTab]);

  // Search filtering
  const filteredBookings = useMemo(() => {
    return tabFilteredBookings.filter((booking) => {
      const title = booking.listing_title || booking.service_listing?.title || booking.equipment_listing?.title || booking.title || '';
      const provider = booking.provider_name || booking.provider?.full_name || '';
      const titleMatches = title.toLowerCase().includes(searchQuery.toLowerCase());
      const providerMatches = provider.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatches || providerMatches;
    });
  }, [tabFilteredBookings, searchQuery]);

  // Real-time Spend Metric calculations
  const stats = useMemo(() => {
    const totalCount = filteredBookings.length;
    const totalSpend = filteredBookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_price || 0), 0);
    return { totalCount, totalSpend };
  }, [filteredBookings]);

  // Pagination bounds
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBookings.slice(startIndex, startIndex + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredBookings.length / pageSize) || 1;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1); // Reset page on tab shift
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge--pending';
      case 'confirmed': return 'badge--confirmed';
      case 'completed': return 'badge--completed';
      case 'cancelled': return 'badge--cancelled';
      default: return 'badge--neutral';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderCardTimeline = (status) => {
    return (
      <div className="booking-card__micro-timeline" data-testid="micro-timeline">
        <div className="timeline-node active">
          <div className="timeline-node__dot" />
          <span className="timeline-node__label">Requested</span>
        </div>
        <div className="timeline-connector active" />

        {status === 'cancelled' ? (
          <div className="timeline-node active error">
            <div className="timeline-node__dot" />
            <span className="timeline-node__label">Cancelled</span>
          </div>
        ) : (
          <>
            <div className={`timeline-node ${status !== 'pending' ? 'active' : ''}`}>
              <div className="timeline-node__dot" />
              <span className="timeline-node__label">
                {status === 'pending' ? 'Awaiting Host' : 'Approved'}
              </span>
            </div>
            <div className={`timeline-connector ${status === 'completed' || status === 'confirmed' ? 'active' : ''}`} />
            <div className={`timeline-node ${status === 'completed' || status === 'confirmed' ? 'active' : ''}`}>
              <div className="timeline-node__dot" />
              <span className="timeline-node__label">
                {status === 'completed' ? 'Completed' : 'Scheduled'}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="booking-history-page">
      <div className="bookings-header">
        <div className="bookings-header__title-section">
          <h1>My Bookings</h1>
          <p>View and manage your booking history.</p>
        </div>

        {/* Dynamic spend indicators */}
        <div className="bookings-header__stats">
          <div className="bookings-header__stat-card">
            <DollarSign className="stat-card__icon" size={20} />
            <div className="stat-card__info">
              <span className="stat-card__label">Active / Completed Spend</span>
              <span className="stat-card__val">{formatCurrency(stats.totalSpend)}</span>
            </div>
          </div>
          <div className="bookings-header__stat-card">
            <Sparkles className="stat-card__icon" size={20} />
            <div className="stat-card__info">
              <span className="stat-card__label">Filtered Entries</span>
              <span className="stat-card__val">{stats.totalCount} Bookings</span>
            </div>
          </div>
        </div>
      </div>

      {flash && <div className="fx-alert fx-alert--success" role="status" style={{ margin: '0 0 12px' }}>{flash}</div>}
      {cancelTarget && (
        <CancelBookingModal booking={cancelTarget} onClose={() => setCancelTarget(null)} onCancelled={onCancelled} />
      )}
      {reviewTarget && (
        <div className="fx-overlay" onClick={() => setReviewTarget(null)}>
          <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
            <ReviewForm
              bookingId={reviewTarget.id}
              onCancel={() => setReviewTarget(null)}
              onSubmitSuccess={() => { setFlash('Thanks! Your review was published.'); setTimeout(() => setReviewTarget(null), 1200); }}
            />
          </div>
        </div>
      )}

      {/* Navigation Filter Tabs */}
      <div className="bookings-tabs-container">
        <div className="bookings-tabs" role="tablist">
          {['all', 'active', 'pending', 'past', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`bookings-tab ${activeTab === tab ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab}
              data-testid={`tab-${tab}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Keyword Search Field */}
        <div className="bookings-search">
          <Search size={18} className="bookings-search__icon" />
          <input
            type="text"
            placeholder="Search by title or provider..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="bookings-search__input"
            aria-label="Search bookings"
          />
        </div>
      </div>

      {loading ? (
        /* Premium Loading Skeleton */
        <div className="bookings-list" data-testid="bookings-loading">
          {[1, 2].map((n) => (
            <div key={n} className="booking-card booking-card--skeleton">
              <div className="booking-card__image-container skeleton-box" style={{ height: '200px' }} />
              <div className="booking-card__content" style={{ gap: '1rem' }}>
                <div className="skeleton-box" style={{ width: '60%', height: '24px' }} />
                <div className="skeleton-box" style={{ width: '40%', height: '16px' }} />
                <div className="skeleton-box" style={{ width: '80%', height: '16px' }} />
                <div className="skeleton-box" style={{ width: '30%', height: '36px', marginTop: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedBookings.length > 0 ? (
        <div className="bookings-list" data-testid="bookings-list">
          {paginatedBookings.map((booking) => {
            // Safe key mappings for flexible database records
            const title = booking.listing_title || booking.service_listing?.title || booking.equipment_listing?.title || booking.title || 'Rental Listing';
            const photo = booking.listing_photo || booking.service_listing?.photos?.[0] || booking.equipment_listing?.photos?.[0] || booking.photo || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400';
            const district = booking.listing_district || booking.service_listing?.district || booking.equipment_listing?.district || booking.district || 'Colombo';
            const providerName = booking.provider_name || booking.provider?.full_name || 'Rentify Partner';
            const targetListingId = booking.service_listing_id || booking.equipment_listing_id || booking.listing_id;
            const durationText = booking.duration || `${booking.duration_hours} hours`;

