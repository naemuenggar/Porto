import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from 'motion/react';

import { Icons } from '../lib/icons';
import { ExternalLink } from './ExternalLink';
import { RevealOnScroll } from './animation/RevealOnScroll';
import { useSvgDraw } from './animation/animeHooks';
import { VectorMedia } from './animation/VectorMedia';
import { useReducedMotion } from '../lib/animation/reducedMotion';
import { BENTO_GRID_CLASSES, mapVariantToSpanClasses } from '../lib/animation/bento';
import { DEFAULT_REVEAL_CONFIG } from '../lib/animation/motionConfig';
import { computeTilt, NEUTRAL_TILT } from '../lib/animation/tilt';
import type { Project } from '../types';

// Bundled placeholder image (Vite resolves this to a URL string). Shown when a
// project's image fails to load or does not load within the timeout (Req 5.8).
import placeholderImage from '../assets/placeholder.svg';

/**
 * Projects section — the Premium Project Card (Req 5, 9, 10; OQ-3 confirmed).
 *
 * The section is *adapted, not rebuilt*: it keeps the `#projects` anchor, the
 * `content.ts` data source, the {@link ExternalLink} action buttons, the image
 * fallback, the theme tokens, and card focusability — and layers the premium
 * card capabilities on top, each REUSING an existing layer:
 *
 *  - **Bento grid** (`bento.ts`): each card wrapper is a grid item carrying its
 *    `mapVariantToSpanClasses(variant)` span on the `BENTO_GRID_CLASSES`
 *    container — single column on mobile, widening to 2 then 4 columns
 *    (Req 9.3, 9.4).
 *  - **Entrance stagger** (`RevealOnScroll`): each card wrapper reveals once with
 *    an incremental `index * staggerMs` delay (Req 4.2). Motion owns the
 *    entrance `opacity`/`transform` on the wrapper (`project-card-reveal`).
 *  - **3D tilt + glare** (`tilt.ts` + Motion): a nested `motion.article` tilts
 *    toward the cursor (`project-card-tilt`, Motion `transform`) with a glare
 *    overlay (`project-card-glare`, Motion `opacity` + glare custom props). All
 *    math is pure (`computeTilt`); reduced motion returns `NEUTRAL_TILT`
 *    (Req 7.1, 10.1).
 *  - **Iconsax SVG line-draw** (`useSvgDraw`): the "view project" arrow is drawn
 *    on hover/in-view (`project-card-icon`, Anime `strokeDashoffset`, Req 5.1).
 *  - **Jitter media thumbnail** (`VectorMedia`): the thumbnail plays on hover and
 *    is otherwise paused at its poster, falling back to the static placeholder
 *    (Req 1.2, 10.2, 10.4).
 *
 * The previous Anime.js `hoverLift` translateY micro-interaction on the card is
 * removed: the 3D tilt supersedes it, and the ownership registry now records
 * `project-card-tilt`/`project-card-icon` in its place so no node has two
 * transform writers (Req 3.3, 3.4). The Hero/Contact micro-interactions are
 * untouched.
 */
export interface ProjectsProps {
  /** The projects to display. */
  projects: Project[];
}

export interface ProjectCardProps {
  /** The single project rendered by this card. */
  project: Project;
}

/** Layout classes shared by both card action buttons (variant adds the rest). */
const ACTION_BUTTON_CLASSES = 'flex-1 justify-center text-base';

/** Spring config smoothing the 3D tilt rotation toward the cursor. */
const TILT_SPRING = { stiffness: 220, damping: 18, mass: 0.4 } as const;

