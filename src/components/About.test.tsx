import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { About } from './About';
import { about } from '../data/content';

/**
 * Example tests for the About section.
 *
 * Uses the real `about` content from the central content module and verifies
 * that every profile paragraph is rendered.
 */
describe('About section', () => {
  function renderAbout() {
    return render(<About paragraphs={[...about.paragraphs]} />);
  }

  it('renders the About heading', () => {
    renderAbout();
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
  });

  it('renders every profile paragraph', () => {
    const { container } = renderAbout();

    // One <p> per paragraph, in order.
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(about.paragraphs.length);

    for (const paragraph of about.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });
});
