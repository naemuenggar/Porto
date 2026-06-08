import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { Skills } from './Skills';
import type { Skill, SkillCategory } from '../types';

/**
 * Property-based test for Property 3 (Req 4.1, 4.3).
 *
 * For any list of skills, the Skills section renders exactly one card per
 * skill (no two skills merged into a single element) and each rendered card
 * contains BOTH the skill's icon and its text label.
 *
 * Generation strategy:
 * - A stub Icon component renders an identifiable <svg data-testid="skill-icon">
 *   so we can count icons and locate the icon within each card.
 * - Names are non-empty (after trim) and unique, so each label is queryable and
 *   React keys (keyed on `name`) stay stable across the generated list.
 * - The generated skills are wrapped in a single category, exercising the
 *   one-card-per-skill invariant across many list shapes.
 */

/** Identifiable stub icon used in place of a real react-icons component. */
function StubIcon({ className }: { className?: string }): JSX.Element {
  return <svg data-testid="skill-icon" className={className} />;
}

/** Arbitrary for non-empty, unique skill names. */
const skillNamesArb = fc.uniqueArray(
  fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  { minLength: 0, maxLength: 15 },
);

describe('Skills (each skill renders exactly one card with icon and label)', () => {
  // Feature: personal-portfolio-website, Property 3: Each skill renders exactly one card containing its icon and label
  it('renders one card per skill, each containing the icon and its text label', () => {
    fc.assert(
      fc.property(skillNamesArb, (names) => {
        const skills: Skill[] = names.map((name) => ({ name, Icon: StubIcon }));
        const categories: SkillCategory[] = [{ title: 'Category', skills }];

        const { container } = render(<Skills categories={categories} />);

        try {
          // One element per skill: card count equals the list length.
          const cards = Array.from(container.querySelectorAll('li'));
          expect(cards).toHaveLength(skills.length);

          // One icon per skill overall (no card empty, none merged).
          const icons = container.querySelectorAll('[data-testid="skill-icon"]');
          expect(icons).toHaveLength(skills.length);

          // Each card contains exactly one icon AND its text label.
          cards.forEach((card, index) => {
            const cardIcons = card.querySelectorAll('[data-testid="skill-icon"]');
            expect(cardIcons).toHaveLength(1);
            expect(card.textContent).toContain(skills[index].name);
          });
        } finally {
          cleanup();
        }
      }),
      { numRuns: 100 },
    );
  });
});
