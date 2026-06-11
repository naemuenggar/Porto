// Feature: portfolio-animation-upgrade, Property 1: Skill labels are rendered independently of icons
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import type { ComponentType } from 'react';
import { Skills } from './Skills';
import type { Skill, SkillCategory } from '../types';

/**
 * Property-based test for Property 1 (Req 2.5).
 *
 * For ANY list of skill categories and skills — including skills whose icon
 * component renders nothing (null/undefined) — rendering the Skills section
 * displays every skill's text label, so a missing or broken icon never leaves
 * a card empty.
 *
 * Generation strategy:
 * - Icon components are drawn from a pool that deliberately INCLUDES icons that
 *   render `null` and `undefined` (the missing/broken-icon cases), alongside a
 *   normal <svg> icon. This exercises the independence of the label from the
 *   icon's rendered output.
 * - Skill names are non-empty after trim so each label is real, queryable text.
 *   Names are made unique per render so React keys (keyed on `name`) stay
 *   stable and each label can be located unambiguously in the DOM.
 * - Skills are partitioned into one or more categories, exercising the label
 *   invariant across many list shapes and category groupings.
 */

/** Normal icon that renders a real element. */
const SvgIcon: ComponentType<{ className?: string }> = ({ className }) => (
  <svg data-testid="skill-icon" className={className} />
);

/** Missing-icon case: renders nothing. */
const NullIcon: ComponentType<{ className?: string }> = () => null;

/** Broken-icon case: renders undefined. */
const UndefinedIcon: ComponentType<{ className?: string }> = () => undefined as unknown as null;

/** Icon pool that includes null- and undefined-rendering components. */
const iconArb: fc.Arbitrary<Skill['Icon']> = fc.constantFrom(
  SvgIcon,
  NullIcon,
  UndefinedIcon,
);

/** Arbitrary non-empty (after trim) base name. */
const baseNameArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s.trim().length > 0);

/**
 * Arbitrary list of categories. Names are made globally unique within the
 * generated value (by suffixing the flat index) so labels stay individually
 * queryable and React keys remain stable. Each category gets a unique title
 * for the same reason.
 */
const categoriesArb: fc.Arbitrary<SkillCategory[]> = fc
  .array(
    fc.record({
      title: baseNameArb,
      skills: fc.array(
        fc.record({ name: baseNameArb, Icon: iconArb }),
        { minLength: 0, maxLength: 8 },
      ),
    }),
    { minLength: 1, maxLength: 4 },
  )
  .map((cats) => {
    let skillIndex = 0;
    return cats.map((cat, ci) => ({
      title: `${cat.title}#cat${ci}`,
      skills: cat.skills.map((s) => ({
        name: `${s.name}#skill${skillIndex++}`,
        Icon: s.Icon,
      })),
    }));
  });

describe('Skills label independence from icons', () => {
  it('renders every skill text label regardless of whether the icon renders null/undefined', () => {
    fc.assert(
      fc.property(categoriesArb, (categories) => {
        const { container } = render(<Skills categories={categories} />);

        try {
          const allSkills: Skill[] = categories.flatMap((c) => c.skills);

          // One card per skill (no card collapsed away by a missing icon).
          // DOM card order matches the flattened category/skill order.
          const cards = Array.from(container.querySelectorAll('li'));
          expect(cards).toHaveLength(allSkills.length);

          cards.forEach((card, index) => {
            const skill = allSkills[index];

            // The label is rendered verbatim as real text, independent of
            // whether the icon rendered an element, null, or undefined.
            const label = card.querySelector('span');
            expect(label).not.toBeNull();
            expect(label?.textContent).toBe(skill.name);

            // No card is empty: it always shows the (non-whitespace) label.
            expect(card.textContent?.trim().length ?? 0).toBeGreaterThan(0);
          });
        } finally {
          cleanup();
        }
      }),
      { numRuns: 100 },
    );
  });
});
