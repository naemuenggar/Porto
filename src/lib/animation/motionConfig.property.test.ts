// Feature: portfolio-animation-upgrade, Property 7
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  getAnimatedProperties,
  ALLOWED_REVEAL_PROPERTIES,
} from './motionConfig';
import type { RevealConfig } from './types';

/**
 * Property 7: Reveals animate only compositor-friendly properties.
 *
 * Validates: Requirements 10.1
 *
 * For any RevealConfig, `getAnimatedProperties(config)` must return only
 * properties drawn from {@link ALLOWED_REVEAL_PROPERTIES}
 * (`opacity`, `transform(y)`, `transform(scale)`). It must never report a
 * layout-affecting (width/height/margin/top/left) or color property, since
 * those are not compositor-friendly. The generator explores the full
 * RevealConfig input space: opacity is always present, while `y` and `scale`
 * are independently present or absent on each of `from` / `to`.
 */

/** Arbitrary for one endpoint of a reveal (opacity required, y/scale optional). */
const revealEndpointArb = fc.record(
  {
    opacity: fc.double({ min: 0, max: 1, noNaN: true }),
    y: fc.option(fc.double({ min: -200, max: 200, noNaN: true }), { nil: undefined }),
    scale: fc.option(fc.double({ min: 0, max: 3, noNaN: true }), { nil: undefined }),
  },
  { requiredKeys: ['opacity'] },
);

/** Arbitrary for a full RevealConfig spanning the input space. */
const revealConfigArb: fc.Arbitrary<RevealConfig> = fc.record(
  {
    from: revealEndpointArb,
    to: revealEndpointArb,
    durationMs: fc.double({ min: 0, max: 5000, noNaN: true }),
    staggerMs: fc.option(fc.double({ min: 0, max: 2000, noNaN: true }), { nil: undefined }),
    once: fc.constant<true>(true),
  },
  { requiredKeys: ['from', 'to', 'durationMs', 'once'] },
) as fc.Arbitrary<RevealConfig>;

const ALLOWED = new Set<string>(ALLOWED_REVEAL_PROPERTIES);

/** Properties that must never appear: layout-affecting and color channels. */
const FORBIDDEN_PROPERTIES = [
  'width',
  'height',
  'margin',
  'padding',
  'top',
  'left',
  'right',
  'bottom',
  'color',
  'background',
  'background-color',
];

describe('getAnimatedProperties compositor-friendly subset', () => {
  // Feature: portfolio-animation-upgrade, Property 7: Reveals animate only compositor-friendly properties
  it('always returns a subset of ALLOWED_REVEAL_PROPERTIES, never layout/color properties', () => {
    fc.assert(
      fc.property(revealConfigArb, (config) => {
        const properties = getAnimatedProperties(config);

        // Every returned property is within the allowed compositor-friendly set.
        for (const property of properties) {
          expect(ALLOWED.has(property)).toBe(true);
        }

        // No forbidden layout/color property is ever present.
        for (const forbidden of FORBIDDEN_PROPERTIES) {
          expect(properties).not.toContain(forbidden);
        }

        // No duplicate properties are reported.
        expect(new Set(properties).size).toBe(properties.length);
      }),
      { numRuns: 100 },
    );
  });
});
