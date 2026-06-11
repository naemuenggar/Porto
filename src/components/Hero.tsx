import { useState } from 'react';

import { Icons } from '../lib/icons';
import { ExternalLink } from './ExternalLink';
import { StaggerGroup } from './animation/RevealOnScroll';
import { useMicroInteraction } from './animation/animeHooks';
import { MICRO_INTERACTION_DEFAULTS } from '../lib/animation/timelineConfig';
import { scrollToSection } from '../lib/scroll';

/**
 * Hero / introductory section (Requirement 2).
 *
 * Renders the candidate identity (name, role, summary), the two primary
 * action buttons ("View Projects" and "Download CV"), and the GitHub /
 * LinkedIn social links. All content is supplied via props so the section
 * stays data-driven and testable.
 *
 * Behavior:
 * - Displays name, role, and summary exactly as provided (Req 2.1–2.3).
 * - "View Projects" calls `scrollToSection('projects')` (Req 2.4, 2.5).
 * - "Download CV" triggers a download when `cvUrl` is a usable destination
 *   (Req 2.6); when `cvUrl` is null/empty it shows an inline error indication
 *   and leaves the page unchanged — no navigation or reload (Req 2.7).
 * - GitHub / LinkedIn links open in a new tab via the shared `ExternalLink`
 *   helper (Req 2.8, 2.9).
 *
 * Styling uses only palette tokens (`base`, `surface`, `ink`, `accent`), hover
 * changes on buttons, an accent focus ring, and transitions bounded within
 * 100–500ms (Req 10.1, 10.2, 10.3, 10.5).
 */
export interface HeroProps {
  name: string;
  role: string;
  summary: string;
  /** CV document URL, or `null`/empty when no CV is configured. */
  cvUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
}

/** Shared button styling: modern radius, strong focus ring, smooth transition. */
const BUTTON_BASE =
  'inline-flex items-center justify-center rounded-lg px-6 py-3 text-base ' +
  'font-semibold transition-all duration-200 focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-base';

/** Primary (solid, most prominent) button — "View Projects". */
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-accent text-white shadow-md hover:brightness-110`;

/** Secondary (outlined) button — "Download CV". */
const BUTTON_SECONDARY = `${BUTTON_BASE} border-2 border-accent text-white hover:bg-accent/15`;

/**
 * A destination is usable only when it is a non-empty string once surrounding
 * whitespace is removed.
 */
function hasDestination(url: string | null): url is string {
  return typeof url === 'string' && url.trim().length > 0;
}

export function Hero({
  name,
  role,
  summary,
  cvUrl,
  githubUrl,
  linkedinUrl,
}: HeroProps): JSX.Element {
  // Inline error shown only on the CV-unavailable path (Req 2.7).
  const [cvError, setCvError] = useState<string | null>(null);

  // Anime.js physics micro-interactions on the two primary action buttons
  // (Req 5.2, 5.3). Anime owns the `scale` transform sub-property on these
  // focusable elements via DISJOINT ownership ids (`hero-cta-primary` /
  // `hero-cta-secondary`), so it never collides with Motion's reveal ownership
  // of `transform` on the Hero stagger elements (Req 3.2, 3.4). The hooks add
  // only listeners; they never touch tabindex or the focus-ring classes, so
  // keyboard focusability and the accent focus ring are preserved (Req 5.6).
  const primaryActionRef = useMicroInteraction<HTMLButtonElement>(
    MICRO_INTERACTION_DEFAULTS.buttonPress,
  );
  const secondaryActionRef = useMicroInteraction<HTMLButtonElement>(
    MICRO_INTERACTION_DEFAULTS.buttonPress,
  );

  const handleViewProjects = (): void => {
    // Scroll the Projects section into view (Req 2.4, 2.5).
    scrollToSection('projects');
  };

  const handleDownloadCv = (): void => {
    if (!hasDestination(cvUrl)) {
      // CV unavailable: show an inline error and leave the page unchanged.
      // No navigation, no reload (Req 2.7).
      setCvError('CV is currently unavailable. Please try again later.');
      return;
    }

    // Clear any prior error and initiate the download via a transient anchor
    // carrying the `download` attribute (Req 2.6).
    setCvError(null);
    const anchor = document.createElement('a');
    anchor.href = cvUrl;
    anchor.download = '';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <section
      id="home"
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-base px-6 py-24 text-center text-ink sm:px-10 lg:px-20"
    >
      {/*
        Staggered section entrance. The StaggerGroup container uses
        `display: contents` so it adds no box of its own — its child wrappers
        participate directly in the section's centered flex layout, preserving
        the existing spacing and alignment while each block reveals in sequence
        (Req 4.1, 4.2). Motion owns opacity + transform on these elements.
      */}
      <StaggerGroup as="div" className="contents">
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-ink break-words sm:text-5xl lg:text-6xl">
          {name}
        </h1>

        <p className="text-2xl font-semibold tracking-wide text-accent sm:text-3xl">
          {role}
        </p>

        <p className="max-w-2xl text-base leading-relaxed text-ink/70 break-words sm:text-lg">
          {summary}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          <button
            ref={primaryActionRef}
            type="button"
            onClick={handleViewProjects}
            className={BUTTON_PRIMARY}
          >
            View Projects
          </button>

          <button
            ref={secondaryActionRef}
            type="button"
            onClick={handleDownloadCv}
            className={BUTTON_SECONDARY}
          >
            Download CV
          </button>
        </div>

        {cvError !== null && (
          <p role="alert" className="text-base font-medium text-accent">
            {cvError}
          </p>
        )}

        <div className="mt-2 flex items-center justify-center gap-6">
          <ExternalLink href={githubUrl} aria-label="GitHub profile">
            <Icons.github aria-hidden="true" className="h-5 w-5" />
            <span>GitHub</span>
          </ExternalLink>

          <ExternalLink href={linkedinUrl} aria-label="LinkedIn profile">
            <Icons.linkedin aria-hidden="true" className="h-5 w-5" />
            <span>LinkedIn</span>
          </ExternalLink>
        </div>
      </StaggerGroup>
    </section>
  );
}

export default Hero;
