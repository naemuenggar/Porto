import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { About } from './About';
import { Experience } from './Experience';
import { Contact } from './Contact';
import { Skills } from './Skills';
import { Projects } from './Projects';
import { Hero } from './Hero';

import {
  about,
  experience,
  contactDetails,
  skillCategories,
  projects,
  profile,
  links,
} from '../data/content';

/**
 * Example / config tests for responsive layout and visual design (Req 9 & 10).
 *
 * These complement the property/example tests on individual components by
 * asserting the cross-cutting layout and design constraints:
 *
 * - Req 9.1: About, Experience, and Contact arrange content in a single column
 *   (their containers carry `grid-cols-1` / `flex-col`).
 * - Req 9.2: Skills and Projects use a multi-column (≥2) desktop grid
 *   (`lg:grid-cols-N`, N ≥ 2).
 * - Req 10.1: the Tailwind palette defines exactly the four tokens `base`,
 *   `surface`, `ink`, `accent` — no extra hues.
 * - Req 10.2: buttons and project cards carry `hover:` classes.
 * - Req 10.3: every declared transition/animation duration is within
 *   100–500ms (no `duration-*` utility exceeds `duration-500`).
 * - Req 10.4: `index.css` sets body `font-size` to at least 16px.
 * - Req 10.5: buttons and project cards carry an accent focus indicator
 *   (`focus-visible:ring-accent`).
 *
 * Layout/interaction checks read the rendered `className` strings; config-level
 * checks (palette tokens, body font size, full duration sweep) read the source
 * files directly via `fs`.
 */

/** Resolve a workspace path relative to this test file (src/components/). */
function fromHere(relative: string): string {
  return fileURLToPath(new URL(relative, import.meta.url));
}

const TAILWIND_CONFIG_PATH = fromHere('../../tailwind.config.js');
const INDEX_CSS_PATH = fromHere('../index.css');
const COMPONENTS_DIR = fromHere('.');
const INDEX_CSS = readFileSync(INDEX_CSS_PATH, 'utf-8');

describe('Responsive layout (Req 9.1, 9.2)', () => {
  // Req 9.1: About arranges content in a single-column layout.
  it('renders About with single-column layout classes', () => {
    const { container } = render(
      <About paragraphs={[...about.paragraphs]} />,
    );
    const html = container.innerHTML;
    expect(html).toMatch(/grid-cols-1|flex-col/);
  });

  // Req 9.1: Experience arranges its timeline in a single column.
  it('renders Experience with single-column layout classes', () => {
    const { container } = render(<Experience entries={[...experience]} />);
    expect(container.innerHTML).toMatch(/grid-cols-1|flex-col/);
  });

  // Req 9.1: Contact arranges its content in a single column on mobile.
  it('renders Contact with single-column layout classes', () => {
    const { container } = render(<Contact details={contactDetails} />);
    expect(container.innerHTML).toMatch(/grid-cols-1|flex-col/);
  });

  // Req 9.2: Skills uses a desktop multi-column grid with ≥2 columns.
  it('renders Skills with a desktop multi-column grid (lg:grid-cols-N, N >= 2)', () => {
    const { container } = render(<Skills categories={skillCategories} />);
    const matches = [...container.innerHTML.matchAll(/lg:grid-cols-(\d+)/g)];
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(Number(match[1])).toBeGreaterThanOrEqual(2);
    }
  });

  // Req 9.2: Projects uses a desktop multi-column grid with ≥2 columns.
  it('renders Projects with a desktop multi-column grid (lg:grid-cols-N, N >= 2)', () => {
    const { container } = render(<Projects projects={projects} />);
    const matches = [...container.innerHTML.matchAll(/lg:grid-cols-(\d+)/g)];
    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(Number(match[1])).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Color palette tokens (Req 10.1)', () => {
  // Req 10.1: theme.extend.colors defines exactly base, surface, ink, accent.
  it('defines exactly the four palette tokens base, surface, ink, accent', () => {
    const config = readFileSync(TAILWIND_CONFIG_PATH, 'utf-8');

    // Isolate the `colors: { ... }` block so we only inspect palette keys.
    const colorsBlock = config.match(/colors:\s*{([^}]*)}/);
    expect(colorsBlock).not.toBeNull();

    const keys = [...colorsBlock![1].matchAll(/(\w+)\s*:/g)].map((m) => m[1]);
    expect(new Set(keys)).toEqual(new Set(['base', 'surface', 'ink', 'accent']));
    expect(keys).toHaveLength(4);
  });
});

