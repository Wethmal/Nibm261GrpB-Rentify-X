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
import LoginPage from './pages/auth/LoginPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';

// --- Consumer Pages ---
import HomePage from './pages/consumer/HomePage.jsx';
import SearchPage from './pages/consumer/SearchPage.jsx';
import ListingDetailPage from './pages/consumer/ListingDetailPage.jsx';
import BookingHistoryPage from './pages/consumer/BookingHistoryPage.jsx';
import BundleBookingPage from './pages/consumer/BundleBookingPage.jsx';
import ProviderProfilePage from './pages/consumer/ProviderProfilePage.jsx';

// --- Provider Pages ---
import ProviderDashboardPage from './pages/provider/ProviderDashboardPage.jsx';
import CreateServiceListingPage from './pages/provider/CreateServiceListingPage.jsx';
import CreateEquipmentListingPage from './pages/provider/CreateEquipmentListingPage.jsx';
import AvailabilityCalendarPage from './pages/provider/AvailabilityCalendarPage.jsx';
import BookingRequestsPage from './pages/provider/BookingRequestsPage.jsx';
import ProviderEarningsPage from './pages/provider/ProviderEarningsPage.jsx';

// --- Admin Pages ---
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import ProviderApprovalPage from './pages/admin/ProviderApprovalPage.jsx';
import NICVerificationPage from './pages/admin/NICVerificationPage.jsx';
import ListingModerationPage from './pages/admin/ListingModerationPage.jsx';
import UserManagementPage from './pages/admin/UserManagementPage.jsx';
import DisputesPage from './pages/admin/DisputesPage.jsx';
import CategoryManagementPage from './pages/admin/CategoryManagementPage.jsx';
import ReportsPage from './pages/admin/ReportsPage.jsx';

// --- Shared Pages ---
import ProfilePage from './pages/shared/ProfilePage.jsx';
import MessagingPage from './pages/shared/MessagingPage.jsx';
import NotificationsPage from './pages/shared/NotificationsPage.jsx';

// --- Error Pages ---
import NotFoundPage from './pages/errors/NotFoundPage.jsx';
import UnauthorizedPage from './pages/errors/UnauthorizedPage.jsx';

function App() {
  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main className="app__content" style={{ flex: 1 }}>
        <Routes>
          {/* ======================== Public Routes ======================== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/providers/:id" element={<ProviderProfilePage />} />

          {/* =================== Authenticated Routes ==================== */}
          {/* Consumer */}
          <Route path="/bookings" element={<ProtectedRoute><BookingHistoryPage /></ProtectedRoute>} />
          <Route path="/bundle-booking" element={<ProtectedRoute allowedRoles={['consumer']}><BundleBookingPage /></ProtectedRoute>} />

          {/* Provider */}
          <Route path="/provider/dashboard" element={<ProtectedRoute allowedRoles={['provider']}><ProviderDashboardPage /></ProtectedRoute>} />
          <Route path="/provider/listings/new/service" element={<ProtectedRoute allowedRoles={['provider']}><CreateServiceListingPage /></ProtectedRoute>} />
          <Route path="/provider/listings/new/equipment" element={<ProtectedRoute allowedRoles={['provider']}><CreateEquipmentListingPage /></ProtectedRoute>} />
          <Route path="/provider/availability" element={<ProtectedRoute allowedRoles={['provider']}><AvailabilityCalendarPage /></ProtectedRoute>} />
          <Route path="/provider/earnings" element={<ProtectedRoute allowedRoles={['provider']}><ProviderEarningsPage /></ProtectedRoute>} />
          <Route path="/provider/booking-requests" element={<ProtectedRoute allowedRoles={['provider']}><BookingRequestsPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/provider-approvals" element={<ProtectedRoute allowedRoles={['admin']}><ProviderApprovalPage /></ProtectedRoute>} />
          <Route path="/admin/nic-verification" element={<ProtectedRoute allowedRoles={['admin']}><NICVerificationPage /></ProtectedRoute>} />
          <Route path="/admin/listing-moderation" element={<ProtectedRoute allowedRoles={['admin']}><ListingModerationPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
          <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={['admin']}><DisputesPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><CategoryManagementPage /></ProtectedRoute>} />

          {/* Shared (any authenticated user) */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

