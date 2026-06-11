// Feature: portfolio-animation-upgrade, Property 5: Reduced-motion minimizes micro-interactions
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveMicroInteraction } from './reducedMotion';
import type { MicroInteractionConfig } from './types';

/**
 * Property 5: Reduced-motion minimizes micro-interactions.
 *
 * For any MicroInteractionConfig, resolving it with reducedMotion === true
 * produces a config whose `active` value equals its `rest` value, so the
 * physics feedback (and any SVG-draw driven by the same active/rest delta) is
 * minimized to no visible movement.
 *
 * Validates: Requirements 7.2
 */

/** Arbitrary MicroInteractionConfig spanning the full input space. */
const microConfigArb: fc.Arbitrary<MicroInteractionConfig> = fc.record({
  property: fc.constantFrom<MicroInteractionConfig['property']>(
    'scale',
    'translateY',
    'rotate',
  ),
  // Durations include negative, zero, huge, and special values.
  durationMs: fc.oneof(
    fc.double({ noNaN: true }),
    fc.constantFrom(-1000, 0, 600, 5000, Number.POSITIVE_INFINITY, Number.NaN),
  ),
  // rest and active drawn independently so they may differ in the input.
  rest: fc.double({ noNaN: true }),
  active: fc.double({ noNaN: true }),
});

describe('resolveMicroInteraction reduced-motion minimization', () => {
  it('sets active equal to rest when reduced motion is enabled', () => {
    fc.assert(
      fc.property(microConfigArb, (base) => {
        const resolved = resolveMicroInteraction(base, true);

        // No visible movement: the active state collapses onto the rest state.
        expect(resolved.active).toBe(resolved.rest);
        // rest itself is preserved from the input (resolution does not invent a value).
        expect(resolved.rest).toBe(base.rest);
      }),
      { numRuns: 100 },
    );
  });
});
