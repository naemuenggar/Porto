// Feature: portfolio-animation-upgrade, Property 3
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveRevealConfig, resolveMicroInteraction } from './reducedMotion';
import {
  MOTION_MAX_DURATION_MS,
  TIMELINE_MAX_MICRO_DURATION_MS,
  type MicroInteractionConfig,
  type RevealConfig,
} from './types';

/**
 * Property 3: Animation durations are clamped to their engine's maximum.
 *
 * Validates: Requirements 4.4, 5.4
 *
 * For any requested duration — including negatives, NaN, Infinity/-Infinity,
 * and arbitrarily large values — the resolved configuration must expose a
 * duration that lies within `[0, max]`, where `max` is the engine bound:
 *   - Motion reveal (`resolveRevealConfig`): MOTION_MAX_DURATION_MS = 1000
 *     for both `durationMs` and the optional `staggerMs`.
 *   - Anime.js micro-interaction (`resolveMicroInteraction`): the
 *     TIMELINE_MAX_MICRO_DURATION_MS = 600 bound on `durationMs`.
 */

/**
 * Arbitrary duration covering the full "any requested duration" input space:
 * the full IEEE-754 double range (which fast-check includes NaN and ±Infinity
 * in by default) plus explicitly seeded edge cases so they are always exercised.
 */
const durationArb: fc.Arbitrary<number> = fc.oneof(
  fc.double(),
  fc.constantFrom(
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    -1,
    -1000,
    -0,
    0,
    1,
    600,
    1000,
    1_000_000,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_VALUE,
  ),
);

/** Arbitrary reveal config with an arbitrary (possibly degenerate) duration/stagger. */
const revealConfigArb: fc.Arbitrary<RevealConfig> = fc.record({
  from: fc.record({
    opacity: fc.double({ min: 0, max: 1, noNaN: true }),
    y: fc.option(fc.double({ noNaN: true }), { nil: undefined }),
    scale: fc.option(fc.double({ noNaN: true }), { nil: undefined }),
  }),
  to: fc.record({
    opacity: fc.double({ min: 0, max: 1, noNaN: true }),
    y: fc.option(fc.double({ noNaN: true }), { nil: undefined }),
    scale: fc.option(fc.double({ noNaN: true }), { nil: undefined }),
  }),
  durationMs: durationArb,
  staggerMs: fc.option(durationArb, { nil: undefined }),
  once: fc.constant(true as const),
});

/** Arbitrary micro-interaction config with an arbitrary (possibly degenerate) duration. */
const microInteractionConfigArb: fc.Arbitrary<MicroInteractionConfig> = fc.record({
  property: fc.constantFrom('scale', 'translateY', 'rotate'),
  durationMs: durationArb,
  rest: fc.double({ noNaN: true }),
  active: fc.double({ noNaN: true }),
});

/** Assert a resolved duration is a real number within the inclusive `[0, max]` range. */
function expectWithinBounds(value: number, max: number): void {
  expect(Number.isNaN(value)).toBe(false);
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(max);
}

describe('animation duration clamping', () => {
  // Feature: portfolio-animation-upgrade, Property 3: Animation durations are clamped to their engine's maximum
  it('resolveRevealConfig clamps durationMs and staggerMs into [0, MOTION_MAX_DURATION_MS]', () => {
    fc.assert(
      fc.property(revealConfigArb, fc.boolean(), (base, reducedMotion) => {
        const resolved = resolveRevealConfig(base, reducedMotion);

        expectWithinBounds(resolved.durationMs, MOTION_MAX_DURATION_MS);

        if (resolved.staggerMs !== undefined) {
          expectWithinBounds(resolved.staggerMs, MOTION_MAX_DURATION_MS);
        }

        // An absent stagger request remains absent (it is never invented).
        expect(resolved.staggerMs === undefined).toBe(base.staggerMs === undefined);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-animation-upgrade, Property 3: Animation durations are clamped to their engine's maximum
  it('resolveMicroInteraction clamps durationMs into [0, TIMELINE_MAX_MICRO_DURATION_MS]', () => {
    fc.assert(
      fc.property(microInteractionConfigArb, fc.boolean(), (base, reducedMotion) => {
        const resolved = resolveMicroInteraction(base, reducedMotion);

        expectWithinBounds(resolved.durationMs, TIMELINE_MAX_MICRO_DURATION_MS);
      }),
      { numRuns: 100 },
    );
  });
});
