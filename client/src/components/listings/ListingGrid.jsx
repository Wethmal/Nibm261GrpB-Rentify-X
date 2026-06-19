/**
 * @file ListingGrid.jsx
 * @module ListingGrid
 * @description Grid container component for displaying multiple ListingCard components. Renders a responsive CSS grid that adapts from 1 column on mobile to 2-3-4 columns on larger screens. Handles empty state and loading state display. Used on SearchPage, HomePage, and provider listing management views.
 * @dependencies react, ./ListingCard.jsx, ../common/Spinner.jsx
 * @exports ListingGrid: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';
import ListingCard from './ListingCard.jsx';

function ListingGrid({ listings = [], loading = false, emptyMessage = 'No listings found.' }) {
  // TODO: Show Spinner component when loading is true
  // TODO: Show empty state message when listings array is empty and not loading
  // TODO: Render ListingCard for each listing in a responsive grid layout
  // TODO: Apply CSS grid: 1 col (mobile), 2 col (tablet), 3-4 col (desktop)

  if (loading) {
    return <div className="listing-grid listing-grid--loading"><p>Loading listings...</p></div>;
  }

  if (!listings || listings.length === 0) {
    return <div className="listing-grid listing-grid--empty"><p>{emptyMessage}</p></div>;
  }

  return (
    <div className="listing-grid">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id || index} listing={listing} />
      ))}
    </div>
  );
}

export default ListingGrid;
