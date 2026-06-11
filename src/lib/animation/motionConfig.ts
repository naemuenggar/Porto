/**
 * Pure Motion configuration module for the portfolio animation upgrade.
 *
 * This module is part of the pure animation logic layer (`src/lib/animation/`):
 * it has no React or DOM side effects. It defines the reveal variants consumed
 * by the Motion adapters and exposes the exact set of properties those variants
 * are permitted to animate.
 *
 * By construction, Motion reveals animate ONLY compositor-friendly properties —
 * `opacity` and `transform` (`y`, `scale`) — never layout-affecting or color
 * properties. The animated-property accessor below lets this guarantee be
 * asserted as a subset of `{ opacity, transform(y), transform(scale) }`.
 *
 * Requirements: 3.1 (Motion bounded scope), 4.1 (section reveal), 4.2 (stagger),
 * 10.1 (compositor-friendly properties only).
 */

import type { RevealConfig } from './types';

/**
 * The exhaustive, allowed set of properties a Motion reveal may animate.
 *
 * `transform(y)` and `transform(scale)` are expressed as logical property names
 * (both resolve to the compositor `transform` channel); `opacity` is the only
 * other channel. No layout (width/height/margin/top/left) or color property is
 * ever present.
 */
export const ALLOWED_REVEAL_PROPERTIES = [
  'opacity',
  'transform(y)',
  'transform(scale)',
] as const;

/** A property name that a Motion reveal is permitted to animate. */
export type RevealAnimatedProperty = (typeof ALLOWED_REVEAL_PROPERTIES)[number];

/**
 * Default reveal variant: a gentle fade + upward rise.
 *
 * Uses only `opacity` and `transform` (`y`); stays within the allowed property
 * set and the Motion duration bound.
 */
export const DEFAULT_REVEAL_CONFIG: RevealConfig = {
  from: { opacity: 0, y: 24 },
  to: { opacity: 1, y: 0 },
  durationMs: 500,
  staggerMs: 80,
  once: true,
};

/**
 * Shape of the Motion variants object derived from a {@link RevealConfig}.
 *
 * `y` and `scale` are Motion shorthand for the `transform` channel, so the
 * variants only ever carry `opacity`, `y`, and/or `scale`.
 */
export interface MotionRevealVariants {
  hidden: { opacity: number; y?: number; scale?: number };
  visible: {
    opacity: number;
    y?: number;
    scale?: number;
    transition: { duration: number };
  };
}

/**
 * Pure: build Motion `hidden`/`visible` variants from a reveal config.
 *
 * Only the `opacity`, `y`, and `scale` keys present on the config are copied,
 * so the produced variants can never animate a property outside the allowed
 * set. `transition.duration` is expressed in seconds (Motion's unit).
 */
export function buildRevealVariants(config: RevealConfig): MotionRevealVariants {
  const hidden: MotionRevealVariants['hidden'] = { opacity: config.from.opacity };
  if (config.from.y !== undefined) hidden.y = config.from.y;
  if (config.from.scale !== undefined) hidden.scale = config.from.scale;

  const visible: MotionRevealVariants['visible'] = {
    opacity: config.to.opacity,
    transition: { duration: config.durationMs / 1000 },
  };
  if (config.to.y !== undefined) visible.y = config.to.y;
  if (config.to.scale !== undefined) visible.scale = config.to.scale;

  return { hidden, visible };
}

/**
 * Pure: return the set of properties a reveal config is configured to animate.
 *
 * The result is always a subset of {@link ALLOWED_REVEAL_PROPERTIES}. `opacity`
 * is included whenever an opacity value is present (it always is for a reveal);
 * `transform(y)` / `transform(scale)` are included only when the corresponding
 * `y` / `scale` keys appear on either end of the config.
 */
export function getAnimatedProperties(config: RevealConfig): RevealAnimatedProperty[] {
  const properties: RevealAnimatedProperty[] = [];

  if (config.from.opacity !== undefined || config.to.opacity !== undefined) {
    properties.push('opacity');
  }
  if (config.from.y !== undefined || config.to.y !== undefined) {
    properties.push('transform(y)');
  }
  if (config.from.scale !== undefined || config.to.scale !== undefined) {
    properties.push('transform(scale)');
  }

  return properties;
}
