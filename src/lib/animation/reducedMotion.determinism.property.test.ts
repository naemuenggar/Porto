// Feature: portfolio-animation-upgrade, Property 6: Reduced-motion resolution is a deterministic function of the current preference
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  resolveRevealConfig,
  resolveMicroInteraction,
} from './reducedMotion';
import type { MicroInteractionConfig, RevealConfig } from './types';

/**
 * Property 6: Reduced-motion resolution is a deterministic function of the
 * current reduced-motion preference.
 *
 * Validates: Requirements 7.4
 *
 * For any animation config and any reduced-motion flag, the resolved output
 * depends only on (config, flag): resolving the same input twice yields
 * deep-equal results. This makes a preference change during the session a
 * deterministic governor of every subsequently triggered animation (Req 7.4).
 */

/**
 * Arbitrary that produces a wide range of duration values, including the edge
 * cases the resolvers must handle deterministically: negative, zero, large,
 * NaN, and the infinities.
 */
const durationArb: fc.Arbitrary<number> = fc.oneof(
  fc.double({ min: -1000, max: 5000, noNaN: false }),
  fc.constant(0),
  fc.constant(Number.NaN),
  fc.constant(Number.POSITIVE_INFINITY),
  fc.constant(Number.NEGATIVE_INFINITY),
);

/** Arbitrary for the opacity/offset/scale endpoints of a reveal config. */
const revealEndpointArb: fc.Arbitrary<{
  opacity: number;
  y?: number;
  scale?: number;
}> = fc.record(
  {
    opacity: fc.double({ min: 0, max: 1, noNaN: true }),
    y: fc.option(fc.double({ min: -200, max: 200, noNaN: true }), {
      nil: undefined,
    }),
    scale: fc.option(fc.double({ min: 0, max: 3, noNaN: true }), {
      nil: undefined,
    }),
  },
  { requiredKeys: ['opacity'] },
);

/** Arbitrary RevealConfig spanning the meaningful input space. */
const revealConfigArb: fc.Arbitrary<RevealConfig> = fc.record(
  {
    from: revealEndpointArb,
    to: revealEndpointArb,
    durationMs: durationArb,
    staggerMs: fc.option(durationArb, { nil: undefined }),
    once: fc.constant<true>(true),
  },
  { requiredKeys: ['from', 'to', 'durationMs', 'once'] },
);

/** Arbitrary MicroInteractionConfig spanning the meaningful input space. */
const microConfigArb: fc.Arbitrary<MicroInteractionConfig> = fc.record({
  property: fc.constantFrom('scale', 'translateY', 'rotate'),
  durationMs: durationArb,
  rest: fc.double({ min: -10, max: 10, noNaN: true }),
  active: fc.double({ min: -10, max: 10, noNaN: true }),
});

describe('reduced-motion resolution determinism (Property 6)', () => {
  it('resolveRevealConfig is a deterministic function of (config, reducedMotion)', () => {
    fc.assert(
      fc.property(revealConfigArb, fc.boolean(), (config, reducedMotion) => {
        const first = resolveRevealConfig(config, reducedMotion);
        const second = resolveRevealConfig(config, reducedMotion);
        expect(second).toEqual(first);
      }),
      { numRuns: 200 },
    );
  });

  it('resolveMicroInteraction is a deterministic function of (config, reducedMotion)', () => {
    fc.assert(
      fc.property(microConfigArb, fc.boolean(), (config, reducedMotion) => {
        const first = resolveMicroInteraction(config, reducedMotion);
        const second = resolveMicroInteraction(config, reducedMotion);
        expect(second).toEqual(first);
      }),
      { numRuns: 200 },
    );
  });
});
