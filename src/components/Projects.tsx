import { useEffect, useRef, useState } from 'react';
import { SiGithub } from 'react-icons/si';
import { FiExternalLink } from 'react-icons/fi';

import { ExternalLink } from './ExternalLink';
import type { Project } from '../types';

// Bundled placeholder image (Vite resolves this to a URL string). Shown when a
// project's image fails to load or does not load within the timeout (Req 5.8).
import placeholderImage from '../assets/placeholder.svg';

/**
 * Projects section (Req 5).
 *
 * Renders the portfolio projects as a responsive grid of cards — one
 * {@link ProjectCard} per project. The section is wrapped in
 * `<section id="projects">` so the Navbar and the Hero "View Projects" button
 * can scroll to it (Req 1.2, 2.5).
 *
 * Each card shows the project image, title, description, every technology-stack
 * item, and both a GitHub and a Live Demo action button (Req 5.1). The action
 * buttons reuse the shared {@link ExternalLink} helper so a configured URL
 * opens in a new tab (Req 5.6) and a `null` URL renders disabled and never
 * navigates (Req 5.7).
 *
 * The image uses an `onError` handler plus a load timeout to swap in the
 * bundled placeholder while retaining the title, description, tech stack, and
 * links (Req 5.8).
 *
 * Layout grows from a single column on mobile to two or more columns on
 * larger/desktop viewports (Req 9.2, 9.3). Styling uses only palette tokens
 * (`base`/`surface`/`ink`/`accent`) with a hover change on the card, an accent
 * focus ring, and transitions bounded within 100–500ms (Req 10.1, 10.2, 10.3,
 * 10.5).
 */
export interface ProjectsProps {
  /** The projects to display (3 per the content module, Req 5.2–5.4). */
  projects: Project[];
}

export interface ProjectCardProps {
  /** The single project rendered by this card. */
  project: Project;
}

/** Maximum time (ms) to wait for the project image before falling back. */
const IMAGE_LOAD_TIMEOUT_MS = 5000;

/** Shared action-button styling: palette tokens, hover change, accent ring. */
const ACTION_BUTTON_CLASSES =
  'flex-1 justify-center rounded-md border border-ink px-4 py-2 text-base ' +
  'font-medium hover:bg-surface hover:text-ink hover:no-underline';

export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  const { title, description, techStack, imageUrl, githubUrl, liveDemoUrl } =
    project;

  // Track whether the image failed (via onError or timeout). Once failed we
  // render the bundled placeholder instead, keeping all other content intact
  // (Req 5.8).
  const [imageFailed, setImageFailed] = useState(false);
  // Whether the image has finished loading successfully — used to cancel the
  // fallback timeout so a slow-but-successful load is not wrongly replaced.
  const loadedRef = useRef(false);

  useEffect(() => {
    // Reset state whenever the source changes (e.g. across re-renders with a
    // different project image).
    loadedRef.current = false;
    setImageFailed(false);

    // If the image has not loaded within the timeout, fall back to the
    // placeholder (Req 5.8).
    const timeoutId = window.setTimeout(() => {
      if (!loadedRef.current) {
        setImageFailed(true);
      }
    }, IMAGE_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [imageUrl]);

  const displayedSrc = imageFailed ? placeholderImage : imageUrl;

  return (
    <li
      tabIndex={0}
      className={
        'group flex flex-col overflow-hidden rounded-lg border border-surface ' +
        'bg-surface transition-all duration-200 ' +
        'hover:-translate-y-1 hover:border-accent hover:shadow-md ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
        'focus-visible:ring-offset-2 focus-visible:ring-offset-base'
      }
    >
      {/* Project image. onError + load timeout swap in the placeholder while
          all other content remains (Req 5.8). */}
      <img
        src={displayedSrc}
        alt={`${title} preview`}
        className="h-48 w-full bg-base object-cover"
        onLoad={() => {
          loadedRef.current = true;
        }}
        onError={() => {
          if (!imageFailed) {
            setImageFailed(true);
          }
        }}
      />

      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Title (Req 5.1). */}
        <h3 className="text-xl font-bold text-ink">{title}</h3>

        {/* Description (Req 5.1). */}
        <p className="text-base leading-relaxed text-ink/80 break-words">{description}</p>

        {/* Technology stack — every item rendered (Req 5.1). */}
        <ul className="flex flex-wrap gap-2">
          {techStack.map((tech) => (
            <li
              key={tech}
              className="rounded-md bg-base px-3 py-1 text-base font-medium text-ink"
            >
              {tech}
            </li>
          ))}
        </ul>

        {/* Action buttons. Configured URLs open in a new tab (Req 5.6); null
            URLs render disabled and do not navigate (Req 5.7). Pushed to the
            bottom so cards of differing heights align their actions. */}
        <div className="mt-auto flex gap-3 pt-2">
          <ExternalLink
            href={githubUrl}
            className={ACTION_BUTTON_CLASSES}
            aria-label={`${title} GitHub repository`}
          >
            <SiGithub aria-hidden="true" className="h-5 w-5" />
            <span>GitHub</span>
          </ExternalLink>

          <ExternalLink
            href={liveDemoUrl}
            className={ACTION_BUTTON_CLASSES}
            aria-label={`${title} live demo`}
          >
            <FiExternalLink aria-hidden="true" className="h-5 w-5" />
            <span>Live Demo</span>
          </ExternalLink>
        </div>
      </div>
    </li>
  );
}

export function Projects({ projects }: ProjectsProps): JSX.Element {
  return (
    <section id="projects" className="bg-base py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-ink sm:text-3xl">
          Projects
        </h2>

        {/* One card per project (Req 5.1). Multi-column grid: a single column
            on mobile widening to 2–3 columns on larger/desktop viewports
            (Req 9.2, 9.3). */}
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Projects;
