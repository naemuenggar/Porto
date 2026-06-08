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
export interface AboutProps {
  /** Profile paragraphs shown in order. */
  paragraphs: string[];
}

export function About({ paragraphs }: AboutProps): JSX.Element {
  return (
    <section id="about" className="bg-base py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">About</h2>

        <div className="mt-6 flex flex-col gap-5">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-base leading-relaxed text-ink/80 break-words"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;
