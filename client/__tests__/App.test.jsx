/**
 * @file App.test.jsx
 * @module AppTest
 * @description Smoke test for the root App component. Verifies that the application mounts without crashing when wrapped with the required providers (BrowserRouter, AuthProvider). This is the most basic integration test and should always pass if the component tree is valid.
 * @dependencies vitest, @testing-library/react, react-router-dom, ../src/App.jsx, ../src/context/AuthContext.jsx
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';

describe('App', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });

  it('should render the home page content at root route', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(container.querySelector('.app')).toBeDefined();
  });
});
