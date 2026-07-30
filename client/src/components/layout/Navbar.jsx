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

