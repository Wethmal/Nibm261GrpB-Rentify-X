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

