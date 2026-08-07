/**
 * @file ListingCard.jsx
 * @module ListingCard
 * @description Reusable listing card component displaying a summary of a service or equipment listing. Shows the primary photo, title, provider name, price, district, average rating, and listing type badge. Clickable — navigates to the listing detail page. Used inside ListingGrid on search results and home page.
 * @dependencies react, react-router-dom, ../../utils/formatters.js, ../common/Badge.jsx
 * @exports ListingCard: React functional component
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters.js';
import { getListingCoverImage } from '../../utils/imageHelper.js';

function ListingCard({ listing = {} }) {
  const {
    id,
    title = 'Untitled Listing',
    type = 'service',
    price_per_unit,
    pricePerUnit,
    unit_label,
    unitLabel,
    photos = [],
    district = 'Sri Lanka',
    rating = 0,
    average_rating,
    provider_name,
    providerName,
    condition,
    averageRating,
    provider_id
  } = listing;
  const navigate = useNavigate();

  const price = price_per_unit !== undefined ? price_per_unit : pricePerUnit;
  const unit = unit_label !== undefined ? unit_label : unitLabel;
  const provider = provider_name !== undefined ? provider_name : providerName;
  const ratingValue = average_rating !== undefined ? average_rating : (averageRating || 0);

  const photoUrl = getListingCoverImage(listing);

  // Visual star representation
  const numericRating = Number(ratingValue) || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={`star ${i <= Math.round(numericRating) ? 'star--filled' : 'star--empty'}`}>
        ★
      </span>
    );
  }

  return (
    <div className={`listing-card listing-card--${type}`}>
      <Link to={`/listings/${id || '#'}`} className="listing-card__link">
        <div className="listing-card__image-container">
          <img src={photoUrl} alt={title} className="listing-card__image" onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=No+Image'; }} />
          <span className={`listing-card__type-badge listing-card__type-badge--${type}`}>{type}</span>
          {condition && <span className={`listing-card__condition-badge listing-card__condition-badge--${condition.toLowerCase()}`}>{condition}</span>}
        </div>
        <div className="listing-card__content">
          <div className="listing-card__header">
            <span className="listing-card__district">{district}</span>
            <div className="listing-card__rating">
              {stars}
              <span className="listing-card__rating-text">({numericRating.toFixed(1)})</span>
            </div>
          </div>
          <h3 className="listing-card__title">{title}</h3>
          <div className="listing-card__provider">
            By{' '}
            {provider_id ? (
              <span
                className="listing-card__provider-name"
                role="link"
                tabIndex={0}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/providers/${provider_id}`); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); navigate(`/providers/${provider_id}`); } }}
              >
                {provider || 'Verified Partner'}
              </span>
            ) : (
              <span className="listing-card__provider-name">{provider || 'Verified Partner'}</span>
            )}
          </div>
          <div className="listing-card__footer">
            <div className="listing-card__price-container">
              <span className="listing-card__price">{formatCurrency(price)}</span>
              <span className="listing-card__unit"> / {unit || 'unit'}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ListingCard;
