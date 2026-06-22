/**
 * @file ProfilePage.test.jsx
 * @module ProfilePageTest
 * @description Tests for the ProfilePage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../ProfilePage.jsx';

// Mock useAuth
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      full_name: 'Sasundul Nirodhana',
      email: 'sasuduln@gmail.com',
      role: 'consumer'
    },
    isAuthenticated: true
  })
}));

// Mock axiosInstance
vi.mock('../../../api/axiosInstance.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 'u1',
        full_name: 'Sasundul Nirodhana',
        email: 'sasuduln@gmail.com',
        role: 'consumer',
        bio: 'Freelance photographer...',
        address: '45 Flower Road, Colombo 07',
        mobile: '0771234567',
        trust_score: 4.8,
        visibility_settings: { mobile: true, address: true }
      }
    }),
    post: vi.fn().mockResolvedValue({ data: { url: 'https://example.com/new-avatar.png' } }),
    put: vi.fn().mockResolvedValue({ data: {} })
  }
}));

// Mock useBlocker
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useBlocker: () => ({ state: 'unblocked' })
  };
});

describe('ProfilePage', () => {
  it('should render the profile page heading', async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/Profile & Settings/i)).toBeDefined();
    });
  });
  it('should display profile update description', async () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/Manage your public profile/i)).toBeDefined();
    });
  });
});
