import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { StrictMode } from 'react';
import { render, renderHook, fireEvent, act } from '@testing-library/react';
import { useMicroInteraction, useSvgDraw } from './animeHooks';
import { useReducedMotion } from '../../lib/animation/reducedMotion';
import type { MicroInteractionConfig } from '../../lib/animation/types';

/**
 * Lifecycle and StrictMode tests for the animation adapters.
 *
 * Verifies the teardown contract of Requirement 6:
 * - 6.1 unmounting an animation owner tears down its listeners, observers, and
 *   the retained engine instance.
 * - 6.2 a StrictMode double-invoked mount nets a single active registration.
 * - 6.3/6.4 the created instance is retained and disposed on teardown.
 * - 6.5 nothing updates a DOM node that has been removed from the document.
 *
 * Anime.js is mocked so we can capture `anime.remove` and `instance.pause`
 * without driving a real RAF loop in jsdom.
 */

// Shared spies for the mocked Anime.js engine. Declared via vi.hoisted so they
// can be referenced from both the (hoisted) vi.mock factory and the tests.
const animeSpies = vi.hoisted(() => {
  const pause = vi.fn();
  const remove = vi.fn();
  const set = vi.fn();
  const setDashoffset = vi.fn(() => 100);
  const call = vi.fn(() => ({ pause }));
  return { pause, remove, set, setDashoffset, call };
});

vi.mock('animejs', () => {
  const animeFn = animeSpies.call as unknown as Record<string, unknown>;
  animeFn.remove = animeSpies.remove;
  animeFn.set = animeSpies.set;
  animeFn.setDashoffset = animeSpies.setDashoffset;
  return { default: animeFn };
});

const MICRO_CONFIG: MicroInteractionConfig = {
  property: 'scale',
  durationMs: 200,
  rest: 1,
  active: 1.1,
};

/** Test component that attaches a micro-interaction to a focusable button. */
function MicroButton(): JSX.Element {
  const ref = useMicroInteraction<HTMLButtonElement>(MICRO_CONFIG);
  return (
    <button ref={ref} type="button">
      Engage
    </button>
  );
}

/** Test component that attaches an SVG draw to an svg element. */
function DrawnSvg(): JSX.Element {
  const ref = useSvgDraw<SVGSVGElement>({ durationMs: 300 });
  return (
    <svg ref={ref} viewBox="0 0 10 10">
      <path d="M0 0 L10 10" />
    </svg>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMicroInteraction lifecycle (Req 6.1, 6.4)', () => {
  it('adds pointer/focus listeners on mount and removes them on unmount', () => {
    const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');

    const { unmount } = render(<MicroButton />);

    const microEvents = ['pointerenter', 'focus', 'pointerleave', 'blur'];

    // All four interaction listeners are registered while mounted.
    for (const evt of microEvents) {
      expect(addSpy).toHaveBeenCalledWith(evt, expect.any(Function));
    }

    unmount();

    // Each registered listener is removed on unmount (no leaked listeners).
    for (const evt of microEvents) {
      expect(removeSpy).toHaveBeenCalledWith(evt, expect.any(Function));
    }

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('pauses and removes the retained anime instance on unmount', () => {
    const { getByRole, unmount } = render(<MicroButton />);
    const button = getByRole('button');

    // Engage the interaction so an Anime.js instance is created and retained.
    act(() => {
      fireEvent.pointerEnter(button);
    });
    expect(animeSpies.call).toHaveBeenCalled();

    unmount();

    // Teardown disposes the retained instance and clears the engine's
    // per-element registration (Req 6.4).
    expect(animeSpies.pause).toHaveBeenCalled();
    expect(animeSpies.remove).toHaveBeenCalledWith(button);
  });
});

describe('useReducedMotion lifecycle (Req 6.1)', () => {
  it('removes its matchMedia change listener on unmount', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const matchMediaSpy = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener,
          removeEventListener,
          dispatchEvent: () => false,
        } as unknown as MediaQueryList;
      });

    const { unmount } = renderHook(() => useReducedMotion());

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    matchMediaSpy.mockRestore();
  });
});

describe('StrictMode double-invoke nets a single registration (Req 6.2)', () => {
  it('useReducedMotion nets exactly one active matchMedia listener', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const matchMediaSpy = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener,
          removeEventListener,
          dispatchEvent: () => false,
        } as unknown as MediaQueryList;
      });

    function Probe(): null {
      useReducedMotion();
      return null;
    }

    // StrictMode runs effects setup -> cleanup -> setup, so the net number of
    // active listeners must remain exactly one.
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );

    const netActive =
      addEventListener.mock.calls.length - removeEventListener.mock.calls.length;
    expect(netActive).toBe(1);

    matchMediaSpy.mockRestore();
  });

  it('useMicroInteraction nets one set of interaction listeners under StrictMode', () => {
    const addSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');

    render(
      <StrictMode>
        <MicroButton />
      </StrictMode>,
    );

    // For each interaction event the net registration (adds - removes) is 1.
    for (const evt of ['pointerenter', 'focus', 'pointerleave', 'blur']) {
      const adds = addSpy.mock.calls.filter((c) => c[0] === evt).length;
      const removes = removeSpy.mock.calls.filter((c) => c[0] === evt).length;
      expect(adds - removes).toBe(1);
    }

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe('post-unmount safety (Req 6.5)', () => {
  it('advancing timers and animation frames after unmount touches no detached node', () => {
    vi.useFakeTimers();

    const { getByRole, unmount } = render(<MicroButton />);
    const button = getByRole('button');

    // Engage so an instance/callback path exists, then unmount to detach the node.
    act(() => {
      fireEvent.pointerEnter(button);
    });

    unmount();

    // The button is now detached from the document.
    expect(button.isConnected).toBe(false);

    // Advancing timers and flushing any queued RAF callbacks after unmount must
    // not throw or touch the detached node.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(1000);
        vi.runOnlyPendingTimers();
      });
    }).not.toThrow();
  });

  it('useSvgDraw unmount disposes its instance without error', () => {
    const { unmount } = render(<DrawnSvg />);

    // A draw instance is created on mount (motion enabled by default).
    expect(animeSpies.call).toHaveBeenCalled();

    expect(() => unmount()).not.toThrow();

    // The retained draw instance is paused and the targets' registration cleared.
    expect(animeSpies.pause).toHaveBeenCalled();
    expect(animeSpies.remove).toHaveBeenCalled();
  });
});
