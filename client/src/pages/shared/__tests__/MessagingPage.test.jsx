/**
 * @file MessagingPage.test.jsx
 * @module MessagingPageTest
 * @description Tests for the MessagingPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MessagingPage from '../MessagingPage.jsx';

describe('MessagingPage', () => {
  it('should render the messages heading', () => {
    render(<MemoryRouter><MessagingPage /></MemoryRouter>);
    expect(screen.getByText(/Messages/i)).toBeDefined();
  });
  it('should describe the messaging purpose', () => {
    render(<MemoryRouter><MessagingPage /></MemoryRouter>);
    expect(screen.getByText(/Communicate with/i)).toBeDefined();
  });
});
