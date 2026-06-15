/**
 * @file DisputesPage.test.jsx
 * @module DisputesPageTest
 * @description Tests for the DisputesPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DisputesPage from '../DisputesPage.jsx';

describe('DisputesPage', () => {
  it('should render the disputes heading', () => {
    render(<MemoryRouter><DisputesPage /></MemoryRouter>);
    expect(screen.getByText(/Disputes/i)).toBeDefined();
  });
  it('should describe the resolution purpose', () => {
    render(<MemoryRouter><DisputesPage /></MemoryRouter>);
    expect(screen.getByText(/resolve booking disputes/i)).toBeDefined();
  });
});
