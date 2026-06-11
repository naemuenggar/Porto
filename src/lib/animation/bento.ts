/**
 * Bento grid layout logic for the Premium Project Card.
 *
 * This module is part of the pure animation logic layer (`src/lib/animation/`):
 * it contains only types, constant Tailwind class strings, and a total mapping
 * function with no React or DOM side effects, so it is freely importable by the
 * React adapters that render the project cards.
 *
 * Requirements: 9.3 (responsive bento layout), 9.4 (per-variant span mapping
 * with a safe fallback for unknown/absent variants).
 */

/** Layout variant for a project card within the bento grid. */
export type ProjectCardVariant = 'featured' | 'wide' | 'tall' | 'standard';

/**
 * Container classes for the bento grid.
 *
 * Single column on mobile, two columns from `md`, three columns from `lg`.
 * `grid-flow-row-dense` lets smaller 1×1 cards backfill the cell left beside a
 * wider `featured`/`wide` card, so the grid tiles without holes. Rows size to
 * their content and grid `align-items: stretch` (the default) makes every card
 * in a row share the tallest card's height — no empty vertical gaps.
 */
export const BENTO_GRID_CLASSES =
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-row-dense gap-6';

/**
 * Span classes applied to a card wrapper for each known variant.
 *
 * Variants only widen a card (`col-span`); they never force extra rows, because
 * a row span taller than the card's content leaves an ugly empty area (the card
 * content does not grow to fill 2 rows). A `featured`/`wide` card therefore
 * spans two columns at its natural height, sitting flush with its row.
 */
export const VARIANT_SPAN_CLASSES: Record<ProjectCardVariant, string> = {
  featured: 'md:col-span-2',
  wide: 'md:col-span-2',
  tall: 'md:col-span-2',
  standard: '',
};

/**
 * Total mapping from a (possibly unknown or undefined) variant to its span
 * classes. Any value that is not one of the known {@link ProjectCardVariant}
 * keys falls back to the `standard` span, so this function is defined for every
 * possible input.
 */
export function mapVariantToSpanClasses(variant: string | undefined): string {
  if (
    variant !== undefined &&
    Object.prototype.hasOwnProperty.call(VARIANT_SPAN_CLASSES, variant)
  ) {
    return VARIANT_SPAN_CLASSES[variant as ProjectCardVariant];
  }
  return VARIANT_SPAN_CLASSES.standard;
}
