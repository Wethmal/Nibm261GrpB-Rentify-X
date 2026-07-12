/**
 * @file NICVerificationPage.test.jsx
 * @module NICVerificationPageTest
 * @description Tests for the NICVerificationPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NICVerificationPage from '../NICVerificationPage.jsx';

describe('NICVerificationPage', () => {
  it('should render the NIC verification heading', () => {
    render(<MemoryRouter><NICVerificationPage /></MemoryRouter>);
    expect(screen.getByText(/NIC Verification/i)).toBeDefined();
  });
  it('should describe the verification purpose', () => {
    render(<MemoryRouter><NICVerificationPage /></MemoryRouter>);
    expect(screen.getByText(/Review and verify/i)).toBeDefined();
  });
});
