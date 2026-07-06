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

  const totalPages = Math.ceil(myListings.length / listingsPerPage) || 1;
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * listingsPerPage;
    return myListings.slice(startIndex, startIndex + listingsPerPage);
  }, [myListings, currentPage, listingsPerPage]);

  const handleDeleteListing = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingId(listingId);
      await axiosInstance.delete(`/listings/${listingId}`);
      setMyListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err) {
      console.error('Failed to delete listing:', err);
      alert(err.response?.data?.message || 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = (listing) => {
    setEditingListing(listing);
    setEditFormData({
      title: listing.title || '',
      description: listing.description || '',
      price_per_unit: listing.price_per_unit || '',
      unit_label: listing.unit_label || 'day',
      status: listing.status || 'active',
      district: listing.district || 'Colombo',
      geo_lat: listing.geo_lat || '',
      geo_lng: listing.geo_lng || '',
      photos: Array.isArray(listing.photos) ? [...listing.photos] : []
    });
  };

  const DISTRICT_COORDINATES = {
    Colombo: { lat: 6.9271, lng: 79.8612 },
    Gampaha: { lat: 7.0840, lng: 80.0098 },
    Kalutara: { lat: 6.5854, lng: 79.9607 },
    Kandy: { lat: 7.2906, lng: 80.6337 },
    Matale: { lat: 7.4675, lng: 80.6234 },
    'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
    Galle: { lat: 6.0535, lng: 80.2210 },
    Matara: { lat: 5.9549, lng: 80.5550 },
    Hambantota: { lat: 6.1429, lng: 81.1212 },
    Jaffna: { lat: 9.6615, lng: 80.0255 },
    Kilinochchi: { lat: 9.3803, lng: 80.3770 },
    Mannar: { lat: 8.9810, lng: 79.9044 },
    Vavuniya: { lat: 8.7542, lng: 80.4982 },
    Mullaitivu: { lat: 9.2671, lng: 80.8142 },
    Batticaloa: { lat: 7.7310, lng: 81.6747 },
    Ampara: { lat: 7.2912, lng: 81.6724 },
    Trincomalee: { lat: 8.5874, lng: 81.2152 },
    Kurunegala: { lat: 7.4863, lng: 80.3647 },
    Puttalam: { lat: 8.0362, lng: 79.8283 },
    Anuradhapura: { lat: 8.3114, lng: 80.4037 },
    Polonnaruwa: { lat: 7.9403, lng: 81.0188 },
    Badulla: { lat: 6.9934, lng: 81.0550 },
    Moneragala: { lat: 6.8728, lng: 81.3507 },
    Ratnapura: { lat: 6.6828, lng: 80.3992 },
    Kegalle: { lat: 7.2513, lng: 80.3464 }
  };

  const handleDetectGps = () => {
    const districtCoords = DISTRICT_COORDINATES[editFormData.district] || DISTRICT_COORDINATES.Colombo;
    
    if (!navigator.geolocation) {
      setEditFormData(prev => ({
        ...prev,
        geo_lat: districtCoords.lat.toString(),
        geo_lng: districtCoords.lng.toString()
      }));
      alert(`Set coordinates to ${editFormData.district} district center.`);
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditFormData(prev => ({
          ...prev,
          geo_lat: pos.coords.latitude.toFixed(6),
          geo_lng: pos.coords.longitude.toFixed(6)
        }));
        setDetectingGps(false);
      },
      (err) => {
        console.warn('Browser GPS unavailable, falling back to district center:', err);
        setEditFormData(prev => ({
          ...prev,
          geo_lat: districtCoords.lat.toString(),
          geo_lng: districtCoords.lng.toString()
        }));
        alert(`Could not access device GPS (Permission or Timeout). Auto-set coordinates to ${editFormData.district} district center.`);
        setDetectingGps(false);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  const handleRemovePhoto = (photoIndex) => {
    setEditFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== photoIndex)
    }));
  };

  const handleUploadNewPhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !editingListing) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));

      const res = await axiosInstance.post(`/listings/${editingListing.id}/photos`, formData);
      const newUrls = res.data.urls || res.data.photos || [];

      setEditFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newUrls]
      }));
    } catch (err) {
      console.error('Failed to upload photos to Cloudinary:', err);
      alert(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

