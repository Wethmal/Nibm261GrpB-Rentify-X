/**
 * @file SearchPage.jsx
 * @module SearchPage
 * @description Search and discovery page for Rentify (US009). Supports full-text search, categories, districts, pricing ranges, rating thresholds, type toggles, and sorting options. Synchronizes state to URL search parameters.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance.js';
import ListingCard from '../../components/listings/ListingCard.jsx';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import './SearchPage.css';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

const DEFAULT_CATEGORIES = [
  { id: 'plumbing-cat', name: 'Plumbing', type: 'service' },
  { id: 'cleaning-cat', name: 'Cleaning', type: 'service' },
  { id: 'tutoring-cat', name: 'Education & Tutoring', type: 'service' },
  { id: 'camera-cat', name: 'Photography & Videography', type: 'equipment' },
  { id: 'tools-cat', name: 'Construction Tools', type: 'equipment' },
  { id: 'sound-cat', name: 'Sound Systems', type: 'equipment' },
];

import { GoogleMap, useJsApiLoader, Marker, OverlayView, OverlayViewF } from '@react-google-maps/api';
import LocationSearch from '../../components/listings/LocationSearch';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Keyword input state
  const [keywordInput, setKeywordInput] = useState(searchParams.get('q') || '');

  // Core filters/search state
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

