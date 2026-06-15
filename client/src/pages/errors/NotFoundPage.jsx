/**
 * @file NotFoundPage.jsx
 * @module NotFoundPage
 * @description 404 Not Found error page. Displayed when users navigate to a route that doesn't exist. Provides a friendly message and a link back to the home page. Catches all unmatched routes via the "*" route in App.jsx.
 * @dependencies react, react-router-dom
 * @exports NotFoundPage: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  // TODO: Style with a large 404 visual, friendly error message, and illustration
  // TODO: Add search bar so users can try finding what they were looking for
  // TODO: Track 404 hits for analytics (optional)
  return (
    <div className="not-found-page">
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <Link to="/">Go back to Home</Link>
    </div>
  );
}

export default NotFoundPage;