describe('Hover affordances (Req 10.2)', () => {
  // Req 10.2: action buttons carry a hover: class for an observable change.
  it('renders Hero buttons with hover: classes', () => {
    render(
      <Hero
        name={profile.name}
        role={profile.role}
        summary={profile.summary}
        cvUrl={links.cv}
        githubUrl={links.github}
        linkedinUrl={links.linkedin}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button.className).toMatch(/hover:/);
    }
  });

  // Req 10.2: project cards carry a hover: class for an observable change.
  it('renders project cards with hover: classes', () => {
    const { container } = render(<Projects projects={projects} />);
    // The focusable card is the 3D-tilt <article> (the bento grid item is its
    // <li> reveal wrapper). Behavior preserved: each card is focusable and
    // carries a hover affordance.
    const cards = container.querySelectorAll('article[tabindex="0"]');
    expect(cards.length).toBe(projects.length);
    cards.forEach((card) => {
      expect(card.className).toMatch(/hover:/);
    });
  });
});

describe('Transition durations (Req 10.3)', () => {
  // Req 10.3: every declared duration utility is within 100–500ms inclusive.
  // Tailwind `duration-N` maps milliseconds directly (duration-200 => 200ms),
  // so no utility may exceed duration-500.
  it('uses no duration utility above duration-500 across components and base styles', () => {
    const sources = readdirSync(COMPONENTS_DIR)
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
      .map((file) => readFileSync(fromHere(`./${file}`), 'utf-8'));
    sources.push(INDEX_CSS);

    const durations = sources.flatMap((src) =>
      [...src.matchAll(/duration-(\d+)/g)].map((m) => Number(m[1])),
    );

    // There should be transition durations declared somewhere.
    expect(durations.length).toBeGreaterThan(0);
    for (const ms of durations) {
      expect(ms).toBeGreaterThanOrEqual(100);
      expect(ms).toBeLessThanOrEqual(500);
    }
  });
});

describe('Body font size (Req 10.4)', () => {
  // Req 10.4: body text is rendered at a minimum of 16px.
  it('declares a body font-size rule of at least 16px in index.css', () => {
    const bodyBlock = INDEX_CSS.match(/body\s*{([^}]*)}/);
    expect(bodyBlock).not.toBeNull();

    const fontSize = bodyBlock![1].match(/font-size:\s*(\d+)px/);
    expect(fontSize).not.toBeNull();
    expect(Number(fontSize![1])).toBeGreaterThanOrEqual(16);
  });
});

describe('Focus indicators (Req 10.5)', () => {
  // Req 10.5: action buttons display an accent focus ring distinct from
  // default/hover states.
  it('renders Hero buttons with focus-visible:ring-accent', () => {
    render(
      <Hero
        name={profile.name}
        role={profile.role}
        summary={profile.summary}
        cvUrl={links.cv}
        githubUrl={links.github}
        linkedinUrl={links.linkedin}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button.className).toMatch(/focus-visible:ring-accent/);
    }
  });

  // Req 10.5: project cards display an accent focus ring.
  it('renders project cards with focus-visible:ring-accent', () => {
    const { container } = render(<Projects projects={projects} />);
    // The focusable card is the 3D-tilt <article> nested in its <li> wrapper.
    const cards = container.querySelectorAll('article[tabindex="0"]');
    expect(cards.length).toBe(projects.length);
    cards.forEach((card) => {
      expect(card.className).toMatch(/focus-visible:ring-accent/);
    });
  });
});
