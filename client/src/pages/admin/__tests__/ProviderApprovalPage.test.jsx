/**
 * @file ProviderApprovalPage.test.jsx
 * @module ProviderApprovalPageTest
 * @description Tests for the ProviderApprovalPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProviderApprovalPage from '../ProviderApprovalPage.jsx';

describe('ProviderApprovalPage', () => {
  it('should render the provider approvals heading', () => {
    render(<MemoryRouter><ProviderApprovalPage /></MemoryRouter>);
    expect(screen.getByText(/Provider Approvals/i)).toBeDefined();
  });
  it('should display approval guidance text', () => {
    render(<MemoryRouter><ProviderApprovalPage /></MemoryRouter>);
    expect(screen.getByText(/Review and approve/i)).toBeDefined();
  });
});
