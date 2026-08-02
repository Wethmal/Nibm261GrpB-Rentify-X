/**
 * @file Navbar.jsx
 * @module Navbar
 * @description Top navigation bar component for Rentify. Displays the brand logo, category links, notification bell, user profile, and sign-in button.
 * @dependencies react, react-router-dom, ../../hooks/useAuth.js
 * @exports Navbar: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useRealtime } from '../../context/RealtimeContext.jsx';
import { Bell, Menu, X, User, LogOut, LayoutDashboard, Settings, Calendar } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getImageUrl = (url) => {
    if (!url || url === '/default-avatar.png') return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') 
      : 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Brand Logo */}
        <Link to="/" className="navbar__brand">
          Rentify<span className="navbar__brand-dot">.</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar__links-desktop">
          <Link to="/" className={`navbar__link ${isActive('/') ? 'active' : ''}`}>
            HOME
          </Link>
          <Link to="/search?type=properties" className="navbar__link">
            PROPERTIES
          </Link>
          <Link to="/search?type=service" className="navbar__link">
            SERVICES
          </Link>
          <Link to="/search?type=electronics" className="navbar__link">
            ELECTRONICS
          </Link>
          <Link to="/contact" className="navbar__link">
            CONTACT US
          </Link>
        </div>

        {/* Right Section: Auth State / Actions */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <div className="navbar__user-section">
              {/* Notification Bell */}
              <Link to="/notifications" className="navbar__action-btn" aria-label="Notifications">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="navbar__badge" data-testid="navbar-unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </Link>

              {/* User Dropdown Profile */}
              <div className="navbar__profile-dropdown-wrapper">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="navbar__profile-trigger"
                  data-testid="navbar-profile-trigger"
                  style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {getImageUrl(user?.profile_photo_url) ? (
                    <img
                      src={getImageUrl(user?.profile_photo_url)}
                      alt={user?.full_name || 'User Avatar'}
                      className="navbar__avatar-img"
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="navbar__avatar-img" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} />
                    </div>
                  )}
                </button>

                {showDropdown && (
                  <div className="navbar__profile-dropdown">
                    <div className="navbar__dropdown-header">
                      <p className="navbar__dropdown-name">{user?.full_name || 'Verified User'}</p>
                      <p className="navbar__dropdown-email">{user?.email}</p>
                      <p className="navbar__dropdown-role">{user?.role?.toUpperCase()}</p>
                    </div>
                    <hr className="navbar__dropdown-divider" />

                    <Link
                      to={user?.role === 'admin' ? '/admin/dashboard' : (user?.role === 'provider' ? '/provider/dashboard' : '/profile')}
                      onClick={() => setShowDropdown(false)}
                      className="navbar__dropdown-item"
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <Link
                      to="/bookings"
                      onClick={() => setShowDropdown(false)}
                      className="navbar__dropdown-item"
                    >
                      <Calendar size={16} />
                      My Bookings
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      className="navbar__dropdown-item"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <hr className="navbar__dropdown-divider" />
                    <button onClick={handleLogout} className="navbar__dropdown-item logout-btn">
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="navbar__btn-signin" data-testid="navbar-signin-button">
              Sign In
            </Link>
          )}

          {/* Mobile Hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="navbar__mobile-toggle"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="navbar__links-mobile">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`navbar__mobile-link ${isActive('/') ? 'active' : ''}`}>
            HOME
          </Link>
          <Link to="/search?type=properties" onClick={() => setMobileMenuOpen(false)} className="navbar__mobile-link">
            PROPERTIES
          </Link>
          <Link to="/search?type=service" onClick={() => setMobileMenuOpen(false)} className="navbar__mobile-link">
            SERVICES
          </Link>
          <Link to="/search?type=electronics" onClick={() => setMobileMenuOpen(false)} className="navbar__mobile-link">
            ELECTRONICS
          </Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="navbar__mobile-link">
            CONTACT US
          </Link>
          {!isAuthenticated && (
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="navbar__mobile-signin">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
