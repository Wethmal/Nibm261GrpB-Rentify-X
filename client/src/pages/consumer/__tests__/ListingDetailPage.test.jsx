import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ListingDetailPage from '../ListingDetailPage.jsx';
import axiosInstance from '../../../api/axiosInstance.js';

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'l1' })
  };
});

// Mock axiosInstance
vi.mock('../../../api/axiosInstance.js', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn()
    }
  };
});

const mockListingData = {
  id: 'l1',
  title: 'Plumbing Master Pro',
  description: 'Fix leakages, pipe blockages, emergency leaks',
  type: 'service',
  price_per_unit: 1500,
  unit_label: 'hour',
  district: 'Colombo',
  average_rating: 4.8,
  review_count: 2,
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ],
  provider_name: 'Dinesh Perera',
  provider_avatar: '',
  provider_trust_score: 4.95,
  provider_email: 'dinesh.plumb@Rentify.lk',
  provider_mobile: '0779998888',
  category_id: 'plumbing-cat',
  category_name: 'Plumbing',
  reviews: [
    {
      id: 'r1',
      reviewer_name: 'Amara de Silva',
      rating: 5,
      comment: 'Excellent service! pipe blockage was fixed.',
      created_at: '2026-06-23T08:30:00Z'
    }
  ]
};

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today);
dayAfter.setDate(today.getDate() + 2);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

const tomorrowStr = tomorrow.toISOString().split('T')[0];
const dayAfterStr = dayAfter.toISOString().split('T')[0];
const nextWeekStr = nextWeek.toISOString().split('T')[0];

const mockAvailabilityData = [
  { date: tomorrowStr, is_available: true },
  { date: dayAfterStr, is_available: false }, // Blocked date
  { date: nextWeekStr, is_available: true }
];

describe('ListingDetailPage & Booking Request UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Rentify';
    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('/availability')) {
        return Promise.resolve({ data: mockAvailabilityData });
      }
      return Promise.resolve({ data: mockListingData });
    });
  });

  it('should render the listing detail page with listing details, provider card, and booking form', async () => {
    render(
      <MemoryRouter initialEntries={['/listings/l1']}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify skeleton loads and vanishes
    expect(screen.getByTestId('listing-detail-skeleton')).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByTestId('listing-detail-skeleton')).toBeNull();
    });

    // Verify core listing details
    expect(screen.getAllByText('Plumbing Master Pro').length).toBeGreaterThan(0);
    expect(screen.getByText('Colombo')).toBeDefined();
    expect(screen.getByText('Dinesh Perera')).toBeDefined();

    // Verify booking form exists
    expect(screen.getByTestId('booking-panel-form')).toBeDefined();
    expect(screen.getByTestId('date-picker')).toBeDefined();
    expect(screen.getByTestId('time-picker')).toBeDefined();
    expect(screen.getByTestId('duration-selector')).toBeDefined();
    expect(screen.getByTestId('notes-field')).toBeDefined();
  });

  it('should calculate and display total price in real-time as duration changes', async () => {
    render(
      <MemoryRouter initialEntries={['/listings/l1']}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('listing-detail-skeleton')).toBeNull();
    });

    const durationInput = screen.getByTestId('duration-selector');
    const priceDisplay = screen.getByTestId('total-price-display');

    // Default duration is 1, so total should be 1500
    expect(priceDisplay.textContent).toContain('1,500');

    // Change duration to 4
    fireEvent.change(durationInput, { target: { value: '4' } });
    expect(priceDisplay.textContent).toContain('6,000');
  });

  it('should block unavailable dates and display inline validation error', async () => {
    render(
      <MemoryRouter initialEntries={['/listings/l1']}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('listing-detail-skeleton')).toBeNull();
    });

    const datePicker = screen.getByTestId('date-picker');

    // Change date to a blocked date
    fireEvent.change(datePicker, { target: { value: dayAfterStr } });

    // Expect date error to be visible
    expect(screen.getByTestId('date-error')).toBeDefined();
    expect(screen.getByText(/Selected date is unavailable/i)).toBeDefined();

    // Submit button should be disabled
    const submitButton = screen.getByTestId('submit-booking-button');
    expect(submitButton.hasAttribute('disabled')).toBe(true);
  });

  it('should restrict the notes field length and count characters dynamically', async () => {
    render(
      <MemoryRouter initialEntries={['/listings/l1']}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('listing-detail-skeleton')).toBeNull();
    });

    const notesField = screen.getByTestId('notes-field');
    const charCounter = screen.getByTestId('char-count');

    expect(charCounter.textContent).toBe('0/500');

    // Type notes
    fireEvent.change(notesField, { target: { value: 'Need help at 2 PM' } });
    expect(charCounter.textContent).toBe('17/500');
  });

  it('should submit booking request successfully and render success state showing booking ID and pending status', async () => {
    axiosInstance.post.mockResolvedValue({
      data: {
        bookingId: 'b-998877',
        status: 'pending'
      }
    });

    render(
      <MemoryRouter initialEntries={['/listings/l1']}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('listing-detail-skeleton')).toBeNull();
    });

    const datePicker = screen.getByTestId('date-picker');
    const timePicker = screen.getByTestId('time-picker');
    const submitButton = screen.getByTestId('submit-booking-button');

    // Fill valid values
    fireEvent.change(datePicker, { target: { value: tomorrowStr } });
    fireEvent.change(timePicker, { target: { value: '14:30' } });

    // Click submit
    fireEvent.click(submitButton);

    // Verify success state displays booking ID and pending status
    await waitFor(() => {
      expect(screen.getByTestId('booking-success-state')).toBeDefined();
    });

    expect(screen.getByTestId('booking-id-display').textContent).toBe('b-998877');
    expect(screen.getByTestId('booking-status-display').textContent).toBe('pending');
  });

  it('should support photo carousel slide changes and thumbnail updates', async () => {
    render(
      <MemoryRouter initialEntries={['/listings/l1']}>
        <Routes>
          <Route path="/listings/:id" element={<ListingDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('listing-detail-skeleton')).toBeNull();
    });

    const mainImage = screen.getByTestId('carousel-main-image');
    expect(mainImage.getAttribute('src')).toBe('https://example.com/photo1.jpg');

    // Click on thumbnail for photo 2
    const thumbnail2 = screen.getByTestId('thumbnail-item-1');
    fireEvent.click(thumbnail2);

    expect(mainImage.getAttribute('src')).toBe('https://example.com/photo2.jpg');
  });
});
