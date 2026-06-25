/**
 * @file App.jsx
 * @module App
 *
 * @description
 * Root application component for Rentify. Defines all client-side routes using
 * React Router v6 and wraps them in the appropriate layout structure (Navbar, Footer).
 * Uses ProtectedRoute to guard role-specific pages (consumer, provider, admin).
 * This is the single source of truth for the application's route table. Any new
 * pages must be registered here with the correct path, element, and access control.
 *
 * @dependencies
 * - react-router-dom: Routes, Route, Navigate for declarative routing
 * - ./components/layout/Navbar.jsx: Top navigation bar
 * - ./components/layout/Footer.jsx: Site footer
 * - ./components/common/ProtectedRoute.jsx: Role-based route guard
 * - ./pages/*: All page-level components
 *
 * @exports
 * - App: Root React component rendered by main.jsx
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- Layout Components ---
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// --- Auth Pages ---
import RegisterPage from './pages/auth/RegisterPage.jsx';
