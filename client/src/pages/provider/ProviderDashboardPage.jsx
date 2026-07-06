/**
 * @file ProviderDashboardPage.jsx
 * @module ProviderDashboardPage
 *
 * @description
 * Provider dashboard page for Rentify (US014). Displays an overview of the provider's
 * upcoming bookings, availability summary, recent booking requests, earnings snapshot,
 * and quick-action links (create listing, manage availability). Aggregates data from
 * multiple API endpoints to present a unified operational view for service providers
 * and equipment owners.
 *
 * @dependencies
 * - react: useState, useEffect for data fetching
 * - ../../api/axiosInstance.js: Fetch dashboard data from backend
 * - ../../hooks/useAuth.js: Get current provider user
 * - ../../utils/formatters.js: Date and currency formatting
 * - ../../components/common/Badge.jsx: Status badges for bookings
 *
 * @exports
 * - ProviderDashboardPage: React functional component for the provider dashboard
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Trash2, ExternalLink, X, CheckCircle, AlertCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import './ProviderDashboardPage.css';

import { useAuth } from '../../hooks/useAuth';
import EarningsWidget from '../../components/provider/EarningsWidget';
import ListingPolicyControl from '../../components/provider/ListingPolicyControl';

function ProviderDashboardPage() {
  const { user } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [stats, setStats] = useState({ totalUpcoming: 0, pendingRequests: 0, totalEarnings: 0, activeListingsCount: 0, pendingListingsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit/Delete & Pagination state
  const [editingListing, setEditingListing] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price_per_unit: '',
    unit_label: 'day',
    status: 'active',
    district: 'Colombo',
    geo_lat: '',
    geo_lng: '',
    photos: []
  });
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const listingsPerPage = 3;

  const SRI_LANKA_DISTRICTS = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha',
    'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala',
    'Mannar', 'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya',
    'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
  ];

