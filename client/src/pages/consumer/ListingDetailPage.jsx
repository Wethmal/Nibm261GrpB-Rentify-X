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

