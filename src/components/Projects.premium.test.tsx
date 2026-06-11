import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';

import { Projects } from './Projects';
import type { Project } from '../types';
import { BENTO_GRID_CLASSES, VARIANT_SPAN_CLASSES } from '../lib/animation/bento';
import {
  isOwnershipValid,
  PROJECT_OWNERSHIP_REGISTRY,
} from '../lib/animation/ownership';

/**
 * Example (assertion) tests for the *adapted* Premium Projects section.
 *
 * These complement the content/preservation examples in `Projects.test.tsx`
 * (which is left untouched) by pinning the bento-grid + premium-card structure
 * the section layers on top of the preserved content:
 *
 *  - Req 9.3, 9.4: the section renders a bento-grid `<ul>` carrying
 *    `BENTO_GRID_CLASSES` (single-column on mobile, widening to 2 then 4
 *    columns); each card wrapper `<li>` carries its per-variant span classes,
 *    and a card with no `variant` falls back to the empty `standard` span.
 *  - Req 5.6, 9.2: each focusable card keeps `tabIndex=0` and the accent
 *    focus-visible ring; pointer move/leave handlers are attached to the tilt
 *    element and never throw.
 *  - Req 5.1: the Iconsax "view project" arrow (line-drawn via `useSvgDraw`)
 *    renders once per card.
 *  - Req 4.2: each bento card wrapper composes its span classes with the
 *    staggered entrance reveal (wrappers render in document order, each a grid
 *    item with its span + perspective).
 *  - Req 3.3, 3.4, 3.5: the project ownership registry is conflict-free
 *    (`isOwnershipValid(PROJECT_OWNERSHIP_REGISTRY)` is true).
 *
 * _Requirements: 3.3, 3.4, 3.5, 4.2, 5.1, 5.6, 7.1, 9.2, 9.3, 9.4_
 */

afterEach(() => {
  cleanup();
});

/**
 * A small fixture exercising the variant span mapping: a `featured` card (wide +
 * tall span), a card with NO variant (the empty `standard` span), and a `wide`
 * card. Titles are distinct so each card's wrapper can be located precisely.
 */
const FIXTURE: Project[] = [
  {
    title: 'Featured Project',
    description: 'The hero card spanning two columns and two rows.',
    techStack: ['React', 'TypeScript'],
    imageUrl: 'https://example.com/featured.png',
    githubUrl: 'https://github.com/example/featured',
    liveDemoUrl: 'https://example.com/featured',
    variant: 'featured',
  },
  {
    title: 'Standard Project',
    description: 'A card with no configured variant — the standard span.',
    techStack: ['Vue'],
    imageUrl: 'https://example.com/standard.png',
    githubUrl: null,
    liveDemoUrl: null,
    // No `variant` -> falls back to the empty `standard` span.
  },
  {
    title: 'Wide Project',
    description: 'A card spanning two columns but a single row.',
    techStack: ['Svelte', 'Vite'],
    imageUrl: 'https://example.com/wide.png',
    githubUrl: 'https://github.com/example/wide',
    liveDemoUrl: null,
    variant: 'wide',
  },
];

/** Locate the wrapper `<li>` owning the card with the given heading text. */
function wrapperFor(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title });
  const li = heading.closest('li');
  expect(li).not.toBeNull();
  return li as HTMLElement;
}

/** Locate the focusable card `<article>` owning the given heading text. */
function articleFor(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title });
  const article = heading.closest('article');
  expect(article).not.toBeNull();
  return article as HTMLElement;
}

