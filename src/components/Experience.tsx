import type { ExperienceEntry } from '../types';
import { filterValidExperience, sortExperience } from '../lib/experience';
import { RevealOnScroll, StaggerGroup } from './animation/RevealOnScroll';

/**
 * Experience section (Req 6).
 *
 * Renders the candidate's experience as a vertically ordered timeline. Before
 * rendering, the raw entries are passed through {@link filterValidExperience}
 * to drop any entry with an empty/invalid title or description (Req 6.4) and
 * then {@link sortExperience} to order them most-recent-first by `sortKey`
 * (Req 6.1). With the four pinned content entries all valid, the timeline shows
 * each entry's title and description (Req 6.2, 6.3).
 *
 * The section is wrapped in `<section id="experience">` so the Navbar can
 * scroll to it (Req 1.2). The timeline is a single-column layout with exactly
 * one entry per row, keeping it comfortable to read on mobile (Req 9.1).
 *
 * Styling uses only palette tokens (`base`/`surface` backgrounds, `ink` text,
 * `accent` highlights) with body text at the ≥16px `text-base` minimum and a
 * subtle hover state plus accent focus ring, all transitions bounded within
 * 100–500ms (Req 10.1, 10.2, 10.3, 10.4, 10.5).
 */
export interface ExperienceProps {
  /** The experience entries to display (four pinned entries per content, Req 6.2). */
  entries: ExperienceEntry[];
}

export function Experience({ entries }: ExperienceProps): JSX.Element {
  // Drop invalid entries first (Req 6.4), then order most recent → oldest
  // (Req 6.1). Both helpers are pure and return new arrays.
  const orderedEntries = sortExperience(filterValidExperience(entries));

  return (
    <section id="experience" className="bg-base py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        {/* Section entrance reveal (Motion owns opacity + transform). */}
        <RevealOnScroll as="div">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Experience</h2>
        </RevealOnScroll>

        {/*
          Vertical timeline: a single column with exactly one entry per row
          (Req 9.1). The left border + accent markers form the timeline spine,
          rendered most-recent-first (Req 6.1). The StaggerGroup renders the
          `<ol>` spine and reveals each entry in a staggered sequence (Req 4.2).
        */}
        <StaggerGroup
          as="ol"
          className="mt-10 flex flex-col gap-8 border-l-2 border-surface pl-8"
        >
          {orderedEntries.map((entry) => (
            <li key={entry.id} className="relative">
              {/* Timeline marker aligned to the spine (decorative). */}
              <span
                aria-hidden="true"
                className="absolute -left-[2.55rem] top-1.5 h-4 w-4 rounded-full border-2 border-base bg-accent"
              />

              <div
                tabIndex={0}
                className={
                  'rounded-lg bg-surface p-5 ' +
                  'transition-all duration-200 ' +
                  'hover:-translate-y-1 hover:shadow-md ' +
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-base'
                }
              >
                {/* Entry title (Req 6.3). */}
                <h3 className="text-lg font-semibold text-ink">{entry.title}</h3>

                {/* Optional subtitle (context/scope). */}
                {entry.subtitle && (
                  <p className="mt-1 text-sm font-medium text-accent">
                    {entry.subtitle}
                  </p>
                )}

                {/* Entry description (Req 6.3). */}
                <p className="mt-2 text-base leading-relaxed text-ink/80 break-words">
                  {entry.description}
                </p>

                {/* Optional highlights as a bullet list. */}
                {entry.highlights && entry.highlights.length > 0 && (
                  <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-base text-ink/80">
                    {entry.highlights.map((highlight, index) => (
                      <li key={index} className="break-words">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

export default Experience;
