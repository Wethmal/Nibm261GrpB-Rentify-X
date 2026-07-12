/**
 * @file CategoryManagementPage.test.jsx
 * @module CategoryManagementPageTest
 * @description Tests for the CategoryManagementPage component.
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CategoryManagementPage from '../CategoryManagementPage.jsx';

describe('CategoryManagementPage', () => {
  it('should render the category management heading', () => {
    render(<MemoryRouter><CategoryManagementPage /></MemoryRouter>);
    expect(screen.getByText(/Category Management/i)).toBeDefined();
  });
  it('should describe the CRUD capabilities', () => {
    render(<MemoryRouter><CategoryManagementPage /></MemoryRouter>);
    expect(screen.getByText(/Create, edit, and manage/i)).toBeDefined();
  });
});
