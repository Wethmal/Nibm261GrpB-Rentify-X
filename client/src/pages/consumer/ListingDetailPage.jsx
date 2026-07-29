import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import { getCategoryFallback } from '../../utils/imageHelper.js';
import { Star, MapPin, Mail, Phone, ChevronLeft, ChevronRight, ShieldCheck, ArrowLeft, Calendar, Clock, Edit3, CheckCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext.jsx';
import CancellationPolicy from '../../components/bookings/CancellationPolicy.jsx';
import ReportButton from '../../components/reports/ReportButton.jsx';
import ReviewForm from '../../components/reviews/ReviewForm.jsx';
import '../../components/common/features.css';
import './ListingDetailPage.css';

import { GoogleMap, useJsApiLoader, Marker, OverlayView, OverlayViewF } from '@react-google-maps/api';

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const currentUserId = auth?.user?.id;
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Booking states
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState(1);
  const [bookingNotes, setBookingNotes] = useState('');
  const [availabilityList, setAvailabilityList] = useState([]);
  const [dateError, setDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    const fetchListingAndAvailability = async () => {
      setLoading(true);
      setError(null);
      try {
        const listingRes = await axiosInstance.get(`/listings/${id}`);
        if (listingRes.data) {
          setListing(listingRes.data);
          setActivePhotoIndex(0);
        }

        // Fetch availability
        try {
          const availRes = await axiosInstance.get(`/listings/${id}/availability`);
          if (availRes.data) {
            setAvailabilityList(availRes.data);
          }
        } catch (availErr) {
          console.error("Availability fetch error:", availErr);
        }

      } catch (err) {
        console.error('API error:', err);
        setError('Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };

    fetchListingAndAvailability();
  }, [id]);

  // SEO Update title & meta description dynamically
  useEffect(() => {
    if (listing) {
      document.title = `${listing.title} - LKR ${listing.price_per_unit}/${listing.unit_label} | Rentify`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', `${listing.title} available in ${listing.district} for LKR ${listing.price_per_unit} per ${listing.unit_label}. ${listing.description.substring(0, 120)}...`);
    }
  }, [listing]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={16} fill="#fbbf24" stroke="#fbbf24" />);
      } else {
        stars.push(<Star key={i} size={16} fill="none" stroke="#d1d5db" />);
      }
    }
    return stars;
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    setBookingDate(val);
    setDateError('');

    if (!val) return;

    // Check if the selected date is marked unavailable
    const match = availabilityList.find(d => {
      const dDate = new Date(d.date).toISOString().split('T')[0];
      return dDate === val;
    });

    if (match && match.is_available === false) {
      setDateError('Selected date is unavailable. Please select another date.');
    }
  };

  const handleDurationChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setBookingDuration(1);
    } else {
      setBookingDuration(val);
    }
  };

  const handleNotesChange = (e) => {
    const val = e.target.value;
    if (val.length <= 500) {
      setBookingNotes(val);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime || dateError) return;

    setIsSubmitting(true);
    const payload = {
      listing_id: listing.id,
      scheduled_date: bookingDate,
      scheduled_time: bookingTime,
      duration: bookingDuration,
      notes: bookingNotes
    };

    try {
      const res = await axiosInstance.post('/bookings', payload);
      if (res.data) {
        setBookingSuccessData({
          bookingId: res.data.bookingId || res.data.id,
          status: res.data.status || 'pending'
        });
      }
    } catch (err) {
      console.error('API booking submission failed:', err);
      setDateError('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setBookingDate('');
    setBookingTime('');
    setBookingDuration(1);
    setBookingNotes('');
  };

  if (loading) {
    return (
      <div className="detail-skeleton-container" data-testid="listing-detail-skeleton">
        <div className="skeleton-pulse skeleton-breadcrumb"></div>
        <div className="listing-detail-layout">
          <div className="detail-main">
            <div className="skeleton-pulse skeleton-carousel"></div>
            <div className="skeleton-pulse skeleton-title"></div>
            <div className="skeleton-pulse skeleton-text"></div>
          </div>
          <div className="detail-sidebar">
            <div className="skeleton-pulse skeleton-card"></div>
            <div className="skeleton-pulse skeleton-card"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="listing-error-state" data-testid="listing-error">
        <h2>Listing Not Found</h2>
        <p>We could not find the listing you are looking for. It may have been removed or is no longer active.</p>
        <Link to="/search" className="btn-back-home">
          <ArrowLeft size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Back to Search
        </Link>
      </div>
    );
  }

  const photosList = Array.isArray(listing.photos) && listing.photos.length > 0
    ? listing.photos
    : [getCategoryFallback(listing.category_name, listing.title)];

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev === 0 ? photosList.length - 1 : prev - 1));
  };

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev === photosList.length - 1 ? 0 : prev + 1));
  };

  const handleBundle = () => {
    navigate(`/bundle-booking?service_listing_id=${listing.id}`);
  };

  const totalPrice = listing.price_per_unit * bookingDuration;

  // Format today's date for date input min attribute
  const todayDateString = new Date().toISOString().split('T')[0];

  return (
    <div className="listing-detail-container" data-testid="listing-detail-page">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb__separator">/</span>
        <Link to="/search">Search</Link>
        <span className="breadcrumb__separator">/</span>
        <span className="breadcrumb__current">{listing.title}</span>
      </nav>

      <div className="listing-detail-layout">
        {/* Left column */}
        <div className="detail-main">
          {/* Photo Carousel */}
          <div className="photo-carousel" data-testid="photo-carousel">
            <div className="carousel-main-wrapper">
              <img
                src={photosList[activePhotoIndex]}
                alt={`${listing.title} - View ${activePhotoIndex + 1}`}
                className="carousel-main-image"
                data-testid="carousel-main-image"
              />
              {photosList.length > 1 && (
                <>
                  <button onClick={prevPhoto} className="carousel-nav-btn carousel-nav-btn--prev" aria-label="Previous photo">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={nextPhoto} className="carousel-nav-btn carousel-nav-btn--next" aria-label="Next photo">
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnail Strip */}
            {photosList.length > 1 && (
              <div className="thumbnail-strip" data-testid="thumbnail-strip">
                {photosList.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setActivePhotoIndex(index)}
                    className={`thumbnail-item ${index === activePhotoIndex ? 'active' : ''}`}
                    data-testid={`thumbnail-item-${index}`}
                  >
                    <img src={photo} alt={`Thumbnail ${index + 1}`} className="thumbnail-image" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="listing-info-card">
            <div className="listing-badge-row">
              <span className={`type-badge ${listing.type}`}>
                {listing.type === 'service' ? 'Service' : 'Equipment'}
              </span>
              <span className="category-tag">{listing.category_name}</span>
              <span className="district-badge">
                <MapPin size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                {listing.district}
              </span>
              {listing.condition && (
                <span className="district-badge" style={{ textTransform: 'capitalize' }}>
                  Condition: {listing.condition}
                </span>
              )}
            </div>

            <h1 className="listing-detail-title">{listing.title}</h1>

            <div className="listing-rating-summary">
              <div className="stars-list">
                {renderStars(listing.average_rating)}
              </div>
              <span style={{ fontWeight: '600' }}>{listing.average_rating}</span>
              <span className="review-count-label">({listing.review_count || 0} reviews)</span>
            </div>

            <hr className="listing-section-divider" />

            <div className="listing-description-section">
              <h3>Description</h3>
              <p className="listing-description-text">{listing.description}</p>
            </div>

            {listing.specifications && Object.keys(listing.specifications).length > 0 && (
              <>
                <hr className="listing-section-divider" />
                <div className="listing-description-section">
                  <h3>Specifications</h3>
                  <div className="specs-grid">
                    {Object.entries(listing.specifications).map(([key, val]) => (
                      <div className="spec-item" key={key}>
                        <div className="spec-label">{key}</div>
                        <div className="spec-value">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reviews List */}
          <div className="reviews-section" data-testid="reviews-section">
            <h2 className="reviews-section-header">Customer Reviews</h2>
            {listing.reviews && listing.reviews.length > 0 ? (
              listing.reviews.map((review) => (
                <div className="review-item" key={review.id} data-testid="review-item">
                  <div className="review-header">
                    <span className="reviewer-name">{review.reviewer_name}</span>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="review-stars">
                    {renderStars(review.rating)}
                  </div>
                  {editingReviewId === review.id ? (
                    <ReviewForm
                      review={review}
                      onCancel={() => setEditingReviewId(null)}
                      onSubmitSuccess={(saved) => {
                        setListing((prev) => ({ ...prev, reviews: prev.reviews.map((r) => (r.id === review.id ? { ...r, rating: saved.rating, comment: saved.comment } : r)) }));
                        setTimeout(() => setEditingReviewId(null), 900);
                      }}
                    />
                  ) : (
                    <p className="review-comment">{review.comment}</p>
                  )}
                  {currentUserId && review.reviewer_id === currentUserId && editingReviewId !== review.id && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      <button type="button" className="fx-link-btn" onClick={() => setEditingReviewId(review.id)}>Edit</button>
                      <button
                        type="button"
                        className="fx-link-btn"
                        onClick={async () => {
                          if (!window.confirm('Delete your review?')) return;
                          try {
                            await axiosInstance.delete(`/reviews/${review.id}`);
                            setListing((prev) => ({ ...prev, reviews: prev.reviews.filter((r) => r.id !== review.id), review_count: Math.max((prev.review_count || 1) - 1, 0) }));
                          } catch (err) {
                            alert(err.response?.data?.message || 'Could not delete the review.');
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-reviews-state">No reviews yet for this listing.</div>
            )}
          </div>

          {/* Location Map */}
          {listing.geo_lat && listing.geo_lng && isLoaded && (
            <div className="location-section" style={{ marginTop: '2rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Location</h3>
              <div className="map-container" style={{ width: '100%', height: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: parseFloat(listing.geo_lat), lng: parseFloat(listing.geo_lng) }}
                  zoom={12}
                >
                  <OverlayViewF
                    position={{ lat: parseFloat(listing.geo_lat), lng: parseFloat(listing.geo_lng) }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div 
                      title={listing.title}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid white',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        transform: 'translate(-50%, -50%)',
                        cursor: 'pointer',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
                        e.currentTarget.style.zIndex = '1000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                        e.currentTarget.style.zIndex = '1';
                      }}
                    >
                      <img 
                        src={photosList && photosList.length > 0 ? photosList[0] : 'https://via.placeholder.com/40?text=Img'} 
                        alt={listing.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=Img'; }}
                      />
                    </div>
                  </OverlayViewF>
                </GoogleMap>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Action card and Provider card */}
        <div className="detail-sidebar">
          {/* Pricing & Interactive Booking Card */}
          <div className="pricing-sidebar-card" data-testid="pricing-card">
            {bookingSuccessData ? (
              <div className="booking-success-container" data-testid="booking-success-state">
                <div className="success-icon-wrapper">
                  <CheckCircle size={48} className="success-icon" />
                </div>
                <h3 className="success-title">Booking Request Sent!</h3>
                <p className="success-subtitle">Your request has been submitted and is pending review by the provider.</p>

                <div className="success-details-box">
                  <div className="success-detail-row">
                    <span className="detail-label">Booking ID:</span>
                    <span className="detail-val booking-id-text" data-testid="booking-id-display">{bookingSuccessData.bookingId}</span>
                  </div>
                  <div className="success-detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="status-badge pending" data-testid="booking-status-display">{bookingSuccessData.status}</span>
                  </div>
                </div>

                <div className="success-actions">
                  <button onClick={() => navigate('/bookings')} className="btn-view-bookings">
                    View My Bookings
                  </button>
                  <button onClick={() => setBookingSuccessData(null)} className="btn-book-another">
                    Book Another Date
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="price-display-wrapper">
                  <span className="price-amount">{formatCurrency(listing.price_per_unit)}</span>
                  <span className="price-unit">/ {listing.unit_label}</span>
                </div>

                <form onSubmit={handleFormSubmit} className="booking-panel-form" data-testid="booking-panel-form">
                  <div className="form-group">
                    <label htmlFor="booking-date">
                      <Calendar size={14} className="input-icon" />
                      Select Date *
                    </label>
                    <input
                      type="date"
                      id="booking-date"
                      min={todayDateString}
                      value={bookingDate}
                      onChange={handleDateChange}
                      className={`booking-input ${dateError ? 'input-error' : ''}`}
                      data-testid="date-picker"
                      required
                    />
                    {dateError && <span className="validation-error" data-testid="date-error">{dateError}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-time">
                      <Clock size={14} className="input-icon" />
                      Start Time *
                    </label>
                    <input
                      type="time"
                      id="booking-time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="booking-input"
                      data-testid="time-picker"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-duration">
                      <Clock size={14} className="input-icon" />
                      Duration ({listing.unit_label}s) *
                    </label>
                    <input
                      type="number"
                      id="booking-duration"
                      min="1"
                      value={bookingDuration}
                      onChange={handleDurationChange}
                      className="booking-input"
                      data-testid="duration-selector"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="booking-notes" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <Edit3 size={14} className="input-icon" />
                        Notes (Optional)
                      </span>
                      <span className="char-count" data-testid="char-count">{bookingNotes.length}/500</span>
                    </label>
                    <textarea
                      id="booking-notes"
                      rows="3"
                      value={bookingNotes}
                      onChange={handleNotesChange}
                      placeholder="Specify details, location, or equipment specs..."
                      className="booking-textarea"
                      data-testid="notes-field"
                      maxLength="500"
                    />
                  </div>

                  <div className="price-calculation-summary">
                    <div className="price-calc-row">
                      <span>{formatCurrency(listing.price_per_unit)} × {bookingDuration} {listing.unit_label}{bookingDuration > 1 ? 's' : ''}</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <hr className="calc-divider" />
                    <div className="price-calc-row total">
                      <span>Total Price</span>
                      <span data-testid="total-price-display">{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>

                  <CancellationPolicy listingId={listing.id} />

                  <button
                    type="submit"
                    disabled={isSubmitting || !!dateError || !bookingDate || !bookingTime}
                    className="btn-book-now"
                    data-testid="submit-booking-button"
                  >
                    {isSubmitting ? 'Submitting Request...' : 'Send Booking Request'}
                  </button>

                  {listing.type === 'service' && (
                    <button
                      type="button"
                      onClick={handleBundle}
                      className="btn-bundle-equipment"
                      data-testid="bundle-button"
                      style={{ marginTop: '0.75rem', width: '100%' }}
                    >
                      Bundle with Equipment
                    </button>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Provider Card */}
          <div className="provider-profile-card" data-testid="provider-card">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#4b5563' }}>Provider</h3>
            <div className="provider-card-header">
              <div className="provider-avatar-wrapper">
                <img
                  src={listing.provider_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'}
                  alt={listing.provider_name}
                  className="provider-avatar-img"
                  data-testid="provider-avatar"
                />
              </div>
              <div className="provider-identity-details">
                <h4 className="provider-name-title">
                  {listing.provider_id ? <Link to={`/providers/${listing.provider_id}`}>{listing.provider_name}</Link> : listing.provider_name}
                </h4>
                <span className="provider-subtitle">Verified Partner</span>
                {listing.provider_trust_score && (
                  <div className="provider-trust-score-badge" data-testid="provider-trust-badge">
                    <ShieldCheck size={14} />
                    Trust Score: {parseFloat(listing.provider_trust_score).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            <div className="provider-contact-info">
              <div className="provider-contact-row">
                <Phone size={14} />
                <span>{listing.provider_mobile}</span>
              </div>
              <div className="provider-contact-row">
                <Mail size={14} />
                <span>{listing.provider_email}</span>
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {listing.provider_id && <Link to={`/providers/${listing.provider_id}`} className="fx-link-btn" style={{ color: '#2563eb' }}>View provider profile</Link>}
              <ReportButton userId={listing.provider_id} userName={listing.provider_name} label="Report provider" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingDetailPage;
