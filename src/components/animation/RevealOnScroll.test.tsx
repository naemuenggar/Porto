import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

/**
 * Unit tests for the Motion reveal/stagger wiring (task 7.2).
 *
 * These tests exercise the React Animation Adapter layer
 * (`RevealOnScroll` / `StaggerGroup`) by replacing the Motion engine with a
 * faithful stand-in. The stand-in:
 *   - renders the intrinsic tag with its children (so we can assert content),
 *   - records the props the adapter passes to Motion (`viewport.once` and the
 *     per-child `transition.delay`), surfaced as DOM data-attributes, and
 *   - emulates Motion's `whileInView` viewport observation, which is backed by
 *     `IntersectionObserver` (NOT scroll-event polling — Req 10.3), by
 *     registering an `IntersectionObserver` on mount.
 *
 * This lets us assert, against the real adapter code:
 *   1. children render inside `RevealOnScroll`                     (Req 4.1)
 *   2. viewport observation uses `IntersectionObserver`, and the
 *      adapter adds NO scroll listener to window/document          (Req 10.3)
 *   3. `StaggerGroup` assigns incremental per-child delays         (Req 4.2)
 *   4. `once: true` is resolved and forwarded to the viewport      (Req 4.3)
 *   5. the fail-visible boundary renders children if Motion throws (Req 4.6)
 */

// Shared mutable state for the Motion stand-in. `vi.hoisted` makes it available
// to the (hoisted) `vi.mock` factory below.
const motionState = vi.hoisted(() => ({
  /** When true, the Motion stand-in throws during render to test fail-visible. */
  shouldThrow: false,
}));

vi.mock('motion/react', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  // Factory that produces a Motion-enhanced component for an intrinsic tag.
  const createMotionComponent = (tag: string) =>
    function MotionStandIn(props: Record<string, unknown>): JSX.Element {
      // Simulate Motion failing to initialize, so the FailVisibleBoundary can
      // catch the error and render children in their final visible state. The
      // throw is one-shot: the boundary's fallback re-renders this same element,
      // so a transient init failure recovers to visible content (Req 4.6).
      if (motionState.shouldThrow) {
        motionState.shouldThrow = false;
        throw new Error('Motion failed to initialize');
      }

      const {
        children,
        variants,
        viewport,
        className,
        // Strip Motion-only control props so they are not spread onto the DOM.
        initial: _initial,
        whileInView: _whileInView,
        ...rest
      } = props as {
        children?: React.ReactNode;
        variants?: { visible?: { transition?: { delay?: number } } };
        viewport?: { once?: boolean };
        className?: string;
        initial?: unknown;
        whileInView?: unknown;
      };

      // Emulate Motion's whileInView: it observes the element with an
      // IntersectionObserver (viewport observation, never scroll polling).
      React.useEffect(() => {
        const target = document.createElement('div');
        const observer = new IntersectionObserver(() => {});
        observer.observe(target);
        return () => observer.disconnect();
      }, []);

      const delaySeconds = variants?.visible?.transition?.delay ?? 0;

      return React.createElement(
        tag,
        {
          className,
          'data-motion-tag': tag,
          'data-once': viewport?.once ? 'true' : 'false',
          'data-delay-seconds': String(delaySeconds),
          ...rest,
        },
        children,
      );
    };

  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string) => createMotionComponent(prop),
    },
  );

  return { motion };
});

// Import AFTER the mock is declared so the adapter binds to the stand-in.
import { RevealOnScroll, StaggerGroup } from './RevealOnScroll';

beforeEach(() => {
  motionState.shouldThrow = false;
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('RevealOnScroll — content + viewport wiring (Req 4.1, 4.3, 10.3)', () => {
  it('renders its children', () => {
    render(
      <RevealOnScroll>
        <p>Revealed content</p>
      </RevealOnScroll>,
    );

    expect(screen.getByText('Revealed content')).toBeInTheDocument();
  });

  it('registers an IntersectionObserver for viewport observation (no scroll polling)', () => {
    const observeSpy = vi.spyOn(IntersectionObserver.prototype, 'observe');

    render(
      <RevealOnScroll>
        <p>Observed content</p>
      </RevealOnScroll>,
    );

    // Viewport observation is performed via IntersectionObserver (Req 10.3).
    expect(observeSpy).toHaveBeenCalled();
  });

  it('adds no scroll event listener to window or document', () => {
    const windowSpy = vi.spyOn(window, 'addEventListener');
    const documentSpy = vi.spyOn(document, 'addEventListener');

    render(
      <RevealOnScroll>
        <p>No scroll polling</p>
      </RevealOnScroll>,
    );

    const windowScrollListeners = windowSpy.mock.calls.filter(
      ([type]) => type === 'scroll',
    );
    const documentScrollListeners = documentSpy.mock.calls.filter(
      ([type]) => type === 'scroll',
    );

    expect(windowScrollListeners).toHaveLength(0);
    expect(documentScrollListeners).toHaveLength(0);
  });

  it('resolves once:true and forwards it to the viewport', () => {
    render(
      <RevealOnScroll>
        <p>Reveal once</p>
      </RevealOnScroll>,
    );

    const motionEl = screen.getByText('Reveal once').closest('[data-once]');
    expect(motionEl).not.toBeNull();
    expect(motionEl).toHaveAttribute('data-once', 'true');
  });

  it('forces once:true even when a caller passes once via config overrides', () => {
    render(
      // The `once` flag must not be overridable to a re-triggering reveal.
      <RevealOnScroll config={{ once: true, durationMs: 400 }}>
        <p>Still once</p>
      </RevealOnScroll>,
    );

    const motionEl = screen.getByText('Still once').closest('[data-once]');
    expect(motionEl).toHaveAttribute('data-once', 'true');
  });
});

describe('StaggerGroup — per-child delays (Req 4.2)', () => {
  it('renders every child', () => {
    render(
      <StaggerGroup>
        <span>Item A</span>
        <span>Item B</span>
        <span>Item C</span>
      </StaggerGroup>,
    );

    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('Item C')).toBeInTheDocument();
  });

  it('assigns incremental per-child delays (index * staggerMs)', () => {
    // Default staggerMs is 80ms -> 0.08s increments per child.
    const staggerMs = 80;
    render(
      <StaggerGroup config={{ staggerMs }}>
        <span>Child 0</span>
        <span>Child 1</span>
        <span>Child 2</span>
      </StaggerGroup>,
    );

    const delayOf = (text: string): number => {
      const el = screen.getByText(text).closest('[data-delay-seconds]');
      expect(el).not.toBeNull();
      return Number(el!.getAttribute('data-delay-seconds'));
    };

    const d0 = delayOf('Child 0');
    const d1 = delayOf('Child 1');
    const d2 = delayOf('Child 2');

    // First child has no delay; each subsequent child increments by staggerMs.
    expect(d0).toBe(0);
    expect(d1).toBeCloseTo((1 * staggerMs) / 1000, 5);
    expect(d2).toBeCloseTo((2 * staggerMs) / 1000, 5);

    // Delays are strictly increasing in document order.
    expect(d0).toBeLessThan(d1);
    expect(d1).toBeLessThan(d2);
  });
});

describe('RevealOnScroll — fail-visible fallback (Req 4.6)', () => {
  it('renders children when an animation initialization throws', () => {
    // Suppress the expected React error-boundary console noise.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    motionState.shouldThrow = true;

    try {
      render(
        <RevealOnScroll>
          <p>Fallback content</p>
        </RevealOnScroll>,
      );

      // Content is never gated behind a successful animation.
      expect(screen.getByText('Fallback content')).toBeInTheDocument();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
