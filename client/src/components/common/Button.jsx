/**
 * @file Button.jsx
 * @module Button
 * @description Reusable button component with variant support (primary, secondary, danger, outline), loading state with spinner, disabled state, and size options (sm, md, lg). All interactive buttons across Rentify should use this component for visual consistency. Supports onClick handler and type attribute.
 * @dependencies react
 * @exports Button: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';

function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, type = 'button', onClick, className = '', ...rest }) {
  // TODO: Apply CSS classes based on variant (primary, secondary, danger, outline)
  // TODO: Apply size classes (sm, md, lg) for padding and font size
  // TODO: Show spinner animation when loading is true, hide button text
  // TODO: Disable the button when loading or disabled is true
  // TODO: Prevent double-click during loading state
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

export default Button;
