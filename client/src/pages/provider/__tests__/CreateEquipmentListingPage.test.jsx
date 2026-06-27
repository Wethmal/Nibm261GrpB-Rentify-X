/**
 * @file CreateEquipmentListingPage.test.jsx
 * @module CreateEquipmentListingPageTest
 * @description Tests for the CreateEquipmentListingPage component.
 * @dependencies vitest, @testing-library/react, react-router-dom, ../CreateEquipmentListingPage.jsx
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateEquipmentListingPage from '../CreateEquipmentListingPage.jsx';

describe('CreateEquipmentListingPage', () => {
  it('should render the create equipment listing heading', () => {
    render(<MemoryRouter><CreateEquipmentListingPage /></MemoryRouter>);
    expect(screen.getByText(/Create Equipment Listing/i)).toBeDefined();
  });
  it('should display equipment-specific guidance', () => {
    render(<MemoryRouter><CreateEquipmentListingPage /></MemoryRouter>);
    expect(screen.getByText(/cameras, drones, tools/i)).toBeDefined();
  });
  // TODO: Add test for equipment-specific form fields (condition, quantity)
});
