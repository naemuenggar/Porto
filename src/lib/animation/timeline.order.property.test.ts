// Feature: portfolio-animation-upgrade, Property 8
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { buildTimeline, type TimelineStep } from './timelineConfig';

/**
 * Property 8: Timelines preserve step order.
 *
 * Validates: Requirements 5.5
 *
 * For any list of timeline steps, `buildTimeline(steps)` produces a `steps`
 * array that preserves the exact input order of the steps — the same
 * `property` / `to` / `durationMs` (and `offsetMs`) sequence — so the timeline
 * executes its steps in the defined order.
 */

/** Arbitrary single timeline step covering the full declarative input space. */
const timelineStepArb: fc.Arbitrary<TimelineStep> = fc.record(
  {
    property: fc.constantFrom<TimelineStep['property']>('scale', 'translateY', 'rotate'),
    to: fc.double({ noNaN: true }),
    durationMs: fc.double({ noNaN: true }),
    offsetMs: fc.option(fc.double({ noNaN: true }), { nil: undefined }),
  },
  { requiredKeys: ['property', 'to', 'durationMs'] },
);

/** Arbitrary list of steps, including the empty timeline. */
const timelineStepsArb: fc.Arbitrary<TimelineStep[]> = fc.array(timelineStepArb, {
  minLength: 0,
  maxLength: 20,
});

describe('timeline step order preservation', () => {
  // Feature: portfolio-animation-upgrade, Property 8: Timelines preserve step order
  it('buildTimeline preserves the exact input order of steps', () => {
    fc.assert(
      fc.property(timelineStepsArb, (steps) => {
        const timeline = buildTimeline(steps);

        // Same number of steps, no additions or drops.
        expect(timeline.steps).toHaveLength(steps.length);

        // Each step matches the input at the same index, in the same order.
        timeline.steps.forEach((step, index) => {
          const original = steps[index];
          expect(step.property).toBe(original.property);
          expect(step.to).toBe(original.to);
          expect(step.durationMs).toBe(original.durationMs);
          expect(step.offsetMs).toBe(original.offsetMs);
        });

        // The ordered (property/to/durationMs) sequence is identical.
        const sequence = (list: readonly TimelineStep[]) =>
          list.map((s) => `${s.property}|${s.to}|${s.durationMs}|${s.offsetMs}`);
        expect(sequence(timeline.steps)).toEqual(sequence(steps));
      }),
      { numRuns: 100 },
    );
  });
});
