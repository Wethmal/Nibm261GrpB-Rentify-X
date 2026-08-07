/**
 * @file ListingModerationPage.test.jsx
 * @module ListingModerationPageTest
 * @description Tests for the ListingModerationPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ListingModerationPage from '../ListingModerationPage.jsx';

describe('ListingModerationPage', () => {
  it('should render the listing moderation heading', () => {
    render(<MemoryRouter><ListingModerationPage /></MemoryRouter>);
    expect(screen.getByText(/Listing Moderation/i)).toBeDefined();
  });
  it('should explain the moderation purpose', () => {
    render(<MemoryRouter><ListingModerationPage /></MemoryRouter>);
    expect(screen.getByText(/maintain platform quality/i)).toBeDefined();
  });
});
