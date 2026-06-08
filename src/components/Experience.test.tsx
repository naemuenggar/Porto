import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Experience } from './Experience';
import { experience } from '../data/content';

/**
 * Example tests for the Experience section (Req 6.1, 6.2, 6.3).
 *
 * Uses the real `experience` content (project-based / learning experience) and
 * verifies the entries render, in most-recent-first order, with their subtitle
 * and highlight bullets, and within the documented length bounds.
 */
describe('Experience section', () => {
  function renderExperience() {
    return render(<Experience entries={[...experience]} />);
  }

  it('renders every experience entry by title', () => {
    renderExperience();

    for (const entry of experience) {
      expect(
        screen.getByRole('heading', { level: 3, name: entry.title }),
      ).toBeInTheDocument();
    }

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
      experience.length,
    );
  });

  it('renders entries in most-recent-first order (sortKey descending)', () => {
    renderExperience();

    const expectedOrder = [...experience]
      .sort((a, b) => b.sortKey - a.sortKey)
      .map((entry) => entry.title);

    const renderedOrder = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);

    expect(renderedOrder).toEqual(expectedOrder);
  });

  it('renders each entry subtitle and its highlight bullets', () => {
    renderExperience();

    for (const entry of experience) {
      if (entry.subtitle) {
        expect(screen.getByText(entry.subtitle)).toBeInTheDocument();
      }
      for (const highlight of entry.highlights ?? []) {
        expect(screen.getByText(highlight)).toBeInTheDocument();
      }
    }
  });

  it('renders titles within 1–100 chars and descriptions within 1–500 chars', () => {
    renderExperience();

    for (const entry of experience) {
      expect(entry.title.length).toBeGreaterThanOrEqual(1);
      expect(entry.title.length).toBeLessThanOrEqual(100);
      expect(entry.description.length).toBeGreaterThanOrEqual(1);
      expect(entry.description.length).toBeLessThanOrEqual(500);
    }
  });
});
