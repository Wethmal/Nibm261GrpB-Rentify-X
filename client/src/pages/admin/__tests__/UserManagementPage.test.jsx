/**
 * @file UserManagementPage.test.jsx
 * @module UserManagementPageTest
 * @description Tests for the UserManagementPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserManagementPage from '../UserManagementPage.jsx';

describe('UserManagementPage', () => {
  it('should render the user management heading', () => {
    render(<MemoryRouter><UserManagementPage /></MemoryRouter>);
    expect(screen.getByText(/User Management/i)).toBeDefined();
  });
  it('should describe the page purpose', () => {
    render(<MemoryRouter><UserManagementPage /></MemoryRouter>);
    expect(screen.getByText(/Search, view, and manage/i)).toBeDefined();
  });
});
