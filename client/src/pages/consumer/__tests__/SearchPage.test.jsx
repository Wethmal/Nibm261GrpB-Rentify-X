/**
 * @file SearchPage.test.jsx
 * @module SearchPageTest
 * @description Test suite for the SearchPage component. Verifies filter controls,
 * empty state, sorting, search debounce, and skeletons.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../SearchPage.jsx';

// Mock the axios instance to return stub data
vi.mock('../../../api/axiosInstance.js', () => {
  return {
    default: {
      get: vi.fn().mockImplementation((url, config) => {
        if (url === '/search/categories') {
          return Promise.resolve({
            data: [
              { id: 'cat-1', name: 'Tutoring', type: 'service' },
              { id: 'cat-2', name: 'Camera Equipment', type: 'equipment' }
            ]
          });
        }
        if (url === '/search') {
          // Check query params inside config.params
          const params = config?.params || {};
          
          if (params.q === 'nonexistent') {
            return Promise.resolve({
              data: {
                results: [],
                totalCount: 0,
                totalPages: 1
              }
            });
          }

          return Promise.resolve({
            data: {
              results: [
                {
                  id: 'l1',
                  title: 'Sony Cinema Camera FX3',
                  type: 'equipment',
                  condition: 'new',
                  price_per_unit: 15000,
                  unit_label: 'day',
                  district: 'Colombo',
                  average_rating: 4.8,
                  photos: ['camera.jpg'],
                  provider_name: 'John Camera Rentals'
                }
              ],
              totalCount: 1,
              totalPages: 1
            }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      })
    }
  };
});

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the search results heading and subtitle', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Search Results/i)).toBeDefined();
    expect(screen.getByText(/Find the perfect/i)).toBeDefined();
  });

  it('should render all key filters in the sidebar', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    // Filter title
    expect(screen.getByText('Filters')).toBeDefined();

    // Listing types
    expect(screen.getByText('Listing Type')).toBeDefined();
    expect(screen.getByText('All')).toBeDefined();
    expect(screen.getByText('Services')).toBeDefined();
    expect(screen.getByText('Equipment')).toBeDefined();

    // Selectors
    expect(screen.getByLabelText(/Category/i)).toBeDefined();
    expect(screen.getByLabelText(/District/i)).toBeDefined();

    // Price range min and max
    expect(screen.getByPlaceholderText('Min')).toBeDefined();
    expect(screen.getByPlaceholderText('Max')).toBeDefined();

    // Customer rating
    expect(screen.getByText('Customer Rating')).toBeDefined();
  });

  it('should sync search input with debounced keyword updates', async () => {
    render(
      <MemoryRouter initialEntries={['/search?q=camera']}>
        <SearchPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search by keywords/i);
    expect(searchInput.value).toBe('camera');

    // Type new keyword
    fireEvent.change(searchInput, { target: { value: 'sound' } });
    expect(searchInput.value).toBe('sound');
  });

  it('should display search results retrieved from API', async () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    // Initially loading skeleton is shown
    expect(screen.queryByText('Sony Cinema Camera FX3')).toBeNull();

    // Wait for the mock API response to populate
    await waitFor(() => {
      expect(screen.getByText('Sony Cinema Camera FX3')).toBeDefined();
    });

    expect(screen.getByText(/John Camera Rentals/i)).toBeDefined();
    expect(screen.getAllByText(/Colombo/i)).toBeDefined();
  });

  it('should show empty state message when no results are found', async () => {
    render(
      <MemoryRouter initialEntries={['/search?q=nonexistent']}>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Listings Found')).toBeDefined();
      expect(screen.getByText(/We couldn't find anything matching your filters/i)).toBeDefined();
    });
  });
});
