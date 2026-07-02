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

      <div className="search-main-layout">
        {/* Sidebar Filters */}
        <aside className="search-sidebar">
          <div className="sidebar-header">
            <div className="title-wrapper">
              <SlidersHorizontal size={18} />
              <h2>Filters</h2>
            </div>
            {(searchParams.toString() !== '' && searchParams.toString() !== 'page=1') && (
              <button onClick={resetFilters} className="clear-all-btn">
                Clear All
              </button>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label">Listing Type</label>
            <div className="type-toggle-group">
              <button
                type="button"
                className={`type-btn ${currentType === '' ? 'active' : ''}`}
                onClick={() => updateFilter('type', '')}
              >
                All
              </button>
              <button
                type="button"
                className={`type-btn ${currentType === 'service' ? 'active' : ''}`}
                onClick={() => updateFilter('type', 'service')}
              >
                Services
              </button>
              <button
                type="button"
                className={`type-btn ${currentType === 'equipment' ? 'active' : ''}`}
                onClick={() => updateFilter('type', 'equipment')}
              >
                Equipment
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="category-select">Category</label>
            <select
              id="category-select"
              value={currentCategory}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="district-select">District</label>
            <select
              id="district-select"
              value={currentDistrict}
              onChange={(e) => updateFilter('district', e.target.value)}
              className="filter-select"
            >
              <option value="">All Districts</option>
              {DISTRICTS.map(dist => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Price Range (LKR)</label>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={currentMinPrice}
                onChange={(e) => updateFilter('priceMin', e.target.value)}
                className="price-input"
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                placeholder="Max"
                value={currentMaxPrice}
                onChange={(e) => updateFilter('priceMax', e.target.value)}
                className="price-input"
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Customer Rating</label>
            <div className="rating-filter-list">
              {renderStarRatingFilter()}
            </div>
          </div>
        </aside>

        {/* Content Section */}
        <main className="search-results-section">
          {/* Controls Bar */}
          <div className="results-controls-bar">
            <div className="results-count">
              {loading ? (
                <span>Finding items...</span>
              ) : (
                <span>Showing {totalCount} {totalCount === 1 ? 'result' : 'results'}</span>
              )}
            </div>
            <div className="sort-wrapper">
              <label htmlFor="sort-select">Sort By</label>
              <select
                id="sort-select"
                value={currentSort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="sort-select"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
              <button
                className="btn btn-outline map-toggle-btn"
                onClick={() => setShowMap(!showMap)}
                style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem' }}
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
          </div>

          {/* Active Badges */}
          {searchParams.toString() !== '' && searchParams.toString() !== 'page=1' && (
            <div className="active-badges-list">
              {currentType && (
                <span className="active-badge">
                  Type: {currentType}
                  <button onClick={() => updateFilter('type', '')}><X size={12} /></button>
                </span>
              )}
              {currentCategory && (
                <span className="active-badge">
                  Category: {categories.find(c => c.id === currentCategory)?.name || currentCategory}
                  <button onClick={() => updateFilter('category', '')}><X size={12} /></button>
                </span>
              )}
              {currentDistrict && (
                <span className="active-badge">
                  District: {currentDistrict}
                  <button onClick={() => updateFilter('district', '')}><X size={12} /></button>
                </span>
              )}
              {currentMinPrice && (
                <span className="active-badge">
                  Min: LKR {currentMinPrice}
                  <button onClick={() => updateFilter('priceMin', '')}><X size={12} /></button>
                </span>
              )}
              {currentMaxPrice && (
                <span className="active-badge">
                  Max: LKR {currentMaxPrice}
                  <button onClick={() => updateFilter('priceMax', '')}><X size={12} /></button>
                </span>
              )}
              {currentRating && (
                <span className="active-badge">
                  Rating: {currentRating}★+
                  <button onClick={() => updateFilter('rating', '')}><X size={12} /></button>
                </span>
              )}
            </div>
          )}

          {/* Results Grid or Skeleton or Empty */}
          {loading ? (
            <div className="listing-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="listing-card-skeleton">
                  <div className="skeleton-image pulsing" />
                  <div className="skeleton-content">
                    <div className="skeleton-row short pulsing" />
                    <div className="skeleton-row long pulsing" />
                    <div className="skeleton-row medium pulsing" />
                    <div className="skeleton-row short pulsing" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-results-container">
              <h3>No Listings Found</h3>
              <p>We couldn't find anything matching your filters. Try clearing some selections or modifying your keywords.</p>
              <button onClick={resetFilters} className="btn btn-primary reset-btn">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="results-wrapper">
              {showMap && isLoaded && (
                <div className="map-container" style={{ width: '100%', height: '400px', marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden' }}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={listings.length > 0 && listings[0].geo_lat ? { lat: parseFloat(listings[0].geo_lat), lng: parseFloat(listings[0].geo_lng) } : { lat: 7.8731, lng: 80.7718 }}
                    zoom={7}
                  >
                    {listings.map(item => (
                      item.geo_lat && item.geo_lng && (
                        <OverlayViewF
                          key={item.id}
                          position={{ lat: parseFloat(item.geo_lat), lng: parseFloat(item.geo_lng) }}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div 
                            title={item.title}
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
                              src={item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/40?text=Img'} 
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=Img'; }}
                            />
                          </div>
                        </OverlayViewF>
                      )
                    ))}
                  </GoogleMap>
                </div>
              )}
              <div className="listing-grid">
                {listings.map(item => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => updateFilter('page', String(currentPage - 1))}
                    className="pagination-btn arrow-btn"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateFilter('page', String(pageNum))}
                        className={`pagination-btn page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => updateFilter('page', String(currentPage + 1))}
                    className="pagination-btn arrow-btn"
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SearchPage;
