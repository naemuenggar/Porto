import type { ComponentType } from 'react';
import type { ProjectCardVariant } from './lib/animation/bento';
import type { ProjectMedia } from './lib/animation/media';

/**
 * Shared TypeScript types for the personal portfolio website.
 *
 * Shapes are derived from the design document's "Components and Interfaces"
 * and "Data Models" sections.
 */

/** A single navigation entry rendered in the Navbar (Req 1.1). */
export interface NavLink {
  label: 'Home' | 'About' | 'Skills' | 'Projects' | 'Experience' | 'Contact';
  /** In-page anchor target, e.g. 'home', 'about'. */
  anchorId: string;
}

/** A skill rendered as a card with an icon and text label (Req 4.1, 4.3). */
export interface Skill {
  name: string;
  /** Icon component (e.g. from react-icons) accepting an optional className. */
  Icon: ComponentType<{ className?: string }>;
}

/** A named group of related skills, shown as a labeled section in Skills. */
export interface SkillCategory {
  /** Category heading, e.g. 'Frontend', 'Backend & Database'. */
  title: string;
  /** Skills belonging to this category. */
  skills: Skill[];
}

/** A portfolio project rendered as a card (Req 5.1). */
export interface Project {
  title: string;
  description: string;
  techStack: string[];
  imageUrl: string;
  /** GitHub repository URL, or null when not configured (renders disabled). */
  githubUrl: string | null;
  /** Live demo URL, or null when not configured (renders disabled). */
  liveDemoUrl: string | null;
  /**
   * Optional bento-grid layout variant for the Premium Project Card (Req 9.4).
   * When absent, the card falls back to the `standard` span.
   */
  variant?: ProjectCardVariant;
  /**
   * Optional animated thumbnail (Lottie/MP4) with poster for the Premium
   * Project Card. When absent, the card falls back to the static `imageUrl`.
   */
  media?: ProjectMedia;
}

/** A single experience timeline entry (Req 6.1). */
export interface ExperienceEntry {
  id: string;
  /** Valid when 1..100 non-whitespace characters after trim. */
  title: string;
  /** Optional short subtitle shown under the title (e.g. context/scope). */
  subtitle?: string;
  /** Valid when 1..500 non-whitespace characters after trim. */
  description: string;
  /** Optional bullet-point highlights for the entry. */
  highlights?: string[];
  /** Higher value = more recent (used for descending sort). */
  sortKey: number;
}

/** Contact section details (Req 7.1). */
export interface ContactDetails {
  email: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  /** Free-text location, e.g. 'Indonesia'. */
  location: string;
}

/** Current values of the contact form fields (Req 7.5). */
export interface ContactFormState {
  name: string;
  email: string;
  message: string;
}

/** Per-field validation messages; an empty object means the form is valid. */
export interface ContactFormErrors {
  name?: string;
  email?: string;
  message?: string;
}
