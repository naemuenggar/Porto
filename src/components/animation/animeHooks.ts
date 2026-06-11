/**
 * Anime.js (`Timeline_Engine`) React hook adapters for the portfolio animation
 * upgrade.
 *
 * This module is part of the React Animation Adapter layer
 * (`src/components/animation/`): it binds the pure animation logic layer
 * (`src/lib/animation/`) to the Anime.js engine. All animation *decisions*
 * (which values to use, how to clamp duration, how to respect reduced motion)
 * are delegated to the pure resolvers (`resolveMicroInteraction`) and the pure
 * timeline builder (`buildTimeline`); this file is responsible only for the
 * effectful binding to Anime.js and for lifecycle teardown.
 *
 * Both hooks return a React ref that the caller attaches to the DOM element the
 * animation should target. The hooks never touch the element's `tabindex` or
 * class list, so existing keyboard focusability and the accent focus ring are
 * preserved (Req 5.6).
 *
 * Design references:
 * - `useMicroInteraction` binds `pointerenter`/`focus` -> active value and
 *   `pointerleave`/`blur` -> rest value (Req 5.2, 5.3) on a transform
 *   sub-property only, so it never collides with Motion's reveal ownership
 *   (Req 3.4). It retains the created Anime.js instance and kills it on teardown
 *   (Req 6.1, 6.4).
 * - `useSvgDraw` animates `strokeDashoffset` from undrawn to fully drawn
 *   (Req 5.1), also retaining and killing its instance on teardown.
 * - Reduced motion is resolved centrally via `resolveMicroInteraction` +
 *   `useReducedMotion`, so under reduced motion the micro-interaction collapses
 *   to no visible movement (active == rest) and the SVG draw is skipped, leaving
 *   the path in its final drawn state (Req 7.2).
 * - No persistent RAF while idle (Req 10.2): Anime.js only runs its frame loop
 *   while an instance is animating. `useMicroInteraction` creates instances on
 *   interaction (not on mount), and `useSvgDraw` plays a single one-shot draw;
 *   when an animation completes Anime.js stops the loop. An idle mount therefore
 *   schedules no persistent animation frame.
 * - Post-unmount safety (Req 6.5): every callback guards against touching a
 *   detached node, and the effect cleanup removes listeners and kills the
 *   retained instance, so nothing updates a node removed from the document.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.6, 6.1, 6.4, 6.5, 10.2.
 */

import { useEffect, useRef, type RefObject } from 'react';
import anime from 'animejs';
import { useReducedMotion } from '../../lib/animation/reducedMotion';
import { resolveMicroInteraction } from '../../lib/animation/reducedMotion';
import type { MicroInteractionConfig } from '../../lib/animation/types';

/**
 * Easing used for the active (engage) phase of a micro-interaction. An elastic
 * curve gives the physics-based feedback called for by Req 5.2 while still
 * respecting the supplied (clamped) duration, unlike a duration-less spring.
 */
const ACTIVE_EASING = 'easeOutElastic(1, .6)';

/**
 * Easing used for the rest (release) phase. A plain ease-out settles the element
 * back to its resting visual state without overshoot (Req 5.3).
 */
const REST_EASING = 'easeOutQuad';

/**
 * Run a single teardown step in isolation.
 *
 * Lifecycle cleanup releases several independent resources (event listeners, the
 * retained Anime.js instance, the engine's per-element animation registration).
 * A failure tearing down one resource MUST NOT prevent the remaining resources
 * from being released (Req 6.1, 6.4), so each step is wrapped here and its error
 * is swallowed. This keeps unmount leak-free even if one teardown throws.
 */
function safeTeardown(step: () => void): void {
  try {
    step();
  } catch {
    // Intentionally ignored: isolate per-resource teardown failures so the
    // remaining cleanup steps still run.
  }
}

/**
 * Attach a physics-based micro-interaction to a focusable element.
 *
 * The returned ref must be attached to the DOM element that should react to
 * pointer/focus. On `pointerenter` or `focus` the configured transform
 * sub-property animates toward its `active` value; on `pointerleave` or `blur`
 * it returns to its `rest` value (Req 5.2, 5.3). The animation completes within
 * the clamped duration (<= 600 ms, enforced by `resolveMicroInteraction`,
 * Req 5.4).
 *
 * The hook only adds event listeners and drives a transform sub-property; it
 * never alters `tabindex` or the element's classes, so keyboard focusability and
 * the accent focus ring are preserved (Req 5.6).
 *
 * Under reduced motion, `resolveMicroInteraction` collapses `active` to equal
 * `rest`, so engaging the element produces no visible movement (Req 7.2).
 *
 * Lifecycle: the created Anime.js instance is retained in a ref and killed (via
 * `anime.remove` + `pause`) in the effect cleanup, alongside listener removal,
 * so no timer/RAF survives unmount and no detached node is ever updated
 * (Req 6.1, 6.4, 6.5). No instance is created on mount, so an idle element runs
 * no animation frame loop (Req 10.2).
 *
 * @typeParam T The element type the ref targets (defaults to `HTMLElement`).
 * @param config The micro-interaction configuration (property, duration, rest,
 *   active). Resolved against the current reduced-motion preference.
 * @returns A ref to attach to the target element.
 */
