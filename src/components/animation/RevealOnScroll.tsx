/**
 * Motion reveal/stagger adapters for the portfolio animation upgrade.
 *
 * This module is part of the React Animation Adapter layer
 * (`src/components/animation/`): it binds the pure animation logic layer
 * (`src/lib/animation/`) to the Motion engine. All animation *decisions* (which
 * config to use, how to clamp it, how to respect reduced motion) are delegated
 * to the pure resolvers; this file is responsible only for the effectful binding
 * to Motion and the fail-visible fallback.
 *
 * Design references:
 * - `RevealOnScroll` uses Motion `whileInView` viewport observation (which is
 *   backed by `IntersectionObserver`, NOT scroll event polling — Req 10.3) with
 *   `once: true` so a section reveals a single time and does not re-trigger on
 *   subsequent scroll passes (Req 4.3).
 * - `StaggerGroup` assigns incremental per-child reveal delays from the resolved
 *   `staggerMs` (Req 4.2).
 * - Configs are resolved centrally through `resolveRevealConfig` +
 *   `useReducedMotion`, so reduced motion is honoured uniformly (Req 4.1, 10.1).
 * - Fail-visible: if Motion is unavailable or an animation initialization throws,
 *   the RAW children are rendered in a plain element in their final visible state
 *   (full opacity, no offset) — the throwing Motion element is NOT re-rendered as
 *   the fallback — so content is never gated behind a successful animation
 *   (Req 4.6, 6.5).
 *
 * Requirements: 4.1, 4.2, 4.3, 4.6, 6.5, 10.1, 10.3.
 */

import { Children, Component, type ElementType, type ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';
import { useReducedMotion } from '../../lib/animation/reducedMotion';
import { resolveRevealConfig } from '../../lib/animation/reducedMotion';
import {
  DEFAULT_REVEAL_CONFIG,
  buildRevealVariants,
} from '../../lib/animation/motionConfig';
import type { RevealConfig } from '../../lib/animation/types';

/** Intrinsic element tag the reveal/stagger wrappers render as. */
type IntrinsicTag = keyof JSX.IntrinsicElements;

/**
 * Merge a partial reveal config over the default reveal config.
 *
 * `once` is always forced to `true` (Req 4.3): a reveal must not re-trigger on
 * subsequent scroll passes regardless of the caller-supplied partial.
 */
function mergeRevealConfig(partial?: Partial<RevealConfig>): RevealConfig {
  const base = partial ?? {};
  return {
    from: { ...DEFAULT_REVEAL_CONFIG.from, ...base.from },
    to: { ...DEFAULT_REVEAL_CONFIG.to, ...base.to },
    durationMs: base.durationMs ?? DEFAULT_REVEAL_CONFIG.durationMs,
    staggerMs: base.staggerMs ?? DEFAULT_REVEAL_CONFIG.staggerMs,
    once: true,
  };
}

/**
 * Build the Motion `hidden`/`visible` variants for a resolved reveal config,
 * injecting an optional per-child entrance `delaySeconds` (used by
 * {@link StaggerGroup}).
 */
function buildVariantsWithDelay(
  resolved: RevealConfig,
  delaySeconds: number,
): Variants {
  const { hidden, visible } = buildRevealVariants(resolved);
  return {
    hidden,
    visible: {
      ...visible,
      transition: {
        ...visible.transition,
        ...(delaySeconds > 0 ? { delay: delaySeconds } : {}),
      },
    },
  };
}

/**
 * Error boundary that implements the fail-visible contract (Req 4.6, 6.5).
 *
 * If a descendant Motion adapter throws during render/commit, the boundary
 * stops trying to animate and renders the RAW content (`fallback`) in a plain
 * element with full opacity and no transform offset — it does NOT re-render the
 * Motion element that just threw. This matters for a *persistently*-throwing
 * Motion element: re-rendering the same Motion element as the fallback would
 * simply throw again and crash the boundary, hiding the content (violating
 * Req 4.6 / 6.5). Rendering the raw content instead guarantees the final,
 * readable visible state regardless of how Motion fails.
 *
 * Transient-failure recovery: when the rendered content changes (the parent
 * re-renders with a new child element, e.g. after a reduced-motion change), the
 * boundary clears its error state and re-attempts the animated render. A
 * transient failure therefore recovers on the next render, while a persistent
 * failure falls straight back to the visible fallback.
 */
interface FailVisibleBoundaryProps {
  as: IntrinsicTag;
  className?: string;
  /**
   * The animated subtree rendered while no error has occurred (typically the
   * Motion-enhanced element).
   */
  children: ReactNode;
  /**
   * The RAW, un-animated content rendered in a plain element if the animated
   * subtree throws. This is the final visible state and MUST NOT itself contain
   * the throwing Motion element.
   */
  fallback: ReactNode;
}

interface FailVisibleBoundaryState {
  hasError: boolean;
}

class FailVisibleBoundary extends Component<
  FailVisibleBoundaryProps,
  FailVisibleBoundaryState
> {
  constructor(props: FailVisibleBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): FailVisibleBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: FailVisibleBoundaryProps): void {
    // Transient-failure recovery: if the animated subtree changed since the
    // failure, clear the error and re-attempt the animation. A persistent
    // failure will simply re-trip the boundary and fall back to the visible
    // content again, so this never hides content.
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render(): ReactNode {
    const { as: Tag, className, children, fallback } = this.props;
    if (this.state.hasError) {
      // Final visible state: render the RAW content (not the Motion element)
      // with no animation styling so it is fully visible and readable.
      return <Tag className={className}>{fallback}</Tag>;
    }
    return children;
  }
}

/** Props for {@link RevealOnScroll}. */
export interface RevealProps {
  /** Content revealed when the wrapper scrolls into view. */
  children: ReactNode;
  /** Optional overrides merged over the default reveal config. */
  config?: Partial<RevealConfig>;
  /** Intrinsic element tag to render as (default `'div'`). */
  as?: IntrinsicTag;
  /** Optional className forwarded to the rendered element. */
  className?: string;
  /**
   * Per-child entrance delay in milliseconds. Assigned by {@link StaggerGroup};
   * callers normally leave this unset.
   */
  delayMs?: number;
}

/**
 * Reveal a block of content once it enters the viewport.
 *
 * Uses Motion `whileInView` (viewport observation backed by
 * `IntersectionObserver`, never scroll-event polling — Req 10.3) with
 * `viewport.once` driven by the resolved `once: true` flag, so the reveal fires
 * a single time (Req 4.3). The reveal animates only `opacity` and `transform`
 * (`y`, `scale`) — compositor-friendly properties (Req 10.1).
 *
 * The active reduced-motion preference is resolved through `useReducedMotion` +
 * `resolveRevealConfig`, so under reduced motion the content simply appears in
 * its final readable state with no large positional/scale motion (Req 4.1).
 *
 * Wrapped in a {@link FailVisibleBoundary}: if Motion is unavailable or an
 * animation init throws, children render in their final visible state (Req 4.6,
 * 6.5).
 */
export function RevealOnScroll({
  children,
  config,
  as = 'div',
  className,
  delayMs = 0,
}: RevealProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const resolved = resolveRevealConfig(mergeRevealConfig(config), reducedMotion);

  // Motion unavailable (e.g. failed/blocked import): render children visible.
  if (!motion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const variants = buildVariantsWithDelay(resolved, delayMs / 1000);

  // `motion[tag]` resolves the Motion-enhanced component for the intrinsic tag.
  const MotionTag = motion[as as keyof typeof motion] as ElementType;

  return (
    <FailVisibleBoundary as={as} className={className} fallback={children}>
      <MotionTag
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: resolved.once }}
        variants={variants}
      >
        {children}
      </MotionTag>
    </FailVisibleBoundary>
  );
}

