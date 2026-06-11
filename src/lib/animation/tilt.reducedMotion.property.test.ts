// Feature: portfolio-animation-upgrade, Property 11
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeTilt, NEUTRAL_TILT } from './tilt';
import type { TiltInput } from './tilt';
import { resolveMediaPlayback } from './media';
import type { PlaybackInput } from './media';

/**
 * Property 11: Reduced motion neutralizes tilt, glare, SVG draw, and media autoplay.
 *
 * **Validates: Requirements 7.1, 7.2, 7.5**
 *
 * When reduced motion is preferred, the Premium Project Card must present its
 * content statically — no 3D tilt, no glare, and no autoplaying media:
 * - For arbitrary pointer coordinates and arbitrary card rects,
 *   `computeTilt(input, true)` returns exactly `NEUTRAL_TILT`
 *   (rotateX: 0, rotateY: 0, glareX: 0.5, glareY: 0.5, glareOpacity: 0). (Req 7.1)
 * - For arbitrary `PlaybackInput`, `resolveMediaPlayback(input, true)` returns
 *   `{ playing: false, showPoster: true }` so media never autoplays and the
 *   static poster is shown. (Req 7.2, 7.5)
 */

/**
 * Arbitrary finite number including negatives, zero, and large magnitudes,
 * plus the degenerate values (NaN / ±Infinity) so the neutralization holds
 * across the entire input space, not just the well-formed one.
 */
const numberArb: fc.Arbitrary<number> = fc.oneof(
  fc.double({ noNaN: true, noDefaultInfinity: true }),
  fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
);

/** Arbitrary card rect spanning valid, degenerate, and non-finite shapes. */
const rectArb = fc.record({
  left: numberArb,
  top: numberArb,
  width: numberArb,
  height: numberArb,
});

/** Arbitrary tilt input: any pointer position over any rect. */
const tiltInputArb: fc.Arbitrary<TiltInput> = fc.record({
  pointerX: numberArb,
  pointerY: numberArb,
  rect: rectArb,
});

/** Arbitrary optional maxDeg, including the degenerate values. */
const maxDegArb = fc.option(numberArb, { nil: undefined });

/** Arbitrary playback input over all hovered/mediaPresent combinations. */
const playbackInputArb: fc.Arbitrary<PlaybackInput> = fc.record({
  hovered: fc.boolean(),
  mediaPresent: fc.boolean(),
});

describe('reduced motion neutralizes the Premium Project Card', () => {
  it('computeTilt(..., true) returns NEUTRAL_TILT for any pointer/rect/maxDeg', () => {
    fc.assert(
      fc.property(tiltInputArb, maxDegArb, (input, maxDeg) => {
        const result = computeTilt(input, true, maxDeg);

        // Req 7.1: no tilt, no glare under reduced motion — the full
        // NEUTRAL_TILT shape, value-for-value.
        expect(result).toEqual(NEUTRAL_TILT);
        expect(result.rotateX).toBe(0);
        expect(result.rotateY).toBe(0);
        expect(result.glareX).toBe(0.5);
        expect(result.glareY).toBe(0.5);
        expect(result.glareOpacity).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it('resolveMediaPlayback(..., true) never plays and always shows the poster', () => {
    fc.assert(
      fc.property(playbackInputArb, (input) => {
        const result = resolveMediaPlayback(input, true);

        // Req 7.2 / 7.5: media never autoplays under reduced motion; the
        // static poster is shown instead.
        expect(result).toEqual({ playing: false, showPoster: true });
      }),
      { numRuns: 100 },
    );
  });
});
