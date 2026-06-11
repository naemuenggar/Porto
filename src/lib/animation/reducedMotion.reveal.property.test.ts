// Feature: portfolio-animation-upgrade, Property 4
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveRevealConfig } from './reducedMotion';
import type { RevealConfig } from './types';

/**
 * Property 4: Reduced-motion reveals end visible with no large motion.
 *
 * **Validates: Requirements 7.1, 7.5**
 *
 * For arbitrary RevealConfig inputs, when `reducedMotion` is `true`,
 * `resolveRevealConfig` must leave content in its final, readable state:
 * - terminal opacity is fully visible (`to.opacity === 1`) (Req 7.5), and
 * - there is no large positional/scale entrance motion, i.e. the `from`
 *   positional/scale values equal the `to` values (Req 7.1).
 */

/** Arbitrary finite number including negatives, zero, and large magnitudes. */
const finiteNumberArb: fc.Arbitrary<number> = fc.double({
  noNaN: true,
  noDefaultInfinity: true,
});

/** Arbitrary transform endpoint: opacity always present, y/scale optional. */
const endpointArb = fc.record(
  {
    opacity: finiteNumberArb,
    y: finiteNumberArb,
    scale: finiteNumberArb,
  },
  { requiredKeys: ['opacity'] },
);

/** Arbitrary RevealConfig spanning the full input space. */
const revealConfigArb: fc.Arbitrary<RevealConfig> = fc.record(
  {
    from: endpointArb,
    to: endpointArb,
    durationMs: finiteNumberArb,
    staggerMs: fc.option(finiteNumberArb, { nil: undefined }),
    once: fc.constant<true>(true),
  },
  { requiredKeys: ['from', 'to', 'durationMs', 'once'] },
) as fc.Arbitrary<RevealConfig>;

describe('resolveRevealConfig reduced-motion final-visible', () => {
  it('ends fully visible with no positional/scale motion when reduced motion is on', () => {
    fc.assert(
      fc.property(revealConfigArb, (base) => {
        const resolved = resolveRevealConfig(base, true);

        // Req 7.5: content remains readable in its final state.
        expect(resolved.to.opacity).toBe(1);

        // Req 7.1: no large positional/scale entrance motion — `from`
        // positional/scale values match the terminal `to` values.
        expect(resolved.from.opacity).toBe(resolved.to.opacity);
        expect(resolved.from.y).toBe(resolved.to.y);
        expect(resolved.from.scale).toBe(resolved.to.scale);
      }),
      { numRuns: 100 },
    );
  });
});