/** Props for {@link StaggerGroup}. */
export interface StaggerGroupProps {
  /** Children whose reveals are staggered in document order. */
  children: ReactNode;
  /** Optional overrides merged over the default reveal config. */
  config?: Partial<RevealConfig>;
  /** Intrinsic element tag for the group container (default `'div'`). */
  as?: IntrinsicTag;
  /** Intrinsic element tag for each staggered child wrapper (default `'div'`). */
  childAs?: IntrinsicTag;
  /** Optional className forwarded to the group container. */
  className?: string;
  /** Optional className forwarded to each child wrapper. */
  childClassName?: string;
}

/**
 * Reveal a list of children with an incremental per-child delay.
 *
 * Each child is wrapped in a {@link RevealOnScroll} and assigned a delay of
 * `index * staggerMs` (from the resolved config), producing the staggered
 * entrance described by Req 4.2. The stagger amount is read through the same
 * `resolveRevealConfig` + `useReducedMotion` path, so under reduced motion the
 * resolved `staggerMs` collapses to a no-large-motion entrance alongside the
 * children themselves (Req 4.1).
 */
export function StaggerGroup({
  children,
  config,
  as: Tag = 'div',
  childAs = 'div',
  className,
  childClassName,
}: StaggerGroupProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const resolved = resolveRevealConfig(mergeRevealConfig(config), reducedMotion);
  const staggerMs = resolved.staggerMs ?? 0;

  // Normalize children to an array so each gets a stable index-based delay.
  const items = Children.toArray(children);

  return (
    <Tag className={className}>
      {items.map((child, index) => (
        <RevealOnScroll
          key={index}
          config={config}
          as={childAs}
          className={childClassName}
          delayMs={index * staggerMs}
        >
          {child}
        </RevealOnScroll>
      ))}
    </Tag>
  );
}
