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

