import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import App from './App';
import { profile, navLinks, contactDetails } from './data/content';

/**
 * Preservation tests for the adapted (animation-wrapped) section components
 * (Task 7.4).
 *
 * The Motion reveal/stagger adapters and Anime.js micro-interactions are
 * layered onto the existing sections "in place" — the *adapt, do not rebuild*
 * principle. These tests assert that the layering did NOT regress the
 * structural contracts the rest of the app depends on:
 *
 * - Req 4.5 / 8.6: the section anchors render in the existing vertical order
 *   (home, about, skills, projects, experience, contact) so Navbar/Hero
 *   anchor-scrolling keeps working, and the fixed Navbar is preserved.
 * - Req 9.2: colors continue to come exclusively from the four Theme_Tokens
 *   (`base`, `surface`, `ink`, `accent`) — the dark theme is unchanged.
 * - Req 9.3: the responsive single-/multi-column layout utilities are retained.
 * - Req 9.4: content is still sourced from `src/data/content.ts` (data-driven).
 *
 * These are render/content assertions (not motion assertions) per Req 11.5,
 * since the animation motion itself is not exercisable in jsdom.
 */

/** The canonical vertical order of the section anchors (Req 4.5). */
const EXPECTED_ANCHOR_ORDER = [
  'home',
  'about',
  'skills',
  'projects',
  'experience',
  'contact',
] as const;

describe('App preservation — section anchors and order (Req 4.5, 8.6)', () => {
  it('renders the section anchors in the existing vertical order', () => {
    const { container } = render(<App />);

    // Collect the ids of every <section> element in document order.
    const sectionIds = [...container.querySelectorAll('section[id]')].map(
      (section) => section.id,
    );

    // Every expected anchor exists and they appear in the canonical order.
    // (filter keeps only the known anchors in case a section adds extras.)
    const orderedKnown = sectionIds.filter((id) =>
      (EXPECTED_ANCHOR_ORDER as readonly string[]).includes(id),
    );

    expect(orderedKnown).toEqual([...EXPECTED_ANCHOR_ORDER]);
  });

  it('exposes one anchor target per navLink so Navbar scrolling keeps working', () => {
    const { container } = render(<App />);

    for (const link of navLinks) {
      const target = container.querySelector(`#${link.anchorId}`);
      expect(target).not.toBeNull();
    }
  });

  it('keeps the Navbar fixed and full-width at the top', () => {
    const { container } = render(<App />);

    const nav = container.querySelector('nav[aria-label="Primary"]');
    expect(nav).not.toBeNull();
    // Fixed positioning anchored to the top across all scroll positions.
    expect(nav!.className).toMatch(/\bfixed\b/);
    expect(nav!.className).toMatch(/\btop-0\b/);
  });
});

describe('App preservation — theme tokens (Req 9.2)', () => {
  it('styles colors exclusively via the base/surface/ink/accent tokens', () => {
    const { container } = render(<App />);
    const html = container.innerHTML;

    // The four palette tokens are all present in the rendered markup.
    for (const token of ['base', 'surface', 'ink', 'accent']) {
      expect(html).toMatch(new RegExp(`(bg|text|border|ring)-${token}`));
    }
  });

  it('does not introduce off-palette Tailwind color hues', () => {
    const { container } = render(<App />);
    const html = container.innerHTML;

    // No standard Tailwind named hues (which would mean a color outside the
    // four-token dark theme) leaked into the rendered class strings.
    const OFF_PALETTE =
      /\b(?:bg|text|border|ring)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|gray|slate|zinc|neutral|stone)-\d{2,3}\b/;
    expect(html).not.toMatch(OFF_PALETTE);
  });
});

describe('App preservation — responsive layout retained (Req 9.3)', () => {
  it('retains single-column and multi-column responsive grid utilities', () => {
    const { container } = render(<App />);
    const html = container.innerHTML;

    // Multi-column desktop grids (Skills/Projects) are still present.
    expect(html).toMatch(/lg:grid-cols-\d+/);
    // Single-column stacking layouts (About/Experience/Contact) are present.
    expect(html).toMatch(/grid-cols-1|flex-col/);
  });
});

describe('App preservation — content sourced from content.ts (Req 9.4)', () => {
  it('renders the profile identity from the central content module', () => {
    render(<App />);

    // Name + role come straight from content.ts `profile`.
    expect(
      screen.getByRole('heading', { level: 1, name: profile.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(profile.role)).toBeInTheDocument();
  });

  it('renders the navigation labels from content.ts navLinks', () => {
    render(<App />);

    // Each nav label from content.ts is rendered (md+ inline list).
    for (const link of navLinks) {
      expect(
        screen.getAllByRole('button', { name: link.label }).length,
      ).toBeGreaterThan(0);
    }
  });

  it('renders contact details sourced from content.ts', () => {
    render(<App />);

    // Email + location come from content.ts contactDetails.
    expect(screen.getByText(contactDetails.email)).toBeInTheDocument();
    expect(screen.getByText(contactDetails.location)).toBeInTheDocument();
  });
});
