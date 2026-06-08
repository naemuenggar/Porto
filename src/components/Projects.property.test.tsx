import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { ProjectCard } from './Projects';
import type { Project } from '../types';

/**
 * Property-based test for Property 4 (Req 5.1).
 *
 * For any project object, the rendered project card contains all required
 * parts: the image, the title, the description, every item of the technology
 * stack, and both a GitHub and a Live Demo action element.
 *
 * Generation strategy:
 * - `title` / `description` are non-empty after trim so they are meaningful and
 *   locatable in the rendered text content.
 * - `techStack` is a (possibly empty) array of unique, non-empty strings.
 *   Uniqueness keeps React keys (keyed on the tech string) stable and makes the
 *   per-item presence assertion meaningful.
 * - `imageUrl` is a web URL so an <img> is always rendered.
 * - `githubUrl` / `liveDemoUrl` are each a URL-or-null. The ExternalLink helper
 *   renders an action element in both cases (an <a> when configured, a disabled
 *   role="link" <span> when null), so both action elements are always present.
 *   They are located by their stable aria-label suffixes, independent of the
 *   (arbitrary) title text.
 */

/** Non-empty (after trim) string suitable for title/description. */
const nonEmptyText = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

/** A configured URL or an absent (null) destination. */
const urlOrNull = fc.oneof(fc.webUrl(), fc.constant(null));

const projectArb: fc.Arbitrary<Project> = fc.record({
  title: nonEmptyText,
  description: nonEmptyText,
  techStack: fc.uniqueArray(nonEmptyText, { minLength: 0, maxLength: 8 }),
  imageUrl: fc.webUrl(),
  githubUrl: urlOrNull,
  liveDemoUrl: urlOrNull,
});

describe('ProjectCard (each project renders all required card parts)', () => {
  // Feature: personal-portfolio-website, Property 4: Each project renders all required card parts
  it('renders the image, title, description, every tech item, and both actions', () => {
    fc.assert(
      fc.property(projectArb, (project) => {
        const { container } = render(<ProjectCard project={project} />);

        try {
          // Image (Req 5.1, 5.8): an <img> element is always present.
          const image = container.querySelector('img');
          expect(image).not.toBeNull();

          // Title and description text are present in the card.
          expect(container.textContent).toContain(project.title);
          expect(container.textContent).toContain(project.description);

          // Every technology-stack item is rendered.
          project.techStack.forEach((tech) => {
            expect(container.textContent).toContain(tech);
          });

          // Both action elements are present, located by their stable
          // aria-label suffixes regardless of whether a URL is configured.
          const githubAction = container.querySelector(
            '[aria-label$="GitHub repository"]',
          );
          const liveDemoAction = container.querySelector(
            '[aria-label$="live demo"]',
          );
          expect(githubAction).not.toBeNull();
          expect(liveDemoAction).not.toBeNull();
        } finally {
          // Reset the DOM between iterations so queries stay scoped per run.
          cleanup();
        }
      }),
      { numRuns: 100 },
    );
  });
});
