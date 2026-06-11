/**
 * Pure timeline/micro-interaction configuration for the Anime.js
 * (`Timeline_Engine`) adapters.
 *
 * This module is part of the pure animation logic layer (`src/lib/animation/`):
 * it contains only data and order-preserving transforms with no React, DOM, or
 * Anime.js side effects, so it can be property-tested in isolation and consumed
 * by the `useMicroInteraction` / `useSvgDraw` adapters.
 *
 * It provides:
 *   - sensible `MicroInteractionConfig` defaults for the project's recurring
 *     interaction patterns (button press, hover lift, focus nudge); and
 *   - a multi-step timeline builder that preserves the exact input order of its
 *     steps in the produced execution sequence (Req 5.5).
 *
 * Requirements: 5.5 (multi-step timelines execute steps in the defined order).
 */

import { MicroInteractionConfig } from './types';

/**
 * Re-exported micro-interaction duration bound (Req 5.4) so the Anime.js
 * (`Timeline_Engine`) adapters can treat `timelineConfig.ts` as their single
 * import point for both configs and bounds, matching the design grouping.
 */
export { TIMELINE_MAX_MICRO_DURATION_MS } from './types';

/**
 * Default micro-interaction presets, keyed by interaction intent.
 *
 * Each preset stays within the transform-only property set (Req 3.4) and a
 * duration at or below `TIMELINE_MAX_MICRO_DURATION_MS` so it satisfies the
 * micro-interaction duration bound before any further resolution (Req 5.4).
 */
export const MICRO_INTERACTION_DEFAULTS = {
  /** Subtle press-in feedback for buttons / pressable controls. */
  buttonPress: {
    property: 'scale',
    durationMs: 180,
    rest: 1,
    active: 0.96,
  },
  /** Gentle upward lift on hover/focus for cards and links. */
  hoverLift: {
    property: 'translateY',
    durationMs: 220,
    rest: 0,
    active: -4,
  },
  /** Small rotational nudge for playful icon accents. */
  iconNudge: {
    property: 'rotate',
    durationMs: 240,
    rest: 0,
    active: 8,
  },
} as const satisfies Record<string, MicroInteractionConfig>;

/** Identifier of a built-in micro-interaction default preset. */
export type MicroInteractionPreset = keyof typeof MICRO_INTERACTION_DEFAULTS;

/**
 * A single step in a multi-step timeline.
 *
 * Steps are intentionally declarative and engine-agnostic: each names the
 * transform sub-property it animates, the value to animate toward, and the
 * duration the step occupies. The Anime.js adapter maps these onto a real
 * timeline; this module only models and orders them.
 */
export interface TimelineStep {
  /** Transform sub-property animated by this step. */
  property: MicroInteractionConfig['property'];
  /** Target value the property animates to during this step. */
  to: number;
  /** Duration (ms) of this step. */
  durationMs: number;
  /** Optional offset/delay (ms) before this step begins. */
  offsetMs?: number;
}

/**
 * An ordered, executable multi-step timeline.
 *
 * `steps` is a defensive copy of the builder input in the exact same order,
 * guaranteeing the produced execution sequence matches the defined order
 * (Req 5.5).
 */
export interface Timeline {
  /** The steps to execute, in their defined order. */
  steps: TimelineStep[];
  /** Total duration (ms): the sum of each step's offset + duration span. */
  totalDurationMs: number;
}

/**
 * Build a multi-step timeline from an ordered list of steps.
 *
 * The builder is pure and order-preserving: the returned `steps` array contains
 * exactly the input steps, in the exact same order they were supplied, so the
 * timeline executes its steps in the defined order (Req 5.5). A shallow copy is
 * returned so callers cannot mutate the builder's view of the sequence.
 *
 * @param steps The timeline steps in the order they should execute.
 * @returns A {@link Timeline} preserving the input step order.
 */
export function buildTimeline(steps: readonly TimelineStep[]): Timeline {
  const orderedSteps = steps.map((step) => ({ ...step }));
  const totalDurationMs = orderedSteps.reduce(
    (total, step) => total + (step.offsetMs ?? 0) + step.durationMs,
    0,
  );
  return { steps: orderedSteps, totalDurationMs };
}
