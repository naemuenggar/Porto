import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen, within } from '@testing-library/react';
import type { ComponentType } from 'react';

import { Skills } from './Skills';
import { skillCategories } from '../data/content';
import type { Skill, SkillCategory } from '../types';

/**
 * Example (assertion) tests for the Skills section.
 *
 *  - Category headings render and each category's skill labels are shown.
 *  - If a skill's icon fails to load/render, the text label still shows so no
 *    skill card is rendered empty (Req 4.4).
 */

afterEach(() => {
  cleanup();
});

describe('Skills — categories and labels (Req 4.1, 4.2, 4.3)', () => {
  it('renders every category heading', () => {
    render(<Skills categories={skillCategories} />);

    for (const category of skillCategories) {
      expect(
        screen.getByRole('heading', { level: 3, name: category.title }),
      ).toBeInTheDocument();
    }
  });

  it('renders every skill label across all categories', () => {
    render(<Skills categories={skillCategories} />);

    for (const category of skillCategories) {
      for (const skill of category.skills) {
        expect(screen.getByText(skill.name)).toBeInTheDocument();
      }
    }
  });

  it('renders exactly one card per skill', () => {
    render(<Skills categories={skillCategories} />);

    const totalSkills = skillCategories.reduce(
      (sum, category) => sum + category.skills.length,
      0,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(totalSkills);
  });
});

describe('Skills — label stays visible when the icon fails (Req 4.4)', () => {
  // An Icon component that renders nothing (e.g. a failed/empty icon).
  const NullIcon: ComponentType<{ className?: string }> = () => null;

  it('keeps the text label when a skill icon renders nothing', () => {
    const category: SkillCategory = {
      title: 'Frontend',
      skills: [{ name: 'TypeScript', Icon: NullIcon } satisfies Skill],
    };

    render(<Skills categories={[category]} />);

    const card = screen.getByRole('listitem');
    expect(within(card).getByText('TypeScript')).toBeInTheDocument();
    expect(card).toHaveTextContent('TypeScript');
  });
});
