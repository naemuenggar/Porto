import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ComponentType } from 'react';

import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Skills } from './Skills';
import { Projects } from './Projects';
import { Contact } from './Contact';
import { Footer } from './Footer';
import { Icons, RETAINED_LEGACY_ICONS } from '../lib/icons';
import type { IconProps } from '../lib/icons';
import {
  navLinks,
  skillCategories,
  projects,
  contactDetails,
} from '../data/content';

/**
 * Icon-migration example tests (Requirement 2.1, 2.2, 2.3, 2.4, 2.6).
 *
 * These pin the icon-layer migration to Iconsax without re-testing the
 * behavioral assertions already covered by each component's own test file:
 *
 *  - The mapped concept icons (menu, close, externalLink, email, location) are
 *    backed by Iconsax (`iconsax-react`) and render an `<svg>` (Req 2.1, 2.2).
 *  - Decorative icons across Navbar/Hero/Skills/Projects/Contact/Footer carry
 *    `aria-hidden="true"` so assistive technology never announces them
 *    (Req 2.4).
 *  - Brand glyphs Iconsax does not provide (GitHub, LinkedIn) are retained from
 *    `react-icons` and that retention is documented (Req 2.3).
 *
 * The existing component suites already cover the surrounding behavior, so this
 * file stays focused on the icon layer (Req 2.6: those suites remain green).
 */

afterEach(() => {
  cleanup();
});

/**
 * Assert a component renders at least one icon and that EVERY rendered icon is
 * decorative — i.e. carries `aria-hidden="true"` (Req 2.4).
 */
function expectAllIconsDecorative(container: HTMLElement): NodeListOf<SVGElement> {
  const svgs = container.querySelectorAll('svg');
  expect(svgs.length).toBeGreaterThan(0);
  svgs.forEach((svg) => {
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
  return svgs;
}

/** The Iconsax-backed concept slots and the displayName of their wrapper. */
const ICONSAX_CONCEPTS = [
  ['menu', 'MenuIcon'],
  ['close', 'CloseIcon'],
  ['externalLink', 'ExternalLinkIcon'],
  ['email', 'EmailIcon'],
  ['location', 'LocationIcon'],
] as const;

describe('Icon layer — Iconsax-backed concepts (Req 2.1, 2.2, 2.4)', () => {
  it('maps each UI concept to a wrapped Iconsax component that renders an svg', () => {
    for (const [concept, displayName] of ICONSAX_CONCEPTS) {
      const ConceptIcon = Icons[concept] as ComponentType<IconProps>;

      // The wrapper exposes a stable displayName, confirming the concept is
      // backed by the Iconsax wrapper rather than a legacy glyph (Req 2.2).
      expect((ConceptIcon as { displayName?: string }).displayName).toBe(
        displayName,
      );

      const { container } = render(<ConceptIcon aria-hidden="true" />);
      const svg = container.querySelector('svg');
      // The Iconsax concept renders an svg and forwards aria-hidden (Req 2.1, 2.4).
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      cleanup();
    }
  });
});

describe('Icon layer — retained legacy brand glyphs (Req 2.3)', () => {
  it('documents the github and linkedin glyphs retained from react-icons', () => {
    const concepts = RETAINED_LEGACY_ICONS.map((entry) => entry.concept);
    expect(concepts).toContain('github');
    expect(concepts).toContain('linkedin');

    // Every documented retention records a non-empty reason for auditability.
    for (const entry of RETAINED_LEGACY_ICONS) {
      expect(entry.reason.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('Section components — decorative icons carry aria-hidden (Req 2.1, 2.4)', () => {
  it('Navbar renders the Iconsax menu icon, decorative', () => {
    const { container } = render(<Navbar links={navLinks} />);

    // Collapsed on load: the single rendered icon is the menu concept.
    const svgs = expectAllIconsDecorative(container);
    expect(svgs).toHaveLength(1);
  });

  it('Hero renders the social icons, decorative', () => {
    const { container } = render(
      <Hero
        name="Test Name"
        role="Web Developer"
        summary="Summary text."
        cvUrl="https://example.com/cv.pdf"
        githubUrl="https://github.com/example"
        linkedinUrl="https://linkedin.com/in/example"
      />,
    );

    // GitHub + LinkedIn glyphs.
    const svgs = expectAllIconsDecorative(container);
    expect(svgs).toHaveLength(2);
  });

  it('Skills renders every skill icon, decorative', () => {
    const { container } = render(<Skills categories={skillCategories} />);

    const totalSkills = skillCategories.reduce(
      (sum, category) => sum + category.skills.length,
      0,
    );
    const svgs = expectAllIconsDecorative(container);
    expect(svgs).toHaveLength(totalSkills);
  });

  it('Projects renders the Iconsax external-link icon plus GitHub glyph per card, decorative', () => {
    const { container } = render(<Projects projects={projects} />);

    // Each card renders a Live Demo (externalLink, Iconsax) and a GitHub glyph.
    const svgs = expectAllIconsDecorative(container);
    expect(svgs).toHaveLength(projects.length * 2);
  });

  it('Contact renders the Iconsax email/location icons plus social glyphs, decorative', () => {
    const { container } = render(<Contact details={contactDetails} />);

    // email (Iconsax) + github + linkedin + location (Iconsax).
    const svgs = expectAllIconsDecorative(container);
    expect(svgs).toHaveLength(4);
  });

  it('Footer renders the social icons, decorative', () => {
    const { container } = render(
      <Footer
        name="Test Name"
        githubUrl="https://github.com/example"
        linkedinUrl="https://linkedin.com/in/example"
      />,
    );

    const svgs = expectAllIconsDecorative(container);
    expect(svgs).toHaveLength(2);
  });
});
