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

