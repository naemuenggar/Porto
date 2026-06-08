import type { ReactNode } from 'react';

/**
 * Shared external-link component used by the Hero, Projects, Contact, and
 * Footer sections so every outbound link behaves consistently.
 *
 * Two render modes, driven entirely by the `href` prop:
 *
 * - Configured (non-null, non-empty after trim): renders a real anchor with
 *   `href`, `target="_blank"`, and `rel="noopener noreferrer"` so it opens in a
 *   new browser tab while keeping the current page open and avoiding
 *   tab-nabbing (Req 2.9, 5.6, 7.2, 8.3, 8.4).
 * - Null / absent destination: renders a non-navigating `<span>` marked
 *   `aria-disabled="true"` that visibly indicates the link is unavailable and
 *   does NOT navigate when selected (Req 5.7, 8.5).
 *
 * Interactive styling uses only palette tokens (`accent` focus ring, hover
 * color/underline change) with a transition bounded within 100–500ms
 * (Req 10.2, 10.3, 10.5).
 */
export interface ExternalLinkProps {
  /** Destination URL, or `null`/empty when no destination is configured. */
  href: string | null | undefined;
  /** Visible label / content of the link. */
  children: ReactNode;
  /** Optional caller-supplied classes appended after the shared base classes. */
  className?: string;
  /** Optional accessible label override (e.g. for icon-only links). */
  'aria-label'?: string;
}

/** Shared transition + focus styling applied in both render modes. */
const BASE_CLASSES =
  'inline-flex items-center gap-2 rounded transition-colors duration-200 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-base';

/** Styling for an active, navigable link. */
const ENABLED_CLASSES = 'text-accent hover:text-ink hover:underline cursor-pointer';

/** Styling for a disabled/unavailable link. */
const DISABLED_CLASSES = 'text-ink/40 cursor-not-allowed line-through';

/**
 * A destination is considered configured only when it is a non-empty string
 * once surrounding whitespace is removed.
 */
function hasDestination(href: string | null | undefined): href is string {
  return typeof href === 'string' && href.trim().length > 0;
}

export function ExternalLink({
  href,
  children,
  className,
  'aria-label': ariaLabel,
}: ExternalLinkProps): JSX.Element {
  const extra = className ? ` ${className}` : '';

  if (!hasDestination(href)) {
    // No configured destination: render a non-navigating, clearly unavailable
    // element. `aria-disabled` communicates the state to assistive tech and the
    // absence of `href`/`onClick` guarantees no navigation occurs (Req 5.7, 8.5).
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={ariaLabel}
        title="Link unavailable"
        className={`${BASE_CLASSES} ${DISABLED_CLASSES}${extra}`}
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`${BASE_CLASSES} ${ENABLED_CLASSES}${extra}`}
    >
      {children}
    </a>
  );
}

export default ExternalLink;
