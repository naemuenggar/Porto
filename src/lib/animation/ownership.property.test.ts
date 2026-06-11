// Feature: portfolio-animation-upgrade, Property 2
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findOwnershipConflicts, isOwnershipValid } from './ownership';
import type { Engine, Ownership } from './types';

/**
 * Property-based test for the cross-library ownership conflict invariant.
 *
 * Property 2: No two engines own the same property on the same element.
 * `findOwnershipConflicts` returns empty iff no `(elementId, property)` pair is
 * claimed by more than one engine; a single element may appear under both
 * engines exactly when their property sets are disjoint.
 *
 * Validates: Requirements 3.3, 3.4
 */

const ENGINES: Engine[] = ['motion', 'anime'];

const elementIdArb: fc.Arbitrary<string> = fc.string({ minLength: 1, maxLength: 6 });
const propertyArb: fc.Arbitrary<string> = fc.constantFrom(
  'opacity',
  'transform',
  'scale',
  'translateY',
  'rotate',
  'x',
  'y',
  'width',
);
const engineArb: fc.Arbitrary<Engine> = fc.constantFrom(...ENGINES);

/** A flat claim of "this engine controls this property on this element". */
interface Claim {
  elementId: string;
  property: string;
  engine: Engine;
}

const claimArb: fc.Arbitrary<Claim> = fc.record({
  elementId: elementIdArb,
  property: propertyArb,
  engine: engineArb,
});

const SEP = '\u0000';

/**
 * Build a registry where every `(elementId, property)` is owned by at most one
 * engine, i.e. each element's per-engine property sets are disjoint. We keep the
 * first engine seen per `(elementId, property)` and then group by engine, so the
 * resulting registry can never contain a cross-engine collision.
 */
const disjointRegistryArb: fc.Arbitrary<Ownership[]> = fc
  .array(claimArb, { maxLength: 20 })
  .map((claims) => {
    const firstEngine = new Map<string, Engine>();
    for (const c of claims) {
      const key = `${c.elementId}${SEP}${c.property}`;
      if (!firstEngine.has(key)) {
        firstEngine.set(key, c.engine);
      }
    }

    const grouped = new Map<string, Ownership>();
    for (const [key, engine] of firstEngine) {
      const [elementId, property] = key.split(SEP);
      const groupKey = `${elementId}${SEP}${engine}`;
      let entry = grouped.get(groupKey);
      if (entry === undefined) {
        entry = { elementId, engine, properties: [] };
        grouped.set(groupKey, entry);
      }
      entry.properties.push(property);
    }

    return [...grouped.values()];
  });

describe('ownership conflict invariant (Property 2)', () => {
  // Feature: portfolio-animation-upgrade, Property 2
  it('(a) a property claimed by two different engines on one element is a conflict and invalidates the registry', () => {
    fc.assert(
      fc.property(
        disjointRegistryArb,
        elementIdArb,
        propertyArb,
        (base, conflictElementId, conflictProperty) => {
          // Force two distinct engines to claim the same (element, property).
          const registry: Ownership[] = [
            ...base,
            { elementId: conflictElementId, engine: 'motion', properties: [conflictProperty] },
            { elementId: conflictElementId, engine: 'anime', properties: [conflictProperty] },
          ];

          const conflicts = findOwnershipConflicts(registry);

          const forced = conflicts.find(
            (c) => c.elementId === conflictElementId && c.property === conflictProperty,
          );

          // The forced collision must be reported as a conflict...
          expect(forced).toBeDefined();
          expect(forced?.engines).toContain('motion');
          expect(forced?.engines).toContain('anime');

          // ...and the registry must therefore be invalid.
          expect(isOwnershipValid(registry)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: portfolio-animation-upgrade, Property 2
  it('(b) a registry with disjoint per-element property sets has zero conflicts and is valid', () => {
    fc.assert(
      fc.property(disjointRegistryArb, (registry) => {
        const conflicts = findOwnershipConflicts(registry);

        // No (elementId, property) is owned by more than one engine.
        expect(conflicts).toEqual([]);
        expect(isOwnershipValid(registry)).toBe(true);

        // Cross-check: a single element may legitimately appear under both
        // engines as long as its property sets remain disjoint.
        const propsByElementEngine = new Map<string, Set<string>>();
        for (const entry of registry) {
          const key = `${entry.elementId}${SEP}${entry.engine}`;
          const set = propsByElementEngine.get(key) ?? new Set<string>();
          for (const p of entry.properties) set.add(p);
          propsByElementEngine.set(key, set);
        }
        for (const entry of registry) {
          for (const other of ENGINES) {
            if (other === entry.engine) continue;
            const otherProps = propsByElementEngine.get(`${entry.elementId}${SEP}${other}`);
            if (otherProps === undefined) continue;
            for (const p of entry.properties) {
              expect(otherProps.has(p)).toBe(false);
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});
