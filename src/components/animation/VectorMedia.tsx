/**
 * VectorMedia — the Jitter media thumbnail renderer for the Premium Project Card.
 *
 * This is the concrete implementation of the previously-deferred Jitter /
 * `Vector_Engine` renderer seam (OQ-3 confirmed). It is part of the React
 * Animation Adapter layer (`src/components/animation/`): all playback *decisions*
 * are delegated to the pure resolver `resolveMediaPlayback` from
 * `src/lib/animation/media.ts`; this file is responsible only for the effectful
 * binding to either a lazy-loaded Lottie player or a native `<video>`, plus the
 * fail-visible fallback to the bundled static placeholder.
 *
 * Behaviour (design "Premium Project Card → 4. Jitter media thumbnails"):
 * - Lottie (`.json`/`.lottie`): `@lottiefiles/dotlottie-react` (`DotLottieReact`)
 *   is **lazy-loaded** via `React.lazy` so the player is code-split out of the
 *   initial chunk and never blocks initial text render (Req 10.4, 10.5).
 *   Rendered with `autoplay={false} loop`; playback is driven imperatively
 *   (`play()` on hover, `stop()` — pause + reset to first frame — on leave).
 * - MP4: a native `<video muted loop playsinline preload="metadata" poster>` —
 *   no extra runtime dependency. `.play()` on hover, `.pause()` + reset
 *   `currentTime = 0` on leave.
 * - Idle / reduced motion: paused at the poster / first frame. Playback is
 *   decided by `resolveMediaPlayback`, which only reports `playing: true` when
 *   the card is hovered AND reduced motion is disabled AND playable media is
 *   present (Req 7.2, 10.2, 10.4). Under reduced motion the component renders
 *   the poster image only and never mounts the player.
 * - Fail-visible (Req 4.6, 5.8): absent `media`, a missing `src`, `kind: 'image'`,
 *   a failed lazy import of the Lottie player, or a `<video>`/Lottie load
 *   error/timeout all fall back to the bundled static placeholder (`fallbackSrc`).
 *   The animated thumbnail is never a precondition for showing a thumbnail.
 *
 * Requirements: 1.2, 4.6, 5.8, 7.2, 10.2, 10.4, 10.5.
 */

import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { resolveMediaPlayback, type ProjectMedia } from '../../lib/animation/media';
import { useReducedMotion } from '../../lib/animation/reducedMotion';
// Type-only import: erased at compile time, so it does NOT pull the player into
// the initial bundle (the runtime import below is the only code-split entry).
import type { DotLottie } from '@lottiefiles/dotlottie-react';

/** Props for {@link VectorMedia} (design contract, verbatim). */
export interface VectorMediaProps {
  /** Animated thumbnail; falls back to {@link fallbackSrc} when absent/failed. */
  media?: ProjectMedia;
  /** Static placeholder used when media is missing/fails (existing asset). */
  fallbackSrc: string;
  /** Whether the card is currently hovered. */
  hovered: boolean;
  /** Accessible alt text for the thumbnail. */
  alt: string;
}

/** Maximum time (ms) to wait for the media to load before failing visible. */
const MEDIA_LOAD_TIMEOUT_MS = 5000;

/**
 * Lazy-loaded Lottie player. `React.lazy` requires a module with a `default`
 * export, but `@lottiefiles/dotlottie-react` exports `DotLottieReact` as a named
 * export, so we adapt the module shape. Importing here (rather than statically)
 * is what code-splits the player out of the initial chunk (Req 10.4, 10.5).
 */
const LazyDotLottie = lazy(() =>
  import('@lottiefiles/dotlottie-react').then((mod) => ({
    default: mod.DotLottieReact,
  })),
);

/**
 * Render the bundled static placeholder image. This is the fail-visible final
 * state shared by every failure/absent-media path (Req 4.6, 5.8).
 */
function PlaceholderImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}): JSX.Element {
  return <img src={src} alt={alt} className={className} />;
}

/** Shared className so every render path occupies the same thumbnail box. */
const THUMB_CLASSES = 'h-48 w-full bg-base object-cover';

/**
 * Error boundary implementing the fail-visible contract for the lazy Lottie
 * player (Req 4.6, 5.8): if the lazy import rejects or the player throws while
 * rendering, the bundled static placeholder is shown instead of an empty box.
 */
interface MediaErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface MediaErrorBoundaryState {
  hasError: boolean;
}

class MediaErrorBoundary extends Component<
  MediaErrorBoundaryProps,
  MediaErrorBoundaryState
> {
  constructor(props: MediaErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): MediaErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * MP4 thumbnail: native `<video>`. Paused at its poster by default; plays on
 * hover and pauses + resets to the first frame on leave. A load error or load
 * timeout falls back to the static placeholder (Req 4.6, 5.8).
 */
function VideoMedia({
  src,
  poster,
  alt,
  playing,
  onFail,
}: {
  src: string;
  poster: string;
  alt: string;
  playing: boolean;
  onFail: () => void;
}): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Drive playback imperatively from the resolved `playing` flag. Guard the
  // `play()` promise so an autoplay-policy rejection never throws (Req 10.2).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (playing) {
      const result = video.play();
      if (result && typeof result.then === 'function') {
        result.catch(() => {
          // Autoplay policy / interrupted play — intentionally ignored so the
          // thumbnail stays visible at its poster rather than throwing.
        });
      }
    } else {
      video.pause();
      // Reset to the first frame so the idle state shows the poster/first frame.
      try {
        video.currentTime = 0;
      } catch {
        // Some environments disallow setting currentTime before metadata loads;
        // ignored so leave handling never throws.
      }
    }
  }, [playing]);

  // Load timeout: if the video never reports loaded metadata, fail visible.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 1 /* HAVE_METADATA */) {
        onFail();
      }
    }, MEDIA_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [src, onFail]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      className={THUMB_CLASSES}
      onError={onFail}
    />
  );
}

