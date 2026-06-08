import type { ExperienceEntry } from '../types';

/**
 * Pure logic for the Experience timeline (Req 6.1, 6.4).
 *
 * These functions are framework-agnostic: no React, no DOM. The Experience
 * component calls `filterValidExperience` then `sortExperience` before
 * rendering. See the design's "Logic Layer Interfaces" section.
 */

/** Inclusive character bounds for a valid title (after trimming whitespace). */
const TITLE_MIN = 1;
const TITLE_MAX = 100;

/** Inclusive character bounds for a valid description (after trimming whitespace). */
const DESCRIPTION_MIN = 1;
const DESCRIPTION_MAX = 500;

/** True when `value` has `min..max` non-whitespace characters after trimming. */
function withinTrimmedBounds(value: string, min: number, max: number): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Returns true when an experience entry has a valid title and description:
 * the title is 1..100 non-whitespace characters and the description is
 * 1..500 non-whitespace characters, both measured after trimming (Req 6.4).
 */
function isValidEntry(entry: ExperienceEntry): boolean {
  return (
    withinTrimmedBounds(entry.title, TITLE_MIN, TITLE_MAX) &&
    withinTrimmedBounds(entry.description, DESCRIPTION_MIN, DESCRIPTION_MAX)
  );
}

/**
 * Keeps only the entries whose title and description satisfy the length
 * bounds, dropping any entry with an empty/invalid title or description
 * (Req 6.4). The input array is not mutated.
 */
export function filterValidExperience(
  entries: ExperienceEntry[],
): ExperienceEntry[] {
  return entries.filter(isValidEntry);
}

/**
 * Returns a new array of entries sorted in descending order by `sortKey`
 * (most recent first), as a permutation of the input (Req 6.1). The input
 * array is not mutated.
 */
export function sortExperience(
  entries: ExperienceEntry[],
): ExperienceEntry[] {
  return [...entries].sort((a, b) => b.sortKey - a.sortKey);
}
