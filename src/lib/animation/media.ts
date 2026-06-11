/**
 * Pure media-playback logic module for the portfolio animation upgrade.
 *
 * This module is part of the pure animation logic layer (`src/lib/animation/`):
 * it has no React or DOM side effects. It decides whether a Premium Project
 * Card's animated thumbnail (Lottie or MP4) should be playing, and whether the
 * static poster / first frame should be shown.
 *
 * The single rule, expressed as a deterministic function, makes the design's
 * idle-paused and reduced-motion guarantees testable: media plays ONLY when the
 * card is hovered AND reduced motion is disabled AND media is present. In every
 * other case playback is paused and the poster is shown — so no media animation
 * consumes CPU while the card is idle (Req 10.2) and media never autoplays under
 * reduced motion (Req 7.2 spirit).
 *
 * Requirements: 7.2 (reduced motion minimizes motion), 10.2 (no idle animation),
 * 10.4 (text-first / poster-while-idle).
 */

/** The kind of thumbnail a project card renders. */
export type MediaKind = 'lottie' | 'mp4' | 'image';

/** An animated (or static) thumbnail source for a project card. */
export interface ProjectMedia {
  kind: MediaKind;
  /** Animation/video source (Lottie .json/.lottie or .mp4); image uses imageUrl. */
  src?: string;
  /** Poster / first-frame image shown while idle and as the fallback. */
  poster?: string;
}

/** Inputs to the playback decision. */
export interface PlaybackInput {
  hovered: boolean;
  mediaPresent: boolean;
}

/** Result of the playback decision. */
export interface MediaPlayback {
  playing: boolean;
  showPoster: boolean;
}

/**
 * Pure: media plays ONLY when hovered AND not reduced-motion AND media present;
 * otherwise it is paused and the poster/first frame is shown.
 *
 * Guarantees no media animates while the card is idle (Req 10.2) and never
 * autoplays under reduced motion (Req 7.2 spirit). When `playing` is `true`,
 * `showPoster` is always `false`; the two are mutually exclusive.
 */
export function resolveMediaPlayback(
  input: PlaybackInput,
  reducedMotion: boolean,
): MediaPlayback {
  const playing = input.hovered && !reducedMotion && input.mediaPresent;
  return { playing, showPoster: !playing };
}
