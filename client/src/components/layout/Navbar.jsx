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

