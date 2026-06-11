/**
 * Reduced-motion detection and config resolution.
 *
 * The pure resolvers in this module (`prefersReducedMotion`,
 * `resolveRevealConfig`, `resolveMicroInteraction`) are side-effect-free and have
 * no React or DOM dependencies. Reduced motion is resolved centrally (not per
 * component) so Requirement 7 is satisfied uniformly: any animation config can be
 * transformed into a reduced-motion-safe config by a single resolver.
 *
 * This module also exports the React `useReducedMotion` hook (task 6.1) — the one
 * effectful adapter here — which subscribes to
 * `matchMedia('(prefers-reduced-motion: reduce)')`, re-renders on change, and
 * cleans up its listener on unmount so subsequently triggered animations use the
 * updated preference (Req 7.4).
 *
 * Requirements:
 * - 4.4  Motion entrance/stagger durations are clamped to MOTION_MAX_DURATION_MS.
 * - 5.4  Micro-interaction durations are clamped to TIMELINE_MAX_MICRO_DURATION_MS.
 * - 7.1  Reduced motion presents content in its final state without large
 *        positional or scaling entrance animations.
 * - 7.2  Reduced motion skips/minimizes physics micro-interactions.
 * - 7.4  Resolution is a deterministic function of the current preference flag;
 *        the hook applies preference changes to subsequently triggered animations.
 * - 7.5  Reduced motion keeps content readable (terminal opacity fully visible).
 */

import { useEffect, useState } from 'react';
import {
  MOTION_MAX_DURATION_MS,
  TIMELINE_MAX_MICRO_DURATION_MS,
  type MicroInteractionConfig,
  type RevealConfig,
} from './types';

/** Media query string for the reduced-motion user preference. */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Opacity value treated as fully visible / readable. */
const FULLY_VISIBLE_OPACITY = 1;

/**
 * Clamp a duration into `[0, max]`.
 *
 * Handles the full range of "any requested duration" (Req 4.4 / 5.4):
 * - negative values clamp up to 0,
 * - values above the maximum clamp down to `max`,
 * - `NaN` is treated as 0 (no animation) rather than propagating,
 * - `Infinity` clamps to `max`, `-Infinity` clamps to 0.
 */
function clampDuration(value: number, max: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), max);
}

/**
 * Pure: read a reduced-motion preference flag from an optional media-query-list
 * source and return the effective flag.
 *
 * An absent/undefined source is treated as "no preference" (animations
 * enabled), so callers without `matchMedia` (e.g. SSR or a jsdom environment
 * that omits it) never throw and default to motion enabled (Req 7, 11.2).
 *
 * @param mql Optional object exposing a `matches` boolean (a `MediaQueryList`).
 * @returns `true` when reduced motion is preferred, otherwise `false`.
 */
export function prefersReducedMotion(mql?: { matches: boolean } | null): boolean {
  return mql?.matches ?? false;
}

/**
 * Pure: resolve a reveal config against the current reduced-motion preference.
 *
 * Always clamps `durationMs` and (when present) `staggerMs` into
 * `[0, MOTION_MAX_DURATION_MS]` (Req 4.4).
 *
 * When `reducedMotion` is `true`, the entrance is collapsed so there is no large
 * positional or scaling motion: the `from` positional/scale values are equalized
 * to the terminal (`to`) values and the terminal opacity is forced fully visible,
 * leaving content in its final, readable state (Req 7.1, 7.5).
 *
 * @param base The requested reveal config.
 * @param reducedMotion Whether reduced motion is currently preferred.
 * @returns A new, reduced-motion-safe reveal config (the input is not mutated).
 */
export function resolveRevealConfig(
  base: RevealConfig,
  reducedMotion: boolean,
): RevealConfig {
  const durationMs = clampDuration(base.durationMs, MOTION_MAX_DURATION_MS);
  const staggerMs =
    base.staggerMs === undefined
      ? undefined
      : clampDuration(base.staggerMs, MOTION_MAX_DURATION_MS);

  if (!reducedMotion) {
    return {
      ...base,
      from: { ...base.from },
      to: { ...base.to },
      durationMs,
      staggerMs,
    };
  }

  // Reduced motion: keep the terminal position/scale, force full visibility, and
  // equalize `from` to `to` so no positional/scale value changes during entrance.
  const terminal: RevealConfig['to'] = {
    ...base.to,
    opacity: FULLY_VISIBLE_OPACITY,
  };

  return {
    ...base,
    from: { ...terminal },
    to: { ...terminal },
    durationMs,
    staggerMs,
  };
}

/**
 * Pure: resolve a micro-interaction config against the current reduced-motion
 * preference.
 *
 * Always clamps `durationMs` into `[0, TIMELINE_MAX_MICRO_DURATION_MS]` (Req 5.4).
 *
 * When `reducedMotion` is `true`, the `active` value is set equal to `rest` so the
 * physics feedback (and any SVG-draw driven by the same active/rest delta) is
 * minimized to no visible movement (Req 7.2).
 *
 * @param base The requested micro-interaction config.
 * @param reducedMotion Whether reduced motion is currently preferred.
 * @returns A new, reduced-motion-safe micro-interaction config (input not mutated).
 */
export function resolveMicroInteraction(
  base: MicroInteractionConfig,
  reducedMotion: boolean,
): MicroInteractionConfig {
  return {
    ...base,
    durationMs: clampDuration(base.durationMs, TIMELINE_MAX_MICRO_DURATION_MS),
    active: reducedMotion ? base.rest : base.active,
  };
}

/**
 * React hook: track the user's reduced-motion preference reactively.
 *
 * Subscribes to `matchMedia('(prefers-reduced-motion: reduce)')` and re-renders
 * the consuming component whenever the preference changes, so any animation
 * triggered after the change observes the updated value (Req 7.4). The `change`
 * listener is removed in the effect cleanup, so the subscription is torn down on
 * unmount (and re-established if the component remounts, e.g. under StrictMode).
 *
 * Environments without `matchMedia` (SSR, or a jsdom setup that omits it) are
 * handled gracefully: the hook returns `false` ("no preference", motion enabled)
 * and registers no listener (Req 11.2).
 *
 * @returns `true` when reduced motion is currently preferred, otherwise `false`.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return prefersReducedMotion(window.matchMedia(REDUCED_MOTION_QUERY));
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia(REDUCED_MOTION_QUERY);

    // Re-sync on mount in case the preference changed between the initial render
    // and the effect running (e.g. fast preference toggles, or remount).
    setReducedMotion(prefersReducedMotion(mql));

    const handleChange = (event: MediaQueryListEvent): void => {
      setReducedMotion(event.matches);
    };

    mql.addEventListener('change', handleChange);

    return () => {
      // Isolate the listener teardown (Req 6.1): removing the subscription must
      // not throw out of cleanup even if the media-query list misbehaves. The
      // listener is added in this effect and removed here, so a StrictMode
      // mount→unmount→mount cycle nets exactly one active subscription (Req 6.2).
      try {
        mql.removeEventListener('change', handleChange);
      } catch {
        // Intentionally ignored: a failed listener removal must not break unmount.
      }
    };
  }, []);

  return reducedMotion;
}
