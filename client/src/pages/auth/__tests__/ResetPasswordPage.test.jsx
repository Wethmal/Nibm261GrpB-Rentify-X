/**
 * @file ResetPasswordPage.test.jsx
 * @module ResetPasswordPageTest
 *
 * @description
 * Test suite for the ResetPasswordPage component. Verifies the two-step reset flow
 * renders correctly and handles both the token request step and password update step.
 * Uses Vitest with React Testing Library.
 *
 * @dependencies
 * - vitest: Test runner and assertion functions
 * - @testing-library/react: render, screen for component testing
 * - react-router-dom: MemoryRouter for routing context in tests
 * - ../ResetPasswordPage.jsx: Component under test
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../ResetPasswordPage.jsx';

describe('ResetPasswordPage', () => {
  it('should render the reset password page with heading', () => {
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Reset Password/i)).toBeDefined();
  });

  it('should display instructions for the email/mobile input step', () => {
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Enter your email or mobile/i)).toBeDefined();
  });

  // TODO: Add test for step 2 rendering after token request
  // TODO: Add test for password mismatch validation error
  // TODO: Add test for expired token error handling
});
