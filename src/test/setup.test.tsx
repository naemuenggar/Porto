import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Smoke test to verify the Vitest + jsdom + Testing Library + jest-dom
// toolchain is wired up correctly.
describe('test toolchain', () => {
  it('renders App and jest-dom matchers are available', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
