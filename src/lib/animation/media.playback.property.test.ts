// Feature: portfolio-animation-upgrade, Property 12
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveMediaPlayback, type PlaybackInput } from './media';

/**
 * Property 12: Premium card media never plays while idle.
 *
 * Validates: Requirements 10.2, 10.4
 *
 * For any `PlaybackInput` ({ hovered, mediaPresent }) and any `reducedMotion`
 * boolean, `resolveMediaPlayback` must satisfy:
 *   - `playing === true` IFF (hovered && !reducedMotion && mediaPresent)
 *   - in every other case `playing` is `false` AND `showPoster` is `true`
 *   - `playing` and `showPoster` are mutually exclusive (`showPoster === !playing`)
 *   - when `hovered` is `false` (idle), `playing` must be `false`
 *
 * Reduced-motion no-autoplay (Req 7.2 spirit) is folded into this property: any
 * input with `reducedMotion === true` resolves to paused + poster.
 */

const playbackInputArb: fc.Arbitrary<PlaybackInput> = fc.record({
  hovered: fc.boolean(),
  mediaPresent: fc.boolean(),
});

describe('media playback idle-paused invariant', () => {
  // Feature: portfolio-animation-upgrade, Property 12: Premium card media never plays while idle
  it('plays IFF hovered && !reducedMotion && mediaPresent; otherwise paused with poster', () => {
    fc.assert(
      fc.property(playbackInputArb, fc.boolean(), (input, reducedMotion) => {
        const result = resolveMediaPlayback(input, reducedMotion);

        const expectedPlaying =
          input.hovered && !reducedMotion && input.mediaPresent;

        // playing === true IFF the full play condition holds.
        expect(result.playing).toBe(expectedPlaying);

        // playing and showPoster are mutually exclusive.
        expect(result.showPoster).toBe(!result.playing);

        // In all non-playing cases the poster is shown.
        if (!expectedPlaying) {
          expect(result.playing).toBe(false);
          expect(result.showPoster).toBe(true);
        }

        // Idle (not hovered) must never play.
        if (!input.hovered) {
          expect(result.playing).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });
});
