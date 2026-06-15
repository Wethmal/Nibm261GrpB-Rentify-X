/**
 * @file NotFoundPage.test.jsx
 * @module NotFoundPageTest
 * @description Tests for the NotFoundPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage.jsx';

describe('NotFoundPage', () => {
  it('should render the 404 heading', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText(/404/i)).toBeDefined();
  });
  it('should provide a link back to home', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
    expect(screen.getByText(/Go back to Home/i)).toBeDefined();
  });
});
