import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { ProjectMedia } from '../../lib/animation/media';

/**
 * Example/render tests for the `VectorMedia` Jitter thumbnail renderer
 * (task 12.13).
 *
 * `VectorMedia` is part of the React Animation Adapter layer: it delegates all
 * playback *decisions* to the pure `resolveMediaPlayback` resolver and is
 * responsible only for the effectful binding to a lazy-loaded Lottie player or a
 * native `<video>`, plus the fail-visible fallback to the bundled static
 * placeholder. These tests assert the rendered output and accessibility surface
 * rather than the animation motion itself (Req 11.5):
 *
 *   1. media absent / `kind: 'image'`  -> static placeholder `<img src=fallbackSrc>`  (Req 4.6, 5.8)
 *   2. `kind: 'mp4'` + hovered=false    -> `<video poster>` paused (idle = poster)     (Req 10.4)
 *   3. `kind: 'mp4'` + hovered=true     -> `<video>` plays (no poster-only image)      (Req 10.x)
 *   4. reduced motion ON                -> poster-only `<img>`, no `<video>`/player    (Req 7.2)
 *   5. media load error                 -> falls back to the static placeholder        (Req 4.6, 5.8)
 *   (+) `kind: 'lottie'`                -> renders the lazy player stub                 (Req 1.2, 10.4)
 *
 * The real Lottie player (`@lottiefiles/dotlottie-react`) is replaced with a
 * lightweight stub so the lazy import resolves synchronously and no real player
 * is mounted. Reduced motion is controlled per-test by overriding
 * `window.matchMedia` (the jsdom setup defaults to "no preference").
 *
 * _Requirements: 4.6, 5.8, 7.2, 10.4_
 */

// --- Lottie player stub -----------------------------------------------------
// `VectorMedia` lazy-imports `DotLottieReact` (named export). The stub renders a
// simple element so the lazy player is never the real runtime player.
vi.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: (props: Record<string, unknown>): JSX.Element => (
    <div
      data-testid="lottie-stub"
      data-src={String(props.src ?? '')}
      aria-label={props['aria-label'] as string | undefined}
    />
  ),
}));

// Import AFTER the mock is declared so the lazy import binds to the stub.
import { VectorMedia } from './VectorMedia';

const FALLBACK_SRC = '/assets/placeholder.svg';
const POSTER_SRC = '/projects/poster.png';

const originalMatchMedia = window.matchMedia;

/**
 * Override `window.matchMedia` so the reduced-motion query reports `enabled`.
 * The default jsdom setup shim reports "no preference" for every query.
 */
