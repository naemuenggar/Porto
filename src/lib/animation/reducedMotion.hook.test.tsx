import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReducedMotion } from './reducedMotion';

/**
 * Unit tests for the `useReducedMotion` React hook (task 6.2).
 *
 * These tests override the default jsdom `matchMedia` shim (from
 * `src/test/setup.ts`) per-test with a controllable fake so we can:
 *   1. drive the current `matches` value the hook reads on mount,
 *   2. fire a synthetic `change` event and assert the hook re-renders, and
 *   3. assert the `change` listener is removed on unmount.
 *
 * _Requirements: 7.4_
 */

type ChangeHandler = (event: MediaQueryListEvent) => void;

interface FakeMediaQueryList {
  mql: MediaQueryList;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  /** Imperatively fire a `change` event to all registered listeners. */
  emitChange: (matches: boolean) => void;
}

/**
 * Build a controllable `matchMedia` fake and install it on `window`.
 * Returns the fake so tests can inspect listeners and emit changes.
 */
function installMatchMedia(initialMatches: boolean): FakeMediaQueryList {
  const listeners = new Set<ChangeHandler>();
  const addEventListener = vi.fn((_type: string, handler: ChangeHandler) => {
    listeners.add(handler);
  });
  const removeEventListener = vi.fn((_type: string, handler: ChangeHandler) => {
    listeners.delete(handler);
  });

  const mql = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener,
    removeEventListener,
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  const emitChange = (matches: boolean): void => {
    (mql as { matches: boolean }).matches = matches;
    const event = { matches } as MediaQueryListEvent;
    listeners.forEach((handler) => handler(event));
  };

  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;

  return { mql, addEventListener, removeEventListener, emitChange };
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

describe('useReducedMotion', () => {
  it('reflects the current preference on mount (no preference)', () => {
    installMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
  });

  it('reflects the current preference on mount (reduced motion enabled)', () => {
    installMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
  });

  it('updates when a `change` event fires', () => {
    const fake = installMatchMedia(false);

    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    // User enables reduced motion mid-session.
    act(() => {
      fake.emitChange(true);
    });
    expect(result.current).toBe(true);

    // ...and disables it again.
    act(() => {
      fake.emitChange(false);
    });
    expect(result.current).toBe(false);
  });

  it('subscribes to the `change` event', () => {
    const fake = installMatchMedia(false);

    renderHook(() => useReducedMotion());

    expect(fake.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes its `change` listener on unmount', () => {
    const fake = installMatchMedia(false);

    const { unmount } = renderHook(() => useReducedMotion());

    const registeredHandler = fake.addEventListener.mock.calls[0]?.[1];
    expect(registeredHandler).toBeTypeOf('function');

    unmount();

    expect(fake.removeEventListener).toHaveBeenCalledWith('change', registeredHandler);
  });
});
