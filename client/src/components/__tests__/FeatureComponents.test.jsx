/**
 * @file FeatureComponents.test.jsx
 * @description Tests for the new report modal, review form, cancellation policy and chart components.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../api/axiosInstance', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}));

import axiosInstance from '../../api/axiosInstance';
import ReportUserModal from '../reports/ReportUserModal';
import ReviewForm from '../reviews/ReviewForm';
import CancellationPolicy from '../bookings/CancellationPolicy';
import BarChart from '../common/BarChart';

beforeEach(() => vi.clearAllMocks());

describe('ReportUserModal', () => {
  it('requires a reason and a long enough description', () => {
    render(<ReportUserModal userId="u1" userName="Sam" onClose={() => {}} />);
    fireEvent.click(screen.getByText('Submit report'));
    expect(screen.getByRole('alert').textContent).toMatch(/choose a reason/i);

    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'fraud' } });
    fireEvent.change(screen.getByLabelText('What happened?'), { target: { value: 'too short' } });
    fireEvent.click(screen.getByText('Submit report'));
    expect(screen.getByRole('alert').textContent).toMatch(/at least 20/i);
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });

  it('posts the report and shows a success message', async () => {
    axiosInstance.post.mockResolvedValue({ data: {} });
    render(<ReportUserModal userId="u1" userName="Sam" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'fraud' } });
    fireEvent.change(screen.getByLabelText('What happened?'), { target: { value: 'They asked me to pay outside the platform.' } });
    fireEvent.click(screen.getByText('Submit report'));
    await waitFor(() => expect(screen.getByText(/report was submitted/i)).toBeDefined());
    expect(axiosInstance.post).toHaveBeenCalledWith('/users/u1/report', expect.objectContaining({ reason: 'fraud' }));
  });

  it('shows the server error (e.g. duplicate report)', async () => {
    axiosInstance.post.mockRejectedValue({ response: { data: { message: 'You already have an open report against this user' } } });
    render(<ReportUserModal userId="u1" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'other' } });
    fireEvent.change(screen.getByLabelText('What happened?'), { target: { value: 'A sufficiently long description here.' } });
    fireEvent.click(screen.getByText('Submit report'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/already have an open report/));
  });
});

describe('ReviewForm', () => {
  it('validates rating and comment length', () => {
    render(<ReviewForm bookingId="b1" />);
    fireEvent.click(screen.getByText('Submit Review'));
    expect(screen.getByRole('alert').textContent).toMatch(/star rating/i);
    fireEvent.click(screen.getByLabelText('4 stars'));
    fireEvent.change(screen.getByPlaceholderText(/minimum 10/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByText('Submit Review'));
    expect(screen.getByRole('alert').textContent).toMatch(/at least 10/i);
  });

  it('submits a new review', async () => {
    axiosInstance.post.mockResolvedValue({ data: { id: 'r1' } });
    const onSuccess = vi.fn();
    render(<ReviewForm bookingId="b1" onSubmitSuccess={onSuccess} />);
    fireEvent.click(screen.getByLabelText('5 stars'));
    fireEvent.change(screen.getByPlaceholderText(/minimum 10/i), { target: { value: 'Great work, on time.' } });
    fireEvent.click(screen.getByText('Submit Review'));
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(axiosInstance.post).toHaveBeenCalledWith('/reviews', { bookingId: 'b1', rating: 5, comment: 'Great work, on time.' });
  });

  it('edits an existing review with PUT', async () => {
    axiosInstance.put.mockResolvedValue({ data: { id: 'r1', rating: 3, comment: 'Updated comment text.' } });
    render(<ReviewForm review={{ id: 'r1', rating: 5, comment: 'Original comment text.' }} />);
    fireEvent.click(screen.getByLabelText('3 stars'));
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => expect(axiosInstance.put).toHaveBeenCalledWith('/reviews/r1', { rating: 3, comment: 'Original comment text.' }));
  });
});

describe('CancellationPolicy', () => {
  it('fetches and renders a plain-language summary', async () => {
    axiosInstance.get.mockResolvedValue({ data: { policy: { policy_type: 'moderate', summary: ['Cancel 48+ hours before start: full refund.'] } } });
    render(<CancellationPolicy listingId="l1" />);
    await waitFor(() => expect(screen.getByTestId('cancellation-policy')).toBeDefined());
    expect(screen.getByText(/full refund/i)).toBeDefined();
    expect(axiosInstance.get).toHaveBeenCalledWith('/listings/l1/cancellation-policy');
  });
});

describe('BarChart', () => {
  it('renders an empty state when there is no data', () => {
    render(<BarChart data={[{ label: 'Jan', value: 0 }]} />);
    expect(screen.getByText(/no data to show/i)).toBeDefined();
  });

  it('renders one bar per data point', () => {
    const { container } = render(<BarChart data={[{ label: 'Jan', value: 5 }, { label: 'Feb', value: 10 }]} />);
    expect(container.querySelectorAll('rect').length).toBe(2);
  });
});
