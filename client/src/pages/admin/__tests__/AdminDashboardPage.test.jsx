/**
 * @file AdminDashboardPage.test.jsx
 * @module AdminDashboardPageTest
 * @description Tests for the AdminDashboardPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '../AdminDashboardPage.jsx';

describe('AdminDashboardPage', () => {
  it('should render the admin dashboard heading', () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    expect(screen.getByText(/Admin Dashboard/i)).toBeDefined();
  });
  it('should display analytics description', () => {
    render(<MemoryRouter><AdminDashboardPage /></MemoryRouter>);
    expect(screen.getByText(/Platform analytics/i)).toBeDefined();
  });
});
