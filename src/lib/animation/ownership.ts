/**
 * Cross-library ownership registry and conflict validator (pure).
 *
 * This module is the machine-checkable expression of Requirement 3: each
 * animated element declares, per engine, which CSS properties that engine
 * controls (Req 3.5). The validator guarantees no single property on a single
 * element is claimed by more than one engine (Req 3.3), while still allowing a
 * single element to appear under both Motion and Anime.js as long as their
 * property sets are disjoint (Req 3.4).
 *
 * The module is part of the pure animation logic layer (`src/lib/animation/`):
 * it has no React or DOM side effects, so it is freely importable by adapters
 * and exercisable by property tests.
 *
 * Requirements: 3.3 (no double-owned property), 3.4 (disjoint co-ownership),
 * 3.5 (documented per-element ownership).
 */

import type { Engine, Ownership } from './types';

/** A property on an element claimed by more than one engine. */
export interface OwnershipConflict {
  /** Logical element identifier where the collision occurs. */
  elementId: string;
  /** The CSS property that is claimed by more than one engine. */
  property: string;
  /** The engines that collide on this property (in first-seen order). */
  engines: Engine[];
}

/**
 * Find every `(elementId, property)` pair that is owned by more than one engine.
 *
 * The registry is valid (no conflicts) exactly when this returns an empty array.
 * A single element may appear under multiple engines without conflict as long as
 * the property sets those engines claim on that element are disjoint (Req 3.4).
 *
 * Duplicate `(engine, property)` claims for the same element (e.g. the same
 * engine listing a property twice, or two entries for the same engine) do NOT
 * constitute a conflict, because only one engine still owns the property.
 *
 * @param registry The declarative per-element ownership entries.
 * @returns One `OwnershipConflict` per element/property claimed by >1 engine.
 */
export function findOwnershipConflicts(registry: Ownership[]): OwnershipConflict[] {
  // For each element -> property -> set of distinct engines that claim it.
  const claims = new Map<string, Map<string, Engine[]>>();

  for (const entry of registry) {
    let byProperty = claims.get(entry.elementId);
    if (byProperty === undefined) {
      byProperty = new Map<string, Engine[]>();
      claims.set(entry.elementId, byProperty);
    }

    for (const property of entry.properties) {
      let engines = byProperty.get(property);
      if (engines === undefined) {
        engines = [];
        byProperty.set(property, engines);
      }
      // Only record an engine once per property so duplicate claims by the same
      // engine are not mistaken for a cross-engine conflict.
      if (!engines.includes(entry.engine)) {
        engines.push(entry.engine);
      }
    }
  }

  const conflicts: OwnershipConflict[] = [];
  for (const [elementId, byProperty] of claims) {
    for (const [property, engines] of byProperty) {
      if (engines.length > 1) {
        conflicts.push({ elementId, property, engines });
      }
    }
  }

  return conflicts;
}

/**
 * Whether a registry is free of ownership conflicts.
 *
 * @param registry The declarative per-element ownership entries.
 * @returns `true` iff `findOwnershipConflicts(registry)` is empty.
 */
export function isOwnershipValid(registry: Ownership[]): boolean {
  return findOwnershipConflicts(registry).length === 0;
}

/**
 * The project's animation ownership registry (Req 3.5).
 *
 * This records, per animated element, which engine owns which properties.
 * Motion owns scroll-reveal / stagger entrance properties (opacity + transform);
 * Anime.js owns physics micro-interactions and SVG line drawing on disjoint
 * properties so the two engines never compete for the same property on the same
 * element (Req 3.3, 3.4).
 *
 * This is an initial seed. It is expanded as Motion reveals (task 7.3) and
 * Anime.js micro-interactions / SVG draws (task 9.2) are attached to concrete
 * elements; every newly animated element must add its `Ownership` entry here.
 *
 * Motion ownership convention: Motion drives the scroll-reveal / stagger
 * entrance and therefore owns the compositor channels `opacity` and `transform`
 * (the entrance fade + `y`/`scale` rise). Anime.js micro-interactions added in
 * task 9.2 must claim DISJOINT transform sub-properties (`scale`, `translateY`,
 * `rotate`) so the two engines never collide on a shared property string
 * (Req 3.3, 3.4).
 */
export const PROJECT_OWNERSHIP_REGISTRY: Ownership[] = [
  // Hero (#home): staggered entrance of the identity, actions, and social row.
  { elementId: 'hero-intro', engine: 'motion', properties: ['opacity', 'transform'] },

  // About (#about): heading reveal + staggered paragraph entrance.
  { elementId: 'about-heading', engine: 'motion', properties: ['opacity', 'transform'] },
  { elementId: 'about-paragraphs', engine: 'motion', properties: ['opacity', 'transform'] },

  // Skills (#skills): heading reveal + staggered skill-card grid entrance.
  { elementId: 'skills-heading', engine: 'motion', properties: ['opacity', 'transform'] },
  { elementId: 'skills-cards', engine: 'motion', properties: ['opacity', 'transform'] },

  // Projects (#projects): heading reveal + staggered project-card grid entrance.
  { elementId: 'projects-heading', engine: 'motion', properties: ['opacity', 'transform'] },
  { elementId: 'projects-cards', engine: 'motion', properties: ['opacity', 'transform'] },

  // Experience (#experience): heading reveal + staggered timeline-entry entrance.
  { elementId: 'experience-heading', engine: 'motion', properties: ['opacity', 'transform'] },
  { elementId: 'experience-entries', engine: 'motion', properties: ['opacity', 'transform'] },

  // Contact (#contact): heading reveal, staggered detail rows, and form reveal.
  { elementId: 'contact-heading', engine: 'motion', properties: ['opacity', 'transform'] },
  { elementId: 'contact-details', engine: 'motion', properties: ['opacity', 'transform'] },
  { elementId: 'contact-form', engine: 'motion', properties: ['opacity', 'transform'] },

  // --- Anime.js (Timeline_Engine) micro-interactions (task 9.2) ---
  // These attach to focusable interactive elements that are SEPARATE DOM nodes
  // nested inside Motion's reveal/stagger wrappers, and are registered under
  // DISTINCT logical element ids so they are disjoint from every Motion entry
  // above. Each claims a single transform sub-property (`scale`/`translateY`)
  // that no Motion entry lists, so `findOwnershipConflicts` stays empty
  // (Req 3.2, 3.3, 3.4).

  // Hero (#home): physics press feedback on the two primary action buttons.
  { elementId: 'hero-cta-primary', engine: 'anime', properties: ['scale'] },
  { elementId: 'hero-cta-secondary', engine: 'anime', properties: ['scale'] },

  // Projects (#projects): physics "lift" on each focusable project card.
  { elementId: 'project-card', engine: 'anime', properties: ['translateY'] },

  // Contact (#contact): physics press feedback on the form submit control.
  { elementId: 'contact-submit', engine: 'anime', properties: ['scale'] },
];
