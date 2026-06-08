import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, cleanup, screen } from '@testing-library/react';
import { ExternalLink } from './ExternalLink';

/**
 * Property-based test for Property 1 (Req 2.9, 5.6, 7.2, 8.3, 8.4).
 *
 * For any configured (non-null) external URL rendered by ExternalLink, the
 * resulting anchor must point at that URL, open in a new tab (target="_blank"),
 * and carry a rel attribute containing "noopener" to prevent tab-nabbing.
 *
 * URLs come from fc.webUrl(), which yields well-formed http(s) URLs that the
 * ExternalLink component treats as configured destinations.
 */
describe('ExternalLink (external links open in a new tab)', () => {
  // Feature: personal-portfolio-website, Property 1: External links open in a new tab
  it('renders configured URLs as anchors with href, target="_blank", and rel containing noopener', () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        render(<ExternalLink href={url}>visit</ExternalLink>);

        try {
          const anchor = screen.getByRole('link');

          expect(anchor.tagName).toBe('A');
          expect(anchor).toHaveAttribute('href', url);
          expect(anchor).toHaveAttribute('target', '_blank');

          const rel = anchor.getAttribute('rel') ?? '';
          expect(rel).toContain('noopener');
        } finally {
          // Ensure the DOM is reset between iterations so getByRole stays unique.
          cleanup();
        }
      }),
      { numRuns: 100 },
    );
  });
});
