// Feature: portfolio-animation-upgrade, Property 9
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  mapVariantToSpanClasses,
  VARIANT_SPAN_CLASSES,
  type ProjectCardVariant,
} from './bento';

/**
 * Property 9: Bento variant → span mapping is total.
 *
 * Validates: Requirements 9.3, 9.4
 *
 * `mapVariantToSpanClasses` must be a TOTAL function: for any input — the four
 * known variants ('featured' | 'wide' | 'tall' | 'standard'), arbitrary
 * strings, and `undefined` — it must always return a defined string that is one
 * of the values declared in `VARIANT_SPAN_CLASSES`. Unknown or `undefined`
 * inputs must fall back to the `standard` span so the bento layout can never
 * break on bad/absent `content.ts` data.
 */

/** The four known, statically declared variants. */
const KNOWN_VARIANTS: readonly ProjectCardVariant[] = [
  'featured',
  'wide',
  'tall',
  'standard',
];

/** The set of allowed output strings (the values of VARIANT_SPAN_CLASSES). */
const ALLOWED_SPAN_VALUES = new Set<string>(Object.values(VARIANT_SPAN_CLASSES));

/**
 * Arbitrary input covering the full input space:
 *   - the four known variants (so they are always exercised),
 *   - arbitrary strings (unknown variants, including the empty string and
 *     values that might collide with Object.prototype keys),
 *   - `undefined` (absent variant on a Project).
 */
const variantInputArb: fc.Arbitrary<string | undefined> = fc.oneof(
  fc.constantFrom(...KNOWN_VARIANTS),
  fc.string(),
  fc.constantFrom(
    '',
    'STANDARD',
    'Featured',
    'toString',
    'hasOwnProperty',
    'constructor',
    '__proto__',
    'unknown-variant',
  ),
  fc.constant(undefined),
);

describe('bento variant → span mapping', () => {
  // Feature: portfolio-animation-upgrade, Property 9: Bento variant → span mapping is total
  it('always returns a defined string drawn from VARIANT_SPAN_CLASSES values', () => {
    fc.assert(
      fc.property(variantInputArb, (variant) => {
        const result = mapVariantToSpanClasses(variant);

        // The result is always a defined string.
        expect(typeof result).toBe('string');

        // The result is always one of the declared span values.
        expect(ALLOWED_SPAN_VALUES.has(result)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-animation-upgrade, Property 9: Bento variant → span mapping is total
  it('returns the standard span for unknown or undefined inputs', () => {
    fc.assert(
      fc.property(variantInputArb, (variant) => {
        const isKnown =
          variant !== undefined &&
          (KNOWN_VARIANTS as readonly string[]).includes(variant);

        if (!isKnown) {
          expect(mapVariantToSpanClasses(variant)).toBe(
            VARIANT_SPAN_CLASSES.standard,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-animation-upgrade, Property 9: Bento variant → span mapping is total
  it('maps each known variant to its declared span classes', () => {
    fc.assert(
      fc.property(fc.constantFrom(...KNOWN_VARIANTS), (variant) => {
        expect(mapVariantToSpanClasses(variant)).toBe(
          VARIANT_SPAN_CLASSES[variant],
        );
      }),
      { numRuns: 100 },
    );
  });
});
