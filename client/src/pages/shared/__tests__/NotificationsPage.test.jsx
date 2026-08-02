/**
 * @file NotificationsPage.test.jsx
 * @module NotificationsPageTest
 * @description Tests for the NotificationsPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationsPage from '../NotificationsPage.jsx';

describe('NotificationsPage', () => {
  it('should render the notifications heading', () => {
    render(<MemoryRouter><NotificationsPage /></MemoryRouter>);
    expect(screen.getByText(/Notifications/i)).toBeDefined();
  });
  it('should describe what users will see', () => {
    render(<MemoryRouter><NotificationsPage /></MemoryRouter>);
    expect(screen.getByText(/Stay updated/i)).toBeDefined();
  });
});
