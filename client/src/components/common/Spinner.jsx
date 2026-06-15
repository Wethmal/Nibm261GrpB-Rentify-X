/**
 * @file Spinner.jsx
 * @module Spinner
 * @description Loading spinner component for indicating async operations in progress. Renders a CSS-animated spinner with optional size (sm, md, lg) and color variants. Used as a loading indicator across all data-fetching pages and components in Rentify.
 * @dependencies react
 * @exports Spinner: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';

function Spinner({ size = 'md', className = '' }) {
  // TODO: Implement CSS animation for rotating spinner
  // TODO: Support sizes: sm (16px), md (32px), lg (48px)
  // TODO: Consider adding an optional message prop ("Loading listings...")
  // TODO: Use aria-label for screen readers
  return (
    <div className={`spinner spinner--${size} ${className}`} role="status" aria-label="Loading">
      <span className="spinner__circle"></span>
    </div>
  );
}

export default Spinner;
