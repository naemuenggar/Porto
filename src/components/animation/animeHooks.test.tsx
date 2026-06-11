import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * Unit tests for the Anime.js micro-interaction wiring (task 9.3).
 *
 * These tests exercise the React Animation Adapter hook `useMicroInteraction`
 * (from `animeHooks.ts`) by replacing the Anime.js engine with a stand-in that
 * records every `anime(...)` call. Because Anime.js DOM motion is not
 * exercisable in jsdom, we assert the *configuration* the hook hands to the
 * engine (the target transform sub-property and its value) rather than the
 * visual motion, per the design's testing strategy (Req 11.5).
 *
 * Coverage:
 *   1. pointerenter / focus apply the `active` value                (Req 5.2)
 *   2. pointerleave / blur apply the `rest` value                   (Req 5.3)
 *   3. the element stays focusable and keeps its accent focus-ring
 *      classes (the hook never strips tabindex/classes)             (Req 5.6)
 *   4. an idle mount schedules no persistent requestAnimationFrame  (Req 10.2)
 *
 * Req 5.1 (SVG stroke draw) is owned by `useSvgDraw`; this file focuses on the
 * micro-interaction wiring called for by task 9.3.
 */

// A stand-in for the Anime.js default export. `anime(config)` is a function that
// records its config and returns an instance with a `pause` method; the static
// helpers the hooks touch (`remove`, `set`, `setDashoffset`) are stubbed.
const animeMock = vi.hoisted(() => {
  const fn = vi.fn(() => ({ pause: vi.fn() }));
  return Object.assign(fn, {
    remove: vi.fn(),
    set: vi.fn(),
    setDashoffset: vi.fn(() => 100),
  });
});

vi.mock('animejs', () => ({ default: animeMock }));

// Import AFTER the mock is declared so the hook binds to the stand-in.
import { useMicroInteraction } from './animeHooks';
import type { MicroInteractionConfig } from '../../lib/animation/types';

/** The accent focus-ring utility classes a micro-interaction element must keep. */
const FOCUS_RING_CLASSES = 'focus-visible:ring-2 focus-visible:ring-accent';

/** A small component that attaches the hook's ref to a focusable button. */
function MicroButton({ config }: { config: MicroInteractionConfig }): JSX.Element {
  const ref = useMicroInteraction<HTMLButtonElement>(config);
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={0}
      className={FOCUS_RING_CLASSES}
      data-testid="micro-btn"
    >
      Hover me
    </button>
  );
}

/** Default config: scale from 1 (rest) to 1.1 (active) over 300ms. */
const baseConfig: MicroInteractionConfig = {
  property: 'scale',
  durationMs: 300,
  rest: 1,
  active: 1.1,
};

/** The config object passed to the most recent `anime(...)` call. */
function lastAnimeConfig(): Record<string, unknown> | undefined {
  const calls = animeMock.mock.calls as unknown as unknown[][];
  const last = calls[calls.length - 1];
  return last?.[0] as Record<string, unknown> | undefined;
}

beforeEach(() => {
  animeMock.mockClear();
  animeMock.remove.mockClear();
  animeMock.set.mockClear();
  animeMock.setDashoffset.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('useMicroInteraction — active on pointerenter/focus (Req 5.2)', () => {
  it('applies the active value on pointerenter', () => {
    render(<MicroButton config={baseConfig} />);
    const btn = screen.getByTestId('micro-btn');

    fireEvent.pointerEnter(btn);

    const config = lastAnimeConfig();
    expect(config).toBeDefined();
    expect(config).toMatchObject({
      targets: btn,
      [baseConfig.property]: baseConfig.active,
      duration: baseConfig.durationMs,
    });
  });

  it('applies the active value on focus', () => {
    render(<MicroButton config={baseConfig} />);
    const btn = screen.getByTestId('micro-btn');

    fireEvent.focus(btn);

    expect(lastAnimeConfig()?.[baseConfig.property]).toBe(baseConfig.active);
  });
});

describe('useMicroInteraction — rest on pointerleave/blur (Req 5.3)', () => {
  it('applies the rest value on pointerleave', () => {
    render(<MicroButton config={baseConfig} />);
    const btn = screen.getByTestId('micro-btn');

    fireEvent.pointerEnter(btn);
    fireEvent.pointerLeave(btn);

    expect(lastAnimeConfig()?.[baseConfig.property]).toBe(baseConfig.rest);
  });

  it('applies the rest value on blur', () => {
    render(<MicroButton config={baseConfig} />);
    const btn = screen.getByTestId('micro-btn');

    fireEvent.focus(btn);
    fireEvent.blur(btn);

    expect(lastAnimeConfig()?.[baseConfig.property]).toBe(baseConfig.rest);
  });
});

describe('useMicroInteraction — focusability + focus ring preserved (Req 5.6)', () => {
  it('keeps the element focusable (tabindex unchanged) after interactions', () => {
    render(<MicroButton config={baseConfig} />);
    const btn = screen.getByTestId('micro-btn');

    expect(btn).toHaveAttribute('tabindex', '0');

    fireEvent.pointerEnter(btn);
    fireEvent.focus(btn);
    fireEvent.blur(btn);

    // The hook only adds listeners; it never strips tabindex.
    expect(btn).toHaveAttribute('tabindex', '0');

    // The element can actually receive focus.
    btn.focus();
    expect(btn).toHaveFocus();
  });

  it('retains the accent focus-ring classes', () => {
    render(<MicroButton config={baseConfig} />);
    const btn = screen.getByTestId('micro-btn');

    fireEvent.pointerEnter(btn);
    fireEvent.pointerLeave(btn);

    expect(btn).toHaveClass('focus-visible:ring-2');
    expect(btn).toHaveClass('focus-visible:ring-accent');
  });
});

describe('useMicroInteraction — no persistent RAF on idle mount (Req 10.2)', () => {
  it('schedules no requestAnimationFrame when mounted without interaction', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');

    render(<MicroButton config={baseConfig} />);

    // An idle element creates no animation instance and runs no frame loop.
    expect(rafSpy).not.toHaveBeenCalled();
    expect(animeMock).not.toHaveBeenCalled();

    rafSpy.mockRestore();
  });
});
