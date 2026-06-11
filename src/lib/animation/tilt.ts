/**
 * Pure 3D tilt + glare logic for the Premium Project Card.
 *
 * This module is part of the pure animation logic layer (`src/lib/animation/`):
 * it has no React or DOM side effects. It maps a pointer position over a card's
 * bounding rect into a small, bounded 3D tilt (`rotateX`/`rotateY`) plus a glare
 * highlight position (`glareX`/`glareY`) and intensity (`glareOpacity`).
 *
 * The React adapter (task 12.14) feeds the values produced here into
 * `useMotionValue`/`useSpring` and CSS custom properties (`--glare-x`,
 * `--glare-y`, `--glare-opacity`); all the math lives here so it can be
 * property-tested in isolation (Properties 10 & 11).
 *
 * Guarantees enforced by construction:
 * - `rotateX`/`rotateY` are always within `±maxDeg` (default `MAX_TILT_DEG`).
 * - `glareX`/`glareY` are always within `[0, 1]`.
 * - `glareOpacity` is always within `[0, 1]`.
 * - Degenerate rects (zero/negative/non-finite width or height), pointers
 *   outside the card, non-finite pointer coordinates, OR `reducedMotion === true`
 *   all collapse to {@link NEUTRAL_TILT} (no rotation, glare centered & invisible).
 * - A pointer at the card center yields exactly neutral rotation.
 *
 * Requirements: 7.1 (reduced motion presents content without large motion),
 * 10.1 (compositor-friendly transform/opacity only, within bounds).
 */

/** Maximum absolute tilt (in degrees) applied on either axis. */
export const MAX_TILT_DEG = 8;

/** Peak glare opacity applied when the pointer is active over the card. */
export const GLARE_PEAK_OPACITY = 1;

/** Pointer position plus the card's bounding rectangle (viewport pixels). */
export interface TiltInput {
  /** Pointer X coordinate (e.g. `PointerEvent.clientX`). */
  pointerX: number;
  /** Pointer Y coordinate (e.g. `PointerEvent.clientY`). */
  pointerY: number;
  /** The card's bounding rectangle. */
  rect: { left: number; top: number; width: number; height: number };
}

/** Resolved tilt + glare values for the card transform and glare overlay. */
export interface TiltOutput {
  /** X-axis rotation in degrees, within `±maxDeg`. */
  rotateX: number;
  /** Y-axis rotation in degrees, within `±maxDeg`. */
  rotateY: number;
  /** Horizontal glare position as a `[0, 1]` fraction of the card width. */
  glareX: number;
  /** Vertical glare position as a `[0, 1]` fraction of the card height. */
  glareY: number;
  /** Glare intensity within `[0, 1]`; `0` when resting/neutral. */
  glareOpacity: number;
}

/**
 * The resting output, used on pointer leave and under reduced motion.
 *
 * Rotation is flat, the glare is centered (`0.5, 0.5`) so any spring settling
 * toward it has no visible travel, and the glare is fully transparent.
 */
export const NEUTRAL_TILT: TiltOutput = {
  rotateX: 0,
  rotateY: 0,
  glareX: 0.5,
  glareY: 0.5,
  glareOpacity: 0,
};

/** Clamp `value` into the inclusive range `[min, max]`. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Pure: compute the 3D tilt + glare for a pointer over a card.
 *
 * The pointer is normalized to the card rect: `[0, 1]` across width/height for
 * the glare position, and `[-0.5, 0.5]` for the rotation. The rotation maps
 * linearly so the card edges reach `±maxDeg` and the center is flat.
 *
 * Any degenerate input collapses to {@link NEUTRAL_TILT}:
 * - `reducedMotion === true`,
 * - non-finite pointer coordinates or rect fields,
 * - zero/negative width or height,
 * - a pointer outside the card bounds.
 *
 * @param input Pointer position and card rect.
 * @param reducedMotion Whether reduced motion is currently preferred.
 * @param maxDeg Maximum absolute tilt in degrees (defaults to {@link MAX_TILT_DEG}).
 * @returns A bounded {@link TiltOutput}; the input is never mutated.
 */
export function computeTilt(
  input: TiltInput,
  reducedMotion: boolean,
  maxDeg: number = MAX_TILT_DEG,
): TiltOutput {
  if (reducedMotion) {
    return NEUTRAL_TILT;
  }

  const { pointerX, pointerY, rect } = input;
  const { left, top, width, height } = rect;

  // Reject any non-finite input so NaN never slips past the bounds checks below.
  if (
    !Number.isFinite(pointerX) ||
    !Number.isFinite(pointerY) ||
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    return NEUTRAL_TILT;
  }

  // Degenerate rect: nothing to tilt against.
  if (width <= 0 || height <= 0) {
    return NEUTRAL_TILT;
  }

  // Normalize the pointer to [0, 1] across the card.
  const fracX = (pointerX - left) / width;
  const fracY = (pointerY - top) / height;

  // Pointer outside the card bounds rests at neutral.
  if (fracX < 0 || fracX > 1 || fracY < 0 || fracY > 1) {
    return NEUTRAL_TILT;
  }

  // Guard against a non-positive/non-finite maxDeg by falling back to the default.
  const limit = Number.isFinite(maxDeg) && maxDeg > 0 ? maxDeg : MAX_TILT_DEG;

  // Center-relative position in [-0.5, 0.5].
  const offsetX = fracX - 0.5;
  const offsetY = fracY - 0.5;

  // Map [-0.5, 0.5] -> [-limit, limit]. rotateX follows vertical pointer motion
  // (inverted so the top edge tilts away), rotateY follows horizontal motion.
  const rotateY = clamp(offsetX * 2 * limit, -limit, limit);
  const rotateX = clamp(-offsetY * 2 * limit, -limit, limit);

  return {
    rotateX,
    rotateY,
    glareX: clamp(fracX, 0, 1),
    glareY: clamp(fracY, 0, 1),
    glareOpacity: clamp(GLARE_PEAK_OPACITY, 0, 1),
  };
}
