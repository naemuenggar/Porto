import { describe, it, expect } from 'vitest';
import {
  PROJECT_OWNERSHIP_REGISTRY,
  findOwnershipConflicts,
} from './ownership';

/**
 * Ownership-scoping tests over the REAL project registry (Req 3.1, 3.2, 3.5).
 *
 * These assertions guard the separation-of-concerns contract directly against
 * the shipped `PROJECT_OWNERSHIP_REGISTRY` rather than a synthetic fixture:
 *
 * - Req 3.1: Motion_Engine is scoped to scroll reveals / stagger, so every
 *   Motion entry may only claim compositor-friendly entrance channels
 *   (`opacity`, `transform`).
 * - Req 3.2: Timeline_Engine (Anime.js) is scoped to timeline / SVG line draw /
 *   physics micro-interactions, so every Anime entry may only claim its
 *   transform sub-properties or the SVG stroke channel
 *   (`scale`, `translateY`, `rotate`, `strokeDashoffset`).
 * - Req 3.5 (+3.3/3.4): the registry documents per-element ownership and is
 *   free of cross-engine property conflicts.
 */

/** Properties Motion is allowed to own (Req 3.1, 10.1). */
const MOTION_ALLOWED_PROPERTIES = new Set(['opacity', 'transform']);

/** Properties Anime.js is allowed to own (Req 3.2). */
const ANIME_ALLOWED_PROPERTIES = new Set([
  'scale',
  'translateY',
  'rotate',
  'strokeDashoffset',
]);

/** Animated elements that MUST be documented in the registry. */
const EXPECTED_ELEMENT_IDS = [
  // Motion reveal / stagger entries (one per animated section group).
  'hero-intro',
  'about-heading',
  'about-paragraphs',
  'skills-heading',
  'skills-cards',
  'projects-heading',
  'projects-cards',
  'experience-heading',
  'experience-entries',
  'contact-heading',
  'contact-details',
  'contact-form',
  // Anime.js micro-interaction entries.
  'hero-cta-primary',
  'hero-cta-secondary',
  'project-card',
  'contact-submit',
];

describe('PROJECT_OWNERSHIP_REGISTRY scoping', () => {
  it('is non-empty and documents every expected animated element (Req 3.5)', () => {
    expect(PROJECT_OWNERSHIP_REGISTRY.length).toBeGreaterThan(0);

    const registeredIds = new Set(
      PROJECT_OWNERSHIP_REGISTRY.map((entry) => entry.elementId),
    );
    for (const id of EXPECTED_ELEMENT_IDS) {
      expect(registeredIds.has(id)).toBe(true);
    }
  });

  it('every entry declares at least one owned property (Req 3.5)', () => {
    for (const entry of PROJECT_OWNERSHIP_REGISTRY) {
      expect(entry.properties.length).toBeGreaterThan(0);
    }
  });

  it('Motion entries only declare reveal/stagger properties (Req 3.1)', () => {
    const motionEntries = PROJECT_OWNERSHIP_REGISTRY.filter(
      (entry) => entry.engine === 'motion',
    );
    expect(motionEntries.length).toBeGreaterThan(0);

    for (const entry of motionEntries) {
      for (const property of entry.properties) {
        expect(
          MOTION_ALLOWED_PROPERTIES.has(property),
          `Motion entry "${entry.elementId}" declares out-of-scope property "${property}"`,
        ).toBe(true);
      }
    }
  });

  it('Anime entries only declare timeline/SVG/micro-interaction properties (Req 3.2)', () => {
    const animeEntries = PROJECT_OWNERSHIP_REGISTRY.filter(
      (entry) => entry.engine === 'anime',
    );
    expect(animeEntries.length).toBeGreaterThan(0);

    for (const entry of animeEntries) {
      for (const property of entry.properties) {
        expect(
          ANIME_ALLOWED_PROPERTIES.has(property),
          `Anime entry "${entry.elementId}" declares out-of-scope property "${property}"`,
        ).toBe(true);
      }
    }
  });

  it('has no cross-engine ownership conflicts (Req 3.3, 3.4, 3.5)', () => {
    expect(findOwnershipConflicts(PROJECT_OWNERSHIP_REGISTRY)).toEqual([]);
  });
});
