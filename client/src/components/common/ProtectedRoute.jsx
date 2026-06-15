/**
 * @file ProtectedRoute.jsx
 * @module ProtectedRoute
 * @description Higher-order route guard component that restricts access based on authentication status and user role. Wraps route elements and checks the AuthContext. If not authenticated, redirects to /login. If authenticated but wrong role, redirects to /unauthorized. Used in App.jsx to protect consumer, provider, and admin routes.
 * @dependencies react, react-router-dom, ../../hooks/useAuth.js
 * @exports ProtectedRoute: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // TODO: Show a loading spinner while auth state is initializing
  if (loading) {
    return <div>Loading...</div>;
  }

  // TODO: If not authenticated, redirect to /login and preserve the intended destination
  //       so user can be redirected back after login (use location state)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // TODO: If authenticated but user's role is not in allowedRoles, redirect to /unauthorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
