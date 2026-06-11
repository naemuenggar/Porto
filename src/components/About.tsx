/**
 * About section (Req 3).
 *
 * Renders the candidate's professional profile as a sequence of readable
 * paragraphs. Content is supplied via props from the central content module so
 * the section stays data-driven.
 *
 * The section is wrapped in `<section id="about">` so the Navbar can scroll to
 * it. Paragraphs are constrained to a comfortable reading width and stacked in
 * a single column so the content reads well on mobile (Req 9.1).
 *
 * Visual styling uses only palette tokens (`base` background, `ink` text) with
 * body text at the ≥16px `text-base` minimum (Req 10.1, 10.4).
 */
import { RevealOnScroll, StaggerGroup } from './animation/RevealOnScroll';

export interface AboutProps {
  /** Profile paragraphs shown in order. */
  paragraphs: string[];
}

export function About({ paragraphs }: AboutProps): JSX.Element {
  return (
    <section id="about" className="bg-base py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        {/* Section entrance reveal (Motion owns opacity + transform). */}
        <RevealOnScroll as="div">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">About</h2>
        </RevealOnScroll>

        {/*
          Staggered paragraph entrance. StaggerGroup renders the same
          `flex flex-col gap-5` container and emits one `<p>` per paragraph
          (childAs="p"), so the DOM structure and reading order are preserved
          while each paragraph reveals in sequence (Req 4.2).
        */}
        <StaggerGroup
          as="div"
          className="mt-6 flex flex-col gap-5"
          childAs="p"
          childClassName="text-base leading-relaxed text-ink/80 break-words"
        >
          {paragraphs}
        </StaggerGroup>
      </div>
    </section>
  );
}

export default About;
