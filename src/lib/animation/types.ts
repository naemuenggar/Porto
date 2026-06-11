/**
 * Shared animation types and bounds constants for the portfolio animation upgrade.
 *
 * This module is part of the pure animation logic layer (`src/lib/animation/`):
 * it contains only type definitions and constants with no React or DOM side
 * effects, so it is freely importable by both the pure resolvers and the React
 * adapters that bind them to Motion / Anime.js.
 *
 * Requirements: 3.5 (per-element ownership), 4.4 (Motion duration bound),
 * 5.4 (Timeline micro-interaction duration bound).
 */

/** Engine identifier used by the ownership registry. */
export type Engine = 'motion' | 'anime';

/**
 * Reveal/stagger config consumed by Motion adapters.
 *
 * Only `opacity` and `transform` (`y`, `scale`) are expressed so Motion stays
 * within compositor-friendly properties and its bounded scope (Req 3.1, 10.1).
 */
export interface RevealConfig {
  /** Initial offset/scale for entrance (transform + opacity only). */
  from: { opacity: number; y?: number; scale?: number };
  /** Terminal/visible state for entrance (transform + opacity only). */
  to: { opacity: number; y?: number; scale?: number };
  /** Animation duration; clamped to <= MOTION_MAX_DURATION_MS. */
  durationMs: number;
  /** Optional per-child stagger delay; clamped to <= MOTION_MAX_DURATION_MS. */
  staggerMs?: number;
  /** Reveal once and do not re-trigger on subsequent scroll passes (Req 4.3). */
  once: true;
}

/**
 * Physics micro-interaction config consumed by Anime.js adapters.
 *
 * Restricted to transform sub-properties so it never collides with Motion's
 * reveal ownership on the same element (Req 3.4).
 */
export interface MicroInteractionConfig {
  /** Transform sub-property animated by the micro-interaction. */
  property: 'scale' | 'translateY' | 'rotate';
  /** Animation duration; clamped to <= TIMELINE_MAX_MICRO_DURATION_MS. */
  durationMs: number;
  /** Resting (idle) value of the animated property. */
  rest: number;
  /** Active (hover/focus) value of the animated property. */
  active: number;
}

/** Declarative per-element animation ownership (Req 3.5). */
export interface Ownership {
  /** Logical element identifier. */
  elementId: string;
  /** Engine that owns the listed properties on this element. */
  engine: Engine;
  /** CSS properties this engine controls on the element. */
  properties: string[];
}

/** Maximum duration (ms) for a Motion entrance or stagger animation (Req 4.4). */
export const MOTION_MAX_DURATION_MS = 1000;

/** Maximum duration (ms) for an Anime.js micro-interaction (Req 5.4). */
export const TIMELINE_MAX_MICRO_DURATION_MS = 600;
