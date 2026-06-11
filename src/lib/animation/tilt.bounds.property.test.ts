// Feature: portfolio-animation-upgrade, Property 10
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { computeTilt, MAX_TILT_DEG, type TiltInput } from './tilt';

/**
 * Property 10: 3D tilt and glare stay within bounds for any cursor position.
 *
 * Validates: Requirements 10.1
 *
 * For any pointer coordinates over any bounding rect (including degenerate
 * zero/negative-size rects and pointers outside the card), `computeTilt`
 * (with `reducedMotion === false`) always produces:
 * - `rotateX` and `rotateY` within `[-MAX_TILT_DEG, MAX_TILT_DEG]`,
 * - `glareX` and `glareY` within `[0, 1]`,
 * - `glareOpacity` within `[0, 1]`.
 *
 * Additionally, a pointer exactly at the card center yields approximately
 * neutral rotation (`rotateX ≈ 0`, `rotateY ≈ 0`).
 */

/** Arbitrary finite coordinate spanning typical and extreme viewport values. */
const coordArb: fc.Arbitrary<number> = fc.double({
  noNaN: true,
  noDefaultInfinity: true,
  min: -10_000,
  max: 10_000,
});

/**
 * Arbitrary rect covering well-formed and degenerate cases: width/height can be
 * zero or negative so the test exercises the degenerate-rect branch too.
 */
const rectArb: fc.Arbitrary<TiltInput['rect']> = fc.record({
  left: coordArb,
  top: coordArb,
  width: fc.double({ noNaN: true, noDefaultInfinity: true, min: -500, max: 2_000 }),
  height: fc.double({ noNaN: true, noDefaultInfinity: true, min: -500, max: 2_000 }),
});

/** Arbitrary pointer + rect, with pointers free to land inside or outside the card. */
const tiltInputArb: fc.Arbitrary<TiltInput> = fc.record({
  pointerX: coordArb,
  pointerY: coordArb,
  rect: rectArb,
});

/**
 * Arbitrary well-formed rect with realistic pixel dimensions. Unlike `rectArb`,
 * width/height are bounded away from zero so the geometric center is actually
 * representable (denormal widths like `5e-324` would make `width / 2` underflow
 * to `0`, collapsing the "center" onto an edge). The center-neutrality contract
 * only holds for cards a user could actually point at.
 */
const wellFormedRectArb: fc.Arbitrary<TiltInput['rect']> = fc.record({
  left: coordArb,
  top: coordArb,
  width: fc.double({ noNaN: true, noDefaultInfinity: true, min: 1, max: 2_000 }),
  height: fc.double({ noNaN: true, noDefaultInfinity: true, min: 1, max: 2_000 }),
});

describe('tilt + glare bounds', () => {
  // Feature: portfolio-animation-upgrade, Property 10: 3D tilt and glare stay within bounds for any cursor position
  it('keeps rotation, glare position, and glare opacity within bounds for any input', () => {
    fc.assert(
      fc.property(tiltInputArb, (input) => {
        const out = computeTilt(input, false);

        // Rotation stays within the configured tilt limit on both axes.
        expect(out.rotateX).toBeGreaterThanOrEqual(-MAX_TILT_DEG);
        expect(out.rotateX).toBeLessThanOrEqual(MAX_TILT_DEG);
        expect(out.rotateY).toBeGreaterThanOrEqual(-MAX_TILT_DEG);
        expect(out.rotateY).toBeLessThanOrEqual(MAX_TILT_DEG);

        // Glare position stays normalized to [0, 1] on both axes.
        expect(out.glareX).toBeGreaterThanOrEqual(0);
        expect(out.glareX).toBeLessThanOrEqual(1);
        expect(out.glareY).toBeGreaterThanOrEqual(0);
        expect(out.glareY).toBeLessThanOrEqual(1);

        // Glare opacity stays within [0, 1].
        expect(out.glareOpacity).toBeGreaterThanOrEqual(0);
        expect(out.glareOpacity).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-animation-upgrade, Property 10: pointer at card center yields neutral rotation
  it('yields approximately neutral rotation for a pointer exactly at the card center', () => {
    fc.assert(
      fc.property(wellFormedRectArb, (rect) => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const out = computeTilt({ pointerX: centerX, pointerY: centerY, rect }, false);

        expect(out.rotateX).toBeCloseTo(0, 6);
        expect(out.rotateY).toBeCloseTo(0, 6);
      }),
      { numRuns: 100 },
    );
  });
});
