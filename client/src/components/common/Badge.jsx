/**
 * @file Badge.jsx
 * @module Badge
 * @description Status badge component for displaying entity states. Renders a small colored label based on status value (e.g., Pending → yellow, Verified → green, Suspended → red, Active → blue). Used throughout Rentify for booking statuses, user verification, listing states, and payment statuses.
 * @dependencies react
 * @exports Badge: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';

function Badge({ status, className = '' }) {
  // TODO: Map status strings to color classes:
  //   pending, pending_verification, pending_approval, pending_moderation → yellow/amber
  //   verified, active, confirmed, approved, released → green
  //   suspended, cancelled, rejected → red
  //   banned, failed → dark red
  //   completed, escrowed → blue
  //   disputed → orange
  // TODO: Capitalize the status text for display
  // TODO: Consider adding an optional icon before the text
  const statusClass = status ? status.toLowerCase().replace(/\s+/g, '-') : 'default';

  return (
    <span className={`badge badge--${statusClass} ${className}`}>
      {status || 'Unknown'}
    </span>
  );
}

export default Badge;