export function useMicroInteraction<T extends HTMLElement = HTMLElement>(
  config: MicroInteractionConfig,
): RefObject<T> {
  const elementRef = useRef<T>(null);
  const instanceRef = useRef<anime.AnimeInstance | null>(null);
  const reducedMotion = useReducedMotion();

  const { property, durationMs, rest, active } = config;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const resolved = resolveMicroInteraction(
      { property, durationMs, rest, active },
      reducedMotion,
    );

    /**
     * Animate the element's transform sub-property toward `value`.
     *
     * Guards against a detached node (Req 6.5): if the element has been removed
     * from the document the call is a no-op. Any in-flight animation on the
     * element is removed first so engage/release do not stack.
     */
    const animateTo = (value: number): void => {
      const target = elementRef.current;
      if (!target || !target.isConnected) {
        return;
      }
      // Cancel any running animation on this element before starting the next,
      // so rapid hover/focus toggles never leave overlapping tweens running.
      anime.remove(target);
      instanceRef.current = anime({
        targets: target,
        [resolved.property]: value,
        duration: resolved.durationMs,
        easing: value === resolved.rest ? REST_EASING : ACTIVE_EASING,
      });
    };

    const handleActivate = (): void => animateTo(resolved.active);
    const handleDeactivate = (): void => animateTo(resolved.rest);

    element.addEventListener('pointerenter', handleActivate);
    element.addEventListener('focus', handleActivate);
    element.addEventListener('pointerleave', handleDeactivate);
    element.addEventListener('blur', handleDeactivate);

    return () => {
      // Each resource is torn down in isolation (Req 6.1, 6.4): a throw while
      // removing one listener or killing the instance must not prevent the
      // remaining teardown steps from running.
      safeTeardown(() => element.removeEventListener('pointerenter', handleActivate));
      safeTeardown(() => element.removeEventListener('focus', handleActivate));
      safeTeardown(() => element.removeEventListener('pointerleave', handleDeactivate));
      safeTeardown(() => element.removeEventListener('blur', handleDeactivate));

      // Stop and release the retained instance so no RAF/timer survives unmount
      // and no detached node is updated (Req 6.4, 6.5).
      safeTeardown(() => anime.remove(element));
      safeTeardown(() => instanceRef.current?.pause());
      instanceRef.current = null;
    };
  }, [property, durationMs, rest, active, reducedMotion]);

  return elementRef;
}

/** Options for {@link useSvgDraw}. */
export interface SvgDrawOptions {
  /** Duration (ms) of the draw animation. Defaults to 800 ms. */
  durationMs?: number;
  /** Optional delay (ms) before the draw begins. Defaults to 0. */
  delayMs?: number;
  /** Easing for the draw. Defaults to a smooth ease-in-out sine. */
  easing?: string;
}

/** Default draw duration when none is supplied. */
const DEFAULT_SVG_DRAW_DURATION_MS = 800;

/**
 * Animate an SVG stroke from undrawn to fully drawn (Req 5.1).
 *
 * The returned ref must be attached to an `<svg>` element (its descendant
 * `<path>` strokes are drawn) or directly to an `<path>`/stroked SVG element.
 * On mount the stroke's `strokeDashoffset` is animated from its full length
 * (undrawn) to `0` (fully drawn), producing the line-drawing effect.
 *
 * Under reduced motion the draw is skipped: the stroke is set directly to its
 * fully drawn state with no animation, so the line is present and readable
 * without motion (Req 7.2).
 *
 * Lifecycle: the created instance is retained and killed in the effect cleanup,
 * and the draw is a single one-shot (no looping), so no persistent RAF runs once
 * the draw completes (Req 6.1, 6.4, 10.2). All work guards against a detached
 * node (Req 6.5).
 *
 * @typeParam T The SVG element type the ref targets (defaults to `SVGSVGElement`).
 * @param options Optional duration/delay/easing overrides.
 * @returns A ref to attach to the target SVG element.
 */
export function useSvgDraw<T extends SVGElement = SVGSVGElement>(
  options: SvgDrawOptions = {},
): RefObject<T> {
  const elementRef = useRef<T>(null);
  const instanceRef = useRef<anime.AnimeInstance | null>(null);
  const reducedMotion = useReducedMotion();

  const {
    durationMs = DEFAULT_SVG_DRAW_DURATION_MS,
    delayMs = 0,
    easing = 'easeInOutSine',
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !element.isConnected) {
      return;
    }

    // Resolve the targets: the element itself if it is a stroked path, otherwise
    // its descendant <path> strokes.
    const targets: SVGElement | NodeListOf<SVGPathElement> =
      element.tagName.toLowerCase() === 'path'
        ? element
        : element.querySelectorAll<SVGPathElement>('path');

    // Nothing strokeable to draw -> no-op (also avoids an empty RAF loop).
    if (targets instanceof NodeList && targets.length === 0) {
      return;
    }

    if (reducedMotion) {
      // Reduced motion: present the stroke fully drawn with no animation.
      anime.set(targets, { strokeDashoffset: 0 });
      return;
    }

    instanceRef.current = anime({
      targets,
      // `anime.setDashoffset` seeds stroke-dasharray and returns the full length
      // (undrawn); animating to 0 reveals the stroke from start to end.
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: durationMs,
      delay: delayMs,
      easing,
    });

    return () => {
      // Kill the retained instance so the draw cannot update a detached node
      // after unmount (Req 6.4, 6.5). Each step is isolated so a failure in one
      // does not prevent the other (Req 6.1).
      safeTeardown(() => anime.remove(targets));
      safeTeardown(() => instanceRef.current?.pause());
      instanceRef.current = null;
    };
  }, [durationMs, delayMs, easing, reducedMotion]);

  return elementRef;
}
