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

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  // Sync keyword input if URL changes directly
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== keywordInput) {
      setKeywordInput(urlQ);
    }
  }, [searchParams]);

  // Debounce search query updates to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (keywordInput.trim()) {
          newParams.set('q', keywordInput);
        } else {
          newParams.delete('q');
        }
        newParams.set('page', '1');
        return newParams;
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [keywordInput, setSearchParams]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/search/categories');
        if (res.data && res.data.status !== 'stub') {
          setCategories(res.data);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        setCategories(DEFAULT_CATEGORIES);
      }
    };
    fetchCategories();
  }, []);

  // Fetch search results when parameters change
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const params = Object.fromEntries(searchParams.entries());
      const page = parseInt(params.page, 10) || 1;
      const limit = 12;

      try {
        const nearby = params.lat && params.lng;
        const res = nearby
          ? await axiosInstance.get('/search/nearby', { params: { lat: params.lat, lng: params.lng, radius: params.radius || 25 } })
          : await axiosInstance.get('/search', { params });
        if (res.data) {
          setListings(res.data.results || []);
          setTotalCount(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  // Helper to update specific filters in the URL
  const updateFilter = (key, value) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      newParams.set('page', '1'); // reset page
      return newParams;
    });
  };

  // Geo search (US10): stored in the URL so results are shareable
  const setLocation = ({ lat, lng, label }) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('lat', String(lat));
      p.set('lng', String(lng));
      p.set('near', label || 'Selected location');
      if (!p.get('radius')) p.set('radius', '25');
      p.set('page', '1');
      return p;
    });
  };
  const clearLocation = () => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      ['lat', 'lng', 'near', 'radius'].forEach((k) => p.delete(k));
      return p;
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setKeywordInput('');
    setSearchParams(new URLSearchParams());
  };

  // Current filter values from URL params
  const currentCategory = searchParams.get('category') || '';
  const currentDistrict = searchParams.get('district') || '';
  const currentType = searchParams.get('type') || '';
  const currentMinPrice = searchParams.get('priceMin') || '';
  const currentMaxPrice = searchParams.get('priceMax') || '';
  const currentRating = searchParams.get('rating') || '';
  const currentSort = searchParams.get('sort') || 'relevance';
  const currentPage = parseInt(searchParams.get('page'), 10) || 1;

  // Star filter helper
  const renderStarRatingFilter = () => {
    const starOptions = [5, 4, 3, 2, 1];
    return starOptions.map(ratingVal => (
      <button
        key={ratingVal}
        type="button"
        className={`star-filter-btn ${currentRating === String(ratingVal) ? 'active' : ''}`}
        onClick={() => updateFilter('rating', currentRating === String(ratingVal) ? '' : String(ratingVal))}
      >
        <span className="stars-wrapper">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={i < ratingVal ? 'star-icon filled' : 'star-icon'}
            />
          ))}
        </span>
        <span className="rating-label">& Up</span>
      </button>
    ));
  };

  return (
    <div className="search-page-container">
      {/* Header Search Section */}
      <div className="search-hero">
        <div className="search-hero__content">
          <h1>Search Results</h1>
          <p>Find the perfect service or equipment for your needs.</p>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by keywords (e.g. plumber, camera)..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="search-input-field"
            />
            {keywordInput && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setKeywordInput('')}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <LocationSearch
            active={searchParams.get('lat') ? (searchParams.get('near') || 'Selected location') : ''}
            radius={Number(searchParams.get('radius')) || 25}
            onLocation={setLocation}
            onRadius={(r) => updateFilter('radius', String(r))}
            onClear={clearLocation}
          />
        </div>
      </div>

