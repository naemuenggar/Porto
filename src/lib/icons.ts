import { createElement } from 'react';
import type { ComponentType } from 'react';
import {
  HambergerMenu,
  CloseSquare,
  ExportSquare,
  Sms,
  Location,
} from 'iconsax-react';
import type { Icon as IconsaxIcon } from 'iconsax-react';
import { SiGithub } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';

/**
 * Central icon layer (Requirement 2.2, 2.3).
 *
 * This module is the SINGLE place that maps UI concepts (menu, close,
 * externalLink, email, location, GitHub, LinkedIn) to concrete icon
 * components. The existing Section_Components (Navbar, Hero, Skills, Projects,
 * Contact, Footer) import named icons from here so that:
 *
 * - The primary icon set is Iconsax (`iconsax-react`) — a consistent, modern
 *   UI icon style (Req 2.2).
 * - Where Iconsax has no equivalent (brand glyphs such as the GitHub and
 *   LinkedIn logos), the Legacy_Icon_Library (`react-icons`) icon is retained
 *   for that specific concept and the retention is documented here so it is
 *   explicit and auditable (Req 2.3).
 *
 * Decorative usage marks `aria-hidden="true"` at the call site (Req 2.4); this
 * layer only supplies the components.
 */

/**
 * Props accepted by every icon exposed from this layer. Kept intentionally
 * minimal and assignable to both Iconsax's `IconProps` (which extends
 * `SVGAttributes<SVGElement>`) and `react-icons`' `IconBaseProps`, so the same
 * concept slot can be backed by either library.
 *
 * `className` carries Tailwind sizing/color tokens (e.g. `h-5 w-5 text-accent`)
 * and `aria-hidden` flags decorative icons.
 */
export interface IconProps {
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * Wrap an Iconsax component so it inherits its color from the surrounding
 * Tailwind text color (`currentColor`) instead of Iconsax's hard-coded default
 * hex. This preserves the existing Theme_Tokens (`base`, `surface`, `ink`,
 * `accent`) styling that the components already apply via `text-*` classes
 * (Req 9.2), matching how `react-icons` glyphs behaved before the migration.
 *
 * Implemented with `createElement` (no JSX) so this file can keep the `.ts`
 * extension specified by the design.
 */
function withCurrentColor(
  IconComponent: IconsaxIcon,
  displayName: string,
): ComponentType<IconProps> {
  function IconsaxConceptIcon(props: IconProps): ReturnType<IconsaxIcon> {
    return createElement(IconComponent, { color: 'currentColor', ...props });
  }
  IconsaxConceptIcon.displayName = displayName;
  return IconsaxConceptIcon;
}

/**
 * Concept → icon component map. Components import the concept they need from
 * here (e.g. `Icons.menu`) rather than importing directly from an icon library,
 * so the backing implementation and any retention is centralized.
 *
 * | Concept        | Backing component            | Library      | Replaces (legacy)        |
 * | -------------- | ---------------------------- | ------------ | ------------------------ |
 * | `menu`         | `HambergerMenu`              | iconsax-react| `FiMenu` (Navbar)        |
 * | `close`        | `CloseSquare`                | iconsax-react| `FiX` (Navbar)           |
 * | `externalLink` | `ExportSquare`               | iconsax-react| `FiExternalLink` (Projects) |
 * | `email`        | `Sms`                        | iconsax-react| `FaEnvelope` (Contact)   |
 * | `location`     | `Location`                   | iconsax-react| `FaMapMarkerAlt` (Contact) |
 * | `github`       | `SiGithub`  (RETAINED)       | react-icons  | brand glyph — no Iconsax equivalent |
 * | `linkedin`     | `FaLinkedin` (RETAINED)      | react-icons  | brand glyph — no Iconsax equivalent |
 */
export const Icons: {
  menu: ComponentType<IconProps>;
  close: ComponentType<IconProps>;
  externalLink: ComponentType<IconProps>;
  email: ComponentType<IconProps>;
  location: ComponentType<IconProps>;
  github: ComponentType<IconProps>;
  linkedin: ComponentType<IconProps>;
} = {
  // Iconsax-backed concept icons (Req 2.2).
  menu: withCurrentColor(HambergerMenu, 'MenuIcon'),
  close: withCurrentColor(CloseSquare, 'CloseIcon'),
  externalLink: withCurrentColor(ExportSquare, 'ExternalLinkIcon'),
  email: withCurrentColor(Sms, 'EmailIcon'),
  location: withCurrentColor(Location, 'LocationIcon'),

  // Retained Legacy_Icon_Library brand glyphs (Req 2.3). See
  // RETAINED_LEGACY_ICONS below for the rationale.
  github: SiGithub,
  linkedin: FaLinkedin,
};

/**
 * Brand/concept glyphs deliberately kept from the Legacy_Icon_Library
 * (`react-icons`) because Iconsax provides no equivalent (Req 2.3).
 *
 * Iconsax is a general-purpose UI icon set and intentionally does not ship
 * third-party brand logos, so the GitHub and LinkedIn marks are sourced from
 * `react-icons`. Both use `currentColor` natively, so they continue to honor
 * the existing Theme_Tokens without wrapping.
 */
export const RETAINED_LEGACY_ICONS: ReadonlyArray<{
  concept: string;
  component: string;
  source: string;
  reason: string;
}> = [
  {
    concept: 'github',
    component: 'SiGithub',
    source: 'react-icons/si',
    reason:
      'GitHub is a third-party brand logo; Iconsax ships no brand marks, so the legacy glyph is retained.',
  },
  {
    concept: 'linkedin',
    component: 'FaLinkedin',
    source: 'react-icons/fa',
    reason:
      'LinkedIn is a third-party brand logo; Iconsax ships no brand marks, so the legacy glyph is retained.',
  },
];