export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  const { title, description, techStack, imageUrl, githubUrl, liveDemoUrl, media } =
    project;

  const reducedMotion = useReducedMotion();

  // Whether the card is currently hovered — drives the VectorMedia thumbnail
  // playback (play on hover, paused poster while idle — Req 10.2).
  const [hovered, setHovered] = useState(false);

  // --- Anime.js SVG line-draw on the Iconsax "view project" arrow (Req 5.1).
  // `useSvgDraw` owns ONLY `strokeDashoffset` on this distinct icon node
  // (`project-card-icon`), disjoint from every Motion entry (Req 3.2, 3.4). It
  // short-circuits to the fully-drawn stroke under reduced motion (Req 7.2).
  const arrowRef = useSvgDraw<SVGSVGElement>();

  // --- Motion 3D tilt + glare (Req 7.1, 10.1). The pure `computeTilt` maps the
  // pointer to bounded rotateX/rotateY + glare position/opacity; Motion only
  // applies the result. Motion owns `transform` on the tilt node
  // (`project-card-tilt`) and `opacity`/glare custom props on the glare overlay
  // (`project-card-glare`) — both disjoint from the wrapper's entrance reveal.
  const rotateX = useMotionValue(NEUTRAL_TILT.rotateX);
  const rotateY = useMotionValue(NEUTRAL_TILT.rotateY);
  const glareX = useMotionValue(NEUTRAL_TILT.glareX);
  const glareY = useMotionValue(NEUTRAL_TILT.glareY);
  const glareOpacity = useMotionValue(NEUTRAL_TILT.glareOpacity);

  // Smooth the rotation so the tilt eases toward the cursor and settles back to
  // neutral on leave. The glare position tracks the pointer directly.
  const springRotateX = useSpring(rotateX, TILT_SPRING);
  const springRotateY = useSpring(rotateY, TILT_SPRING);

  // Express the glare center as CSS percentages for the radial-gradient.
  const glareXPercent = useTransform(glareX, (value) => `${value * 100}%`);
  const glareYPercent = useTransform(glareY, (value) => `${value * 100}%`);

  const applyTilt = (output: typeof NEUTRAL_TILT): void => {
    rotateX.set(output.rotateX);
    rotateY.set(output.rotateY);
    glareX.set(output.glareX);
    glareY.set(output.glareY);
    glareOpacity.set(output.glareOpacity);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    // `computeTilt` returns NEUTRAL_TILT under reduced motion regardless of the
    // pointer, so the gate is centralized in the pure layer (Req 7.1).
    applyTilt(
      computeTilt(
        { pointerX: event.clientX, pointerY: event.clientY, rect },
        reducedMotion,
      ),
    );
  };

  const handlePointerEnter = (): void => setHovered(true);

  const handlePointerLeave = (): void => {
    setHovered(false);
    // Settle the card back to its resting visual state (Req 5.3 spirit).
    applyTilt(NEUTRAL_TILT);
  };

  // The thumbnail source: the project's static image, falling back to the
  // bundled placeholder when no image URL is configured (Req 5.8). `VectorMedia`
  // additionally fails visible to this same source on any media load error.
  const fallbackSrc = imageUrl || placeholderImage;

  // Tilt element style: Motion drives rotateX/rotateY (the `transform` channel)
  // and the glare custom properties consumed by the overlay below. Custom CSS
  // properties are not part of the typed style surface, so the object is cast.
  const tiltStyle = {
    rotateX: springRotateX,
    rotateY: springRotateY,
    transformStyle: 'preserve-3d',
    '--glare-x': glareXPercent,
    '--glare-y': glareYPercent,
    '--glare-opacity': glareOpacity,
  } as unknown as MotionStyle;

  return (
    <motion.article
      tabIndex={0}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={tiltStyle}
      // NOTE: no `overflow-hidden` here. `overflow: hidden` would create a
      // flattening context that collapses the nested `translateZ` depth layers
      // below, killing the 3D pop. Corners are clipped on the thumbnail wrapper
      // (a leaf) and the card stays rounded via its border radius instead.
      className={
        'group relative flex h-full flex-col rounded-2xl border border-surface ' +
        'bg-surface transition-[border-color,box-shadow] duration-300 ' +
        'hover:border-accent hover:shadow-[0_20px_45px_-15px_rgba(99,102,241,0.45)] ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
        'focus-visible:ring-offset-2 focus-visible:ring-offset-base'
      }
    >
      {/* Accent glow wash (top-right radial), echoing the reference card's
          colored corner. Subtle while idle, brighter on hover. Decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse at right top, rgba(99,102,241,0.18) 0%, transparent 55%)',
        }}
      />

      {/* Thumbnail (Jitter media on hover, static poster/placeholder while idle).
          VectorMedia fails visible to `fallbackSrc` on any media error (Req 5.8,
          10.2, 10.4). Lifts toward the viewer in 3D on hover (motion-safe only,
          so reduced motion gets no pop — Req 7.1). */}
      <div className="relative overflow-hidden rounded-t-2xl motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:[transform:translateZ(35px)]">
        <VectorMedia
          media={media}
          fallbackSrc={fallbackSrc}
          hovered={hovered}
          alt={`${title} preview`}
        />

        {/* Glare overlay (Motion owns opacity + glare custom props on this node,
            `project-card-glare`). Decorative, pointer-transparent. The radial
            gradient center + intensity read the custom properties set above. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at var(--glare-x) var(--glare-y), rgba(255,255,255,0.35), transparent 55%)',
            opacity: 'var(--glare-opacity)',
          }}
        />
      </div>

      {/* Content layer. `preserve-3d` lets each child below float at its own
          depth so the title, description, tech, and buttons "pop" forward on
          hover like the reference (motion-safe only). */}
      <div className="relative flex flex-1 flex-col gap-4 p-6 [transform-style:preserve-3d]">
        {/* Title + line-drawn Iconsax "view project" arrow (Req 5.1). */}
        <div className="flex items-center justify-between gap-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:[transform:translateZ(55px)]">
          <h3 className="text-xl font-bold text-ink">{title}</h3>
          <Icons.arrow
            ref={arrowRef}
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1"
          />
        </div>

        {/* Description (Req 5.1). */}
        <p className="text-base leading-relaxed text-ink/80 break-words motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:[transform:translateZ(35px)]">
          {description}
        </p>

        {/* Technology stack — every item rendered (Req 5.1). */}
        <ul className="flex flex-wrap gap-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:[transform:translateZ(25px)]">
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
            URLs render disabled and do not navigate (Req 5.7). Float highest on
            hover so they sit closest to the viewer. */}
        <div className="mt-auto flex gap-3 pt-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:[transform:translateZ(65px)]">
          <ExternalLink
            href={liveDemoUrl}
            variant="primary"
            className={ACTION_BUTTON_CLASSES}
            aria-label={`${title} live demo`}
          >
            <Icons.externalLink aria-hidden="true" className="h-5 w-5" />
            <span>Live Demo</span>
          </ExternalLink>

          <ExternalLink
            href={githubUrl}
            variant="secondary"
            className={ACTION_BUTTON_CLASSES}
            aria-label={`${title} GitHub repository`}
          >
            <Icons.github aria-hidden="true" className="h-5 w-5" />
            <span>GitHub</span>
          </ExternalLink>
        </div>
      </div>
    </motion.article>
  );
}

