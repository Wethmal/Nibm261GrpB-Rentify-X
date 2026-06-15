/**
 * @file HomePage.jsx
 * @module HomePage
 * @description Landing page for the Rentify consumer experience. Matches the custom mockup design.
 * @dependencies react, react-router-dom, lucide-react, ./HomePage.css
 * @exports HomePage: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Briefcase, Laptop, Sofa, Shirt, Cog, Search, MapPin, Heart, User } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance.js';
import { getListingCoverImage } from '../../utils/imageHelper.js';
import './HomePage.css';

const getCategoryIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('property') || lower.includes('properties')) return <Home size={28} />;
  if (lower.includes('service')) return <User size={28} />;
  if (lower.includes('electronic')) return <Laptop size={28} />;
  if (lower.includes('furnitur')) return <Sofa size={28} />;
  if (lower.includes('cloth')) return <Shirt size={28} />;
  if (lower.includes('machiner') || lower.includes('tool')) return <Cog size={28} />;
  return <Search size={28} />;
};

function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState({});
  const [latestItems, setLatestItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    const fetchLatestItems = async () => {
      try {
        const res = await axiosInstance.get('/search', { params: { limit: 8, sort_by: 'newest' } });
        if (res.data && res.data.results) {
          setLatestItems(res.data.results);
        }
      } catch (err) {
        console.error('Error fetching latest items:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/search/categories');
        if (res.data && res.data.status !== 'stub') {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCats(false);
      }
    };
    
    fetchLatestItems();
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    let path = `/search?q=${encodeURIComponent(searchQuery)}`;
    if (selectedCategory !== 'All') {
      path += `&category=${selectedCategory}`;
    }
    navigate(path);
  };

  const handleCategoryClick = (catId) => {
    navigate(`/search?category=${catId}`);
  };

  const toggleFavorite = (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getPhotoUrl = (item) => {
    return getListingCoverImage(item);
  };

  return (
    <div className="home-page">
      {/* Hero Banner Section */}
      <section className="home-hero">
        <div className="home-hero__overlay"></div>
        <div className="home-hero__content">
          <h1 className="home-hero__title">If it's for rent, it's on Rentify</h1>

          {/* Search bar wrapper */}
          <form onSubmit={handleSearchSubmit} className="home-hero__search-form">
            <div className="home-hero__search-container">
              <div className="home-hero__select-wrapper">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="home-hero__select"
                  aria-label="Select Category"
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="home-hero__input-wrapper">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="home-hero__input"
                  aria-label="Search query"
                />
              </div>
              <button type="submit" className="home-hero__btn-search">
                <Search size={16} style={{ marginRight: '6px' }} />
                Search
              </button>
            </div>
          </form>

          <h2 className="home-hero__subtitle">Find the best rentals around</h2>
          <p className="home-hero__description">Whatever you need, rent it with ease. Discover verified services and equipment rentals across Sri Lanka.</p>
        </div>
      </section>

      {/* Top Categories showcase */}
      <section className="categories-section">
        <h3 className="section-title">Top Categories</h3>
        <div className="categories-grid">
          {loadingCats ? (
            <div style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', padding: '1rem' }}>Loading categories...</div>
          ) : (
            categories.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="category-card"
              >
                <div className="category-card__icon">
                  {getCategoryIcon(cat.name)}
                </div>
                <span className="category-card__name">{cat.name}</span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Latest Items Showcase */}
      <section className="latest-section">
        <h3 className="section-title">Latest Items</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>Loading latest items...</div>
        ) : latestItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>No items found.</div>
        ) : (
          <div className="listings-grid">
            {latestItems.map((item) => {
              const photoUrl = getPhotoUrl(item);
              const priceText = `Rs. ${Number(item.price_per_unit).toLocaleString()} / ${item.unit_label || 'unit'}`;
              const badgeText = item.type === 'service' ? 'Service' : (item.condition ? `${item.condition.toUpperCase()} | Qty: ${item.quantity || 1}` : 'Equipment');

              return (
                <div key={item.id} className="latest-item-card">
                  <Link to={`/listings/${item.id}`} className="latest-item-card__link">
                    <div className="latest-item-card__image-wrapper">
                      <img
                        src={photoUrl}
                        alt={item.title}
                        className="latest-item-card__image"
                        onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }}
                      />
                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`latest-item-card__favorite ${favorites[item.id] ? 'favorited' : ''}`}
                        aria-label="Add to favorites"
                      >
                        <Heart size={18} fill={favorites[item.id] ? '#ef4444' : 'none'} stroke={favorites[item.id] ? '#ef4444' : '#6b7280'} />
                      </button>
                    </div>
                    <div className="latest-item-card__info">
                      <h4 className="latest-item-card__title">{item.title}</h4>

                      <p className="latest-item-card__details">{badgeText}</p>

                      <p className="latest-item-card__price">{priceText}</p>

                      <p className="latest-item-card__location">
                        <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {item.district}
                      </p>

                      <div className="latest-item-card__footer">
                        <span className="latest-item-card__category-badge">{item.type}</span>
                        <span className="latest-item-card__details-link">View Details</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
