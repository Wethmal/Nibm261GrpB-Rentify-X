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

