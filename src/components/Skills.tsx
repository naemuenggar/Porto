import type { Skill, SkillCategory } from '../types';

/**
 * Skills section (Req 4).
 *
 * Renders technical skills grouped into labeled categories (Frontend, Backend
 * & Database, Tools & Deployment, Other). Within each category, every skill is
 * an individual card — one card per skill, none merged (Req 4.1). The section
 * is wrapped in `<section id="skills">` so the Navbar can scroll to it.
 *
 * Each {@link SkillCard} renders BOTH the skill's icon and its text label
 * (Req 4.3). The label is always rendered as real text, independent of the
 * icon: the icon is decorative (`aria-hidden`), so if it ever fails to render
 * the card still shows the label and is never empty (Req 4.4).
 *
 * Each category uses a multi-column grid that grows from two columns on small
 * viewports to more columns on larger/desktop viewports (Req 9.2, 9.3).
 * Styling uses only palette tokens with a hover change and an accent focus
 * ring, and all transitions are bounded within 100–500ms (Req 10.1–10.5).
 */
export interface SkillsProps {
  /** Skill categories rendered in order. */
  categories: SkillCategory[];
}

export interface SkillCardProps {
  /** The single skill rendered by this card. */
  skill: Skill;
}

/**
 * A single skill card containing the skill's decorative icon and its text
 * label. The label is rendered unconditionally so the card is never empty even
 * if the icon fails to render (Req 4.3, 4.4).
 */
export function SkillCard({ skill }: SkillCardProps): JSX.Element {
  const { name, Icon } = skill;

  return (
    <li
      tabIndex={0}
      className={
        'group flex flex-col items-center justify-center gap-3 rounded-lg ' +
        'border border-surface bg-surface px-4 py-6 text-center ' +
        'transition-all duration-200 ' +
        'hover:-translate-y-1 hover:border-accent hover:shadow-md ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
        'focus-visible:ring-offset-2 focus-visible:ring-offset-base'
      }
    >
      {/*
        Icon is decorative only (aria-hidden): the visible content comes from
        the always-rendered text label below, so a missing or broken icon never
        leaves the card empty (Req 4.4).
      */}
      <Icon
        aria-hidden="true"
        className="h-8 w-8 text-ink transition-colors duration-200 group-hover:text-accent"
      />

      {/* Text label is ALWAYS rendered as real text (Req 4.3, 4.4). */}
      <span className="text-base font-medium text-ink">{name}</span>
    </li>
  );
}

export function Skills({ categories }: SkillsProps): JSX.Element {
  return (
    <section id="skills" className="bg-base py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-8 text-center text-3xl font-bold text-ink">Skills</h2>

        <div className="flex flex-col gap-10">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="mb-4 text-lg font-semibold text-ink">
                {category.title}
              </h3>

              {/* One element per skill (Req 4.1). Multi-column grid. */}
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {category.skills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Skills;