function setReducedMotion(enabled: boolean): void {
  window.matchMedia = ((query: string): MediaQueryList => ({
    matches: enabled && query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  // jsdom does not implement media playback; stub play/pause so the imperative
  // playback effects do not log "Not implemented" or throw.
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() =>
    Promise.resolve(),
  );
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(
    () => {},
  );
});

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe('VectorMedia — fail-visible static placeholder (Req 4.6, 5.8)', () => {
  it('renders the static placeholder <img> when media is absent', () => {
    render(<VectorMedia fallbackSrc={FALLBACK_SRC} hovered={false} alt="Demo project" />);

    const img = screen.getByAltText('Demo project');
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', FALLBACK_SRC);
    // No animated media is mounted.
    expect(document.querySelector('video')).toBeNull();
    expect(screen.queryByTestId('lottie-stub')).toBeNull();
  });

  it("renders the static placeholder <img> for kind 'image'", () => {
    const media: ProjectMedia = { kind: 'image', poster: POSTER_SRC };

    render(
      <VectorMedia
        media={media}
        fallbackSrc={FALLBACK_SRC}
        hovered
        alt="Static thumbnail"
      />,
    );

    const img = screen.getByAltText('Static thumbnail');
    expect(img.tagName).toBe('IMG');
    // Not playable -> always the bundled fallback, regardless of hover.
    expect(img).toHaveAttribute('src', FALLBACK_SRC);
    expect(document.querySelector('video')).toBeNull();
  });

  it("renders the static placeholder when an animated kind has no src", () => {
    const media: ProjectMedia = { kind: 'mp4', poster: POSTER_SRC };

    render(
      <VectorMedia media={media} fallbackSrc={FALLBACK_SRC} hovered alt="No src" />,
    );

    const img = screen.getByAltText('No src');
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', FALLBACK_SRC);
    expect(document.querySelector('video')).toBeNull();
  });
});

describe('VectorMedia — MP4 idle vs playing (Req 10.4)', () => {
  it('idle (hovered=false) renders a paused <video> showing its poster', () => {
    const media: ProjectMedia = { kind: 'mp4', src: '/projects/demo.mp4', poster: POSTER_SRC };
    const playSpy = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;
    const pauseSpy = window.HTMLMediaElement.prototype.pause as ReturnType<typeof vi.fn>;

    render(
      <VectorMedia media={media} fallbackSrc={FALLBACK_SRC} hovered={false} alt="Demo video" />,
    );

    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    // The poster (first frame) is shown while idle.
    expect(video).toHaveAttribute('poster', POSTER_SRC);
    expect(video).toHaveAttribute('src', '/projects/demo.mp4');
    // Idle = paused: play is never requested, pause is.
    expect(playSpy).not.toHaveBeenCalled();
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('hovered=true (reduced motion off) plays the <video> with no poster-only image', () => {
    const media: ProjectMedia = { kind: 'mp4', src: '/projects/demo.mp4', poster: POSTER_SRC };
    const playSpy = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;

    render(
      <VectorMedia media={media} fallbackSrc={FALLBACK_SRC} hovered alt="Demo video" />,
    );

    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    // Playing path: the video plays and there is no static <img> fallback.
    expect(playSpy).toHaveBeenCalled();
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('VectorMedia — reduced motion is poster-only (Req 7.2)', () => {
  it('renders the poster <img> with no <video>/player and never autoplays', () => {
    setReducedMotion(true);
    const media: ProjectMedia = { kind: 'mp4', src: '/projects/demo.mp4', poster: POSTER_SRC };
    const playSpy = window.HTMLMediaElement.prototype.play as ReturnType<typeof vi.fn>;

    render(
      <VectorMedia media={media} fallbackSrc={FALLBACK_SRC} hovered alt="Reduced motion" />,
    );

    const img = screen.getByAltText('Reduced motion');
    expect(img.tagName).toBe('IMG');
    // Poster-only: the static poster is the whole thumbnail.
    expect(img).toHaveAttribute('src', POSTER_SRC);
    // No media element is mounted, so nothing can autoplay.
    expect(document.querySelector('video')).toBeNull();
    expect(screen.queryByTestId('lottie-stub')).toBeNull();
    expect(playSpy).not.toHaveBeenCalled();
  });
});

describe('VectorMedia — fail-visible on media error (Req 4.6, 5.8)', () => {
  it('falls back to the static placeholder when the <video> emits an error', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const media: ProjectMedia = { kind: 'mp4', src: '/projects/demo.mp4', poster: POSTER_SRC };

    render(
      <VectorMedia media={media} fallbackSrc={FALLBACK_SRC} hovered={false} alt="Broken video" />,
    );

    const video = document.querySelector('video');
    expect(video).not.toBeNull();

    // Simulate a load failure.
    fireEvent.error(video as HTMLVideoElement);

    // The thumbnail fails visible to the bundled static placeholder.
    const img = await screen.findByAltText('Broken video');
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', FALLBACK_SRC);
    expect(document.querySelector('video')).toBeNull();
  });
});

describe('VectorMedia — Lottie media renders the lazy player (Req 1.2, 10.4)', () => {
  it('renders the lazy Lottie stub when a lottie source is present', async () => {
    const media: ProjectMedia = {
      kind: 'lottie',
      src: '/projects/demo.lottie',
      poster: POSTER_SRC,
    };

    render(
      <VectorMedia media={media} fallbackSrc={FALLBACK_SRC} hovered alt="Lottie demo" />,
    );

    // The lazy player resolves to the stub (no real player mounted).
    const stub = await screen.findByTestId('lottie-stub');
    expect(stub).toHaveAttribute('data-src', '/projects/demo.lottie');
  });
});
