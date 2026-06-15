/**
 * @file UnauthorizedPage.jsx
 * @module UnauthorizedPage
 * @description 401/403 Unauthorized access page. Displayed when users attempt to access a route they don't have permission for (wrong role or not authenticated). Provides a message and links to login or home page.
 * @dependencies react, react-router-dom
 * @exports UnauthorizedPage: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';
import { Link } from 'react-router-dom';

function UnauthorizedPage() {
  // TODO: Differentiate between 401 (not logged in) and 403 (wrong role)
  // TODO: Show appropriate message based on auth state
  // TODO: If not logged in, show "Please log in" with link to /login
  // TODO: If wrong role, show "You don't have permission" with link to appropriate dashboard
  return (
    <div className="unauthorized-page">
      <h1>Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      <Link to="/login">Sign in to your account</Link>
      {' | '}
      <Link to="/">Go to Home</Link>
    </div>
  );
}

export default UnauthorizedPage;
