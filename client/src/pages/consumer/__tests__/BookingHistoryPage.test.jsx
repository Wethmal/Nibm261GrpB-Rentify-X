/**
 * @file BookingHistoryPage.test.jsx
 * @module BookingHistoryPageTest
 *
 * @description
 * Test suite for the BookingHistoryPage component. Verifies booking history renders,
 * handles empty bookings state, and validates dynamic tab state filtering (All, Active, Pending, Past, Cancelled)
 * in response to click events.
 *
 * @dependencies
 * - vitest: Test runner and assertion functions
 * - @testing-library/react: render, screen, waitFor, fireEvent
 * - react-router-dom: MemoryRouter
 * - ../BookingHistoryPage.jsx: Component under test
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookingHistoryPage from '../BookingHistoryPage.jsx';

// Mock axiosInstance returning multi-status list
vi.mock('../../../api/axiosInstance.js', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'b1',
          title: 'Sony FX3 Cinema Camera Kit',
          type: 'equipment',
          photo: 'https://images.unsplash.com/photo-1619597455322-4fbbd820250a?auto=format&fit=crop&q=80&w=400',
          provider_name: 'Shamil Rajapakse',
          scheduled_date: '2026-07-05',
          scheduled_time: '10:00 AM',
          duration: '3 days',
          total_price: 36000,
          status: 'pending',
          notes: 'Sony FX3 shoot notes'
        },
        {
          id: 'b2',
          title: 'Plumbing Master Pro',
          type: 'service',
          photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400',
          provider_name: 'Dinesh Perera',
          scheduled_date: '2026-06-22',
          scheduled_time: '02:00 PM',
          duration: '3 hours',
          total_price: 4500,
          status: 'completed',
          notes: 'Bathroom leak notes'
        },
        {
          id: 'b3',
          title: 'Upstair Annexe Panadura',
          type: 'equipment',
          photo: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400',
          provider_name: 'Sasundul Wanasinghe',
          scheduled_date: '2026-08-01',
          scheduled_time: '09:00 AM',
          duration: '1 month',
          total_price: 40000,
          status: 'confirmed',
          notes: 'Confirmed rental notes'
        },
        {
          id: 'b4',
          title: 'MacBook Pro 14 M1',
          type: 'equipment',
          photo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=400',
          provider_name: 'Sasundul Wanasinghe',
          scheduled_date: '2026-06-15',
          scheduled_time: '11:00 AM',
          duration: '1 month',
          total_price: 10000,
          status: 'cancelled',
          notes: 'Cancelled notes'
        }
      ]
    })
  }
}));

describe('BookingHistoryPage', () => {
  it('should render the booking history heading and initial list containing all items', async () => {
    render(<MemoryRouter><BookingHistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText(/My Bookings/i)).toBeDefined();
      expect(screen.getByText(/Sony FX3 Cinema Camera Kit/i)).toBeDefined();
      expect(screen.getByText(/Plumbing Master Pro/i)).toBeDefined();
      expect(screen.getByText(/Upstair Annexe Panadura/i)).toBeDefined();
      expect(screen.getByText(/MacBook Pro 14 M1/i)).toBeDefined();
    });
  });

  it('should filter only active (confirmed) bookings when active tab is selected', async () => {
    render(<MemoryRouter><BookingHistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId('tab-active')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('tab-active'));

    await waitFor(() => {
      // Confirmed item should exist
      expect(screen.getByText(/Upstair Annexe Panadura/i)).toBeDefined();
      // Other items should be hidden
      expect(screen.queryByText(/Sony FX3 Cinema Camera Kit/i)).toBeNull();
      expect(screen.queryByText(/Plumbing Master Pro/i)).toBeNull();
      expect(screen.queryByText(/MacBook Pro 14 M1/i)).toBeNull();
    });
  });

  it('should filter only pending bookings when pending tab is selected', async () => {
    render(<MemoryRouter><BookingHistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId('tab-pending')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('tab-pending'));

    await waitFor(() => {
      expect(screen.getByText(/Sony FX3 Cinema Camera Kit/i)).toBeDefined();
      expect(screen.queryByText(/Upstair Annexe Panadura/i)).toBeNull();
      expect(screen.queryByText(/Plumbing Master Pro/i)).toBeNull();
      expect(screen.queryByText(/MacBook Pro 14 M1/i)).toBeNull();
    });
  });

  it('should filter only past (completed) bookings when past tab is selected', async () => {
    render(<MemoryRouter><BookingHistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId('tab-past')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('tab-past'));

    await waitFor(() => {
      expect(screen.getByText(/Plumbing Master Pro/i)).toBeDefined();
      expect(screen.queryByText(/Sony FX3 Cinema Camera Kit/i)).toBeNull();
      expect(screen.queryByText(/Upstair Annexe Panadura/i)).toBeNull();
      expect(screen.queryByText(/MacBook Pro 14 M1/i)).toBeNull();
    });
  });

  it('should filter only cancelled bookings when cancelled tab is selected', async () => {
    render(<MemoryRouter><BookingHistoryPage /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByTestId('tab-cancelled')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('tab-cancelled'));

    await waitFor(() => {
      expect(screen.getByText(/MacBook Pro 14 M1/i)).toBeDefined();
      expect(screen.queryByText(/Sony FX3 Cinema Camera Kit/i)).toBeNull();
      expect(screen.queryByText(/Plumbing Master Pro/i)).toBeNull();
      expect(screen.queryByText(/Upstair Annexe Panadura/i)).toBeNull();
    });
  });
  it('should render scheduled dates, times, durations, and micro-timelines for each history item', async () => {
    render(<MemoryRouter><BookingHistoryPage /></MemoryRouter>);
    await waitFor(() => {
      // Date metrics
      expect(screen.getByText(/2026-07-05/i)).toBeDefined();
      expect(screen.getByText(/10:00 AM/i)).toBeDefined();
      expect(screen.getByText(/3 days/i)).toBeDefined();

      // Micro-timeline indicators
      const timelines = screen.getAllByTestId('micro-timeline');
      expect(timelines.length).toBeGreaterThan(0);
    });
  });
  it('should render color-coded status badges with correct classes for each booking entry', async () => {
    render(<MemoryRouter><BookingHistoryPage /></MemoryRouter>);
    await waitFor(() => {
      // Find each card container
      const cardB1 = screen.getByTestId('booking-card-b1');
      const cardB2 = screen.getByTestId('booking-card-b2');
      const cardB3 = screen.getByTestId('booking-card-b3');
      const cardB4 = screen.getByTestId('booking-card-b4');

      // Check inner HTML or classNames for badge styling
      expect(cardB1.querySelector('.badge--pending')).not.toBeNull();
      expect(cardB2.querySelector('.badge--completed')).not.toBeNull();
      expect(cardB3.querySelector('.badge--confirmed')).not.toBeNull();
      expect(cardB4.querySelector('.badge--cancelled')).not.toBeNull();
    });
  });
});