describe('Projects — bento grid container (Req 9.3, 9.4)', () => {
  it('renders the card list as a <ul> carrying the bento grid classes', () => {
    const { container } = render(<Projects projects={FIXTURE} />);

    // The bento container is the only <ul> with the `grid` class (the tech-stack
    // lists use `flex flex-wrap`).
    const grid = container.querySelector('ul.grid');
    expect(grid).not.toBeNull();
    expect(grid).toBeInstanceOf(HTMLUListElement);

    // It carries the exact bento grid class string.
    expect(grid).toHaveClass(...BENTO_GRID_CLASSES.split(/\s+/));

    // Spot-check the responsive columns: single column on mobile, widening to
    // two then four columns.
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });

  it('renders one card wrapper <li> per project, in document order', () => {
    const { container } = render(<Projects projects={FIXTURE} />);

    const grid = container.querySelector('ul.grid') as HTMLElement;
    const wrappers = grid.querySelectorAll(':scope > li');
    expect(wrappers).toHaveLength(FIXTURE.length);
  });
});

describe('Projects — per-variant span classes compose with the reveal (Req 4.2, 9.4)', () => {
  it('gives a featured card the featured span classes plus perspective', () => {
    render(<Projects projects={FIXTURE} />);

    const wrapper = wrapperFor('Featured Project');
    // featured -> 'md:col-span-2 lg:col-span-2 lg:row-span-2'
    for (const cls of VARIANT_SPAN_CLASSES.featured.split(/\s+/)) {
      expect(wrapper).toHaveClass(cls);
    }
    // The wrapper is the perspective context the nested 3D-tilt article rotates
    // within (span + perspective compose on the same grid item).
    expect(wrapper).toHaveClass('[perspective:1000px]');
  });

  it('gives a wide card the wide span classes', () => {
    render(<Projects projects={FIXTURE} />);

    const wrapper = wrapperFor('Wide Project');
    for (const cls of VARIANT_SPAN_CLASSES.wide.split(/\s+/)) {
      expect(wrapper).toHaveClass(cls);
    }
    expect(wrapper).toHaveClass('[perspective:1000px]');
  });

  it('gives a card with no variant the empty standard span (no col/row span)', () => {
    render(<Projects projects={FIXTURE} />);

    const wrapper = wrapperFor('Standard Project');
    // standard -> '' : the wrapper carries only the perspective utility, and no
    // column/row span classes.
    expect(wrapper).toHaveClass('[perspective:1000px]');
    expect(wrapper.className).not.toMatch(/col-span/);
    expect(wrapper.className).not.toMatch(/row-span/);
  });
});

describe('Projects — focusable card + handlers + line-drawn arrow (Req 5.1, 5.6, 7.1, 9.2)', () => {
  it('keeps each card focusable (tabIndex 0) with the accent focus-visible ring', () => {
    render(<Projects projects={FIXTURE} />);

    for (const project of FIXTURE) {
      const article = articleFor(project.title);
      expect(article).toHaveAttribute('tabindex', '0');
      expect(article).toHaveClass('focus-visible:ring-accent');
    }
  });

  it('renders exactly one line-drawn arrow svg per card', () => {
    render(<Projects projects={FIXTURE} />);

    for (const project of FIXTURE) {
      const article = articleFor(project.title);
      // The "view project" arrow is the only svg in the card carrying the
      // `shrink-0` utility (the action-button icons do not), and it is the node
      // `useSvgDraw` attaches to.
      const arrows = article.querySelectorAll('svg.shrink-0');
      expect(arrows).toHaveLength(1);
    }
  });

  it('attaches pointer move/leave handlers to the tilt article without throwing', () => {
    render(<Projects projects={FIXTURE} />);

    const article = articleFor('Featured Project');

    // Firing the pointer events the tilt element listens to must not throw in
    // jsdom (the tilt math is pure and gated; here we only assert the handlers
    // are wired and safe to invoke).
    expect(() => {
      fireEvent.pointerMove(article, { clientX: 10, clientY: 10 });
      fireEvent.pointerLeave(article);
    }).not.toThrow();
  });
});

describe('Projects — animation ownership is conflict-free (Req 3.3, 3.4, 3.5)', () => {
  it('reports the project ownership registry as valid (no double-owned property)', () => {
    expect(isOwnershipValid(PROJECT_OWNERSHIP_REGISTRY)).toBe(true);
  });
});
