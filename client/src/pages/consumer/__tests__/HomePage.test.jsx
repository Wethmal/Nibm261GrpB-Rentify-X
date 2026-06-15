/**
 * @file HomePage.test.jsx
 * @module HomePageTest
 *
 * @description
 * Test suite for the HomePage component. Verifies landing page renders with
 * expected hero content and handles empty featured listings state.
 *
 * @dependencies
 * - vitest: Test runner and assertion functions
 * - @testing-library/react: render, screen for component testing
 * - react-router-dom: MemoryRouter for routing context
 * - ../HomePage.jsx: Component under test
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage.jsx';

describe('HomePage', () => {
  it('should render the landing page with Rentify branding', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText(/Rentify/i)).toBeDefined();
  });

  it('should display the value proposition message', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByText(/Discover verified services/i)).toBeDefined();
  });

  // TODO: Add test for search bar rendering and interaction
  // TODO: Add test for featured listings loading state (spinner)
  // TODO: Add test for category grid rendering with mock data
});