/**
 * Lottie thumbnail: the lazy-loaded `DotLottieReact` player rendered with
 * `autoplay={false} loop`. Playback is controlled imperatively through the
 * captured {@link DotLottie} instance — `play()` on hover, `stop()` (pause +
 * reset to the first frame) on leave. A failed load reports the error so the
 * caller falls back to the static placeholder (Req 4.6, 5.8).
 */
function LottieMedia({
  src,
  alt,
  playing,
  onFail,
}: {
  src: string;
  alt: string;
  playing: boolean;
  onFail: () => void;
}): JSX.Element {
  const dotLottieRef = useRef<DotLottie | null>(null);

  // Drive playback imperatively from the resolved `playing` flag.
  useEffect(() => {
    const instance = dotLottieRef.current;
    if (!instance) {
      return;
    }
    try {
      if (playing) {
        instance.play();
      } else {
        // `stop()` pauses AND resets to the start frame, satisfying the
        // pause + reset-on-leave / show-first-frame-while-idle contract.
        instance.stop();
      }
    } catch {
      // A playback call must never throw out of an effect; the thumbnail stays
      // visible at its current frame.
    }
  }, [playing]);

  // Load timeout: if the player never reports a loaded animation, fail visible.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const instance = dotLottieRef.current;
      if (!instance || !instance.isLoaded) {
        onFail();
      }
    }, MEDIA_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [src, onFail]);

  return (
    <LazyDotLottie
      src={src}
      autoplay={false}
      loop
      aria-label={alt}
      className={THUMB_CLASSES}
      dotLottieRefCallback={(instance) => {
        dotLottieRef.current = instance;
        if (instance) {
          // Surface load/render errors as a fail-visible fallback (Req 4.6).
          instance.addEventListener('loadError', onFail);
        }
      }}
    />
  );
}

/**
 * Render an animated project thumbnail (Lottie or MP4) that plays on hover and
 * is otherwise paused at its poster / first frame, falling back to a bundled
 * static placeholder whenever animated media is absent or fails.
 *
 * See the module header for the full behaviour contract.
 */
export function VectorMedia({
  media,
  fallbackSrc,
  hovered,
  alt,
}: VectorMediaProps): JSX.Element {
  const reducedMotion = useReducedMotion();

  // Track a runtime failure (load error / timeout / failed import) so we fall
  // back to the static placeholder for the rest of this media's lifetime.
  const [failed, setFailed] = useState(false);
  const fail = (): void => setFailed(true);

  // Reset the failure flag whenever the media source changes.
  useEffect(() => {
    setFailed(false);
  }, [media?.src, media?.kind]);

  // Playable media = an animated kind (lottie/mp4) WITH a source. `kind: 'image'`
  // or missing media/src is not playable and renders the static placeholder.
  const hasPlayableMedia =
    !!media &&
    (media.kind === 'lottie' || media.kind === 'mp4') &&
    typeof media.src === 'string' &&
    media.src.length > 0;

  const { playing, showPoster } = resolveMediaPlayback(
    { hovered, mediaPresent: hasPlayableMedia },
    reducedMotion,
  );

  // The poster shown while idle and used as the static fallback. Falls back to
  // the bundled placeholder when no poster is supplied.
  const poster = media?.poster ?? fallbackSrc;

  // Fail-visible / not-playable / `kind: 'image'`: render the static image.
  if (!hasPlayableMedia || failed) {
    return <PlaceholderImage src={fallbackSrc} alt={alt} className={THUMB_CLASSES} />;
  }

  // Reduced motion → poster-only: never mount the player, never autoplay. The
  // resolver guarantees `showPoster` here, so the poster image is the whole
  // thumbnail and no media animation is loaded (Req 7.2, 10.4).
  if (reducedMotion && showPoster) {
    return <PlaceholderImage src={poster} alt={alt} className={THUMB_CLASSES} />;
  }

  // MP4: native <video>, no extra runtime dependency. The poster attribute
  // shows the first frame while paused/idle.
  if (media!.kind === 'mp4') {
    return (
      <VideoMedia
        src={media!.src!}
        poster={poster}
        alt={alt}
        playing={playing}
        onFail={fail}
      />
    );
  }

  // Lottie: lazy-loaded player wrapped in Suspense (poster/placeholder fallback
  // while the chunk loads) and an error boundary (fail-visible on import error).
  return (
    <MediaErrorBoundary
      fallback={
        <PlaceholderImage src={fallbackSrc} alt={alt} className={THUMB_CLASSES} />
      }
    >
      <Suspense
        fallback={
          <PlaceholderImage src={poster} alt={alt} className={THUMB_CLASSES} />
        }
      >
        <LottieMedia src={media!.src!} alt={alt} playing={playing} onFail={fail} />
      </Suspense>
    </MediaErrorBoundary>
  );
}

export default VectorMedia;