/** Per-card entrance stagger step (ms), reused from the default reveal config. */
const CARD_STAGGER_MS = DEFAULT_REVEAL_CONFIG.staggerMs ?? 0;

export function Projects({ projects }: ProjectsProps): JSX.Element {
  return (
    <section id="projects" className="bg-base py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section entrance reveal (Motion owns opacity + transform). */}
        <RevealOnScroll as="div" className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Projects</h2>
        </RevealOnScroll>

        {/* Bento grid: one column on mobile, widening to 2 then 4 columns
            (Req 9.3). Each card wrapper IS a grid item, carrying its per-variant
            span classes (`mapVariantToSpanClasses`) plus the `perspective` that
            the nested 3D-tilt article rotates within. `RevealOnScroll` reveals
            each wrapper once with an incremental `index * staggerMs` delay so the
            asymmetrical spans and the staggered entrance compose cleanly
            (Req 4.2). `StaggerGroup` is not used here because it applies a single
            `childClassName` to every child and so cannot assign the per-card
            bento span the grid item requires. */}
        <ul className={BENTO_GRID_CLASSES}>
          {projects.map((project, index) => (
            <RevealOnScroll
              key={project.title}
              as="li"
              className={`h-full ${mapVariantToSpanClasses(project.variant)} [perspective:1000px]`}
              delayMs={index * CARD_STAGGER_MS}
            >
              <ProjectCard project={project} />
            </RevealOnScroll>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default Projects;
