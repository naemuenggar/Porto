import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, cleanup, screen } from '@testing-library/react';
import { ExternalLink } from './ExternalLink';

/**
 * Property-based test for Property 2 (Req 5.7, 8.5).
 *
 * For any destination that is null or empty, ExternalLink must render a
 * non-navigating element marked aria-disabled="true" with NO href attribute and
 * which is not an anchor that would navigate. As a contrasting case, a valid
 * (non-empty) URL must render a navigable anchor.
 *
 * The href input is drawn from fc.oneof(fc.webUrl(), null, '') so each run
 * exercises either the enabled (configured URL) or disabled (no destination)
 * branch of the component.
 */
describe('ExternalLink (links with no destination are disabled and do not navigate)', () => {
  // Feature: personal-portfolio-website, Property 2: Links with no destination are disabled and do not navigate
  it('renders null/empty destinations as a disabled, non-navigating element with no href', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.webUrl(), fc.constant(null), fc.constant('')),
        (href) => {
          render(<ExternalLink href={href}>visit</ExternalLink>);

          try {
            const element = screen.getByRole('link');
            const hasDestination = typeof href === 'string' && href.trim().length > 0;

            if (hasDestination) {
              // Contrasting enabled case: a real, navigable anchor.
              expect(element.tagName).toBe('A');
              expect(element).toHaveAttribute('href', href);
              expect(element).not.toHaveAttribute('aria-disabled', 'true');
            } else {
              // Disabled case: non-anchor, aria-disabled, no href, cannot navigate.
              expect(element).toHaveAttribute('aria-disabled', 'true');
              expect(element).not.toHaveAttribute('href');
              expect(element.tagName).not.toBe('A');
            }
          } finally {
            // Reset the DOM between iterations so getByRole stays unique.
            cleanup();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
