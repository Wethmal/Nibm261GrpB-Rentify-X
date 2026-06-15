/**
 * @file UnauthorizedPage.test.jsx
 * @module UnauthorizedPageTest
 * @description Tests for the UnauthorizedPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnauthorizedPage from '../UnauthorizedPage.jsx';

describe('UnauthorizedPage', () => {
  it('should render the access denied heading', () => {
    render(<MemoryRouter><UnauthorizedPage /></MemoryRouter>);
    expect(screen.getByText(/Access Denied/i)).toBeDefined();
  });
  it('should provide a sign-in link', () => {
    render(<MemoryRouter><UnauthorizedPage /></MemoryRouter>);
    expect(screen.getByText(/Sign in/i)).toBeDefined();
  });
});
