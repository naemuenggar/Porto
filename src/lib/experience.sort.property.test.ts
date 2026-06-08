import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sortExperience } from './experience';
import type { ExperienceEntry } from '../types';

/**
 * Property-based test for `sortExperience` (Req 6.1).
 *
 * Generators produce arrays of ExperienceEntry with random sortKeys (and
 * non-unique ids/sortKeys are allowed) so the test exercises ties, negative
 * keys, and arbitrary orderings.
 */

/** Arbitrary for a single experience entry with a random sort key. */
const entryArb: fc.Arbitrary<ExperienceEntry> = fc.record({
  id: fc.string(),
  title: fc.string(),
  description: fc.string(),
  sortKey: fc.integer(),
});

/** Build a multiset (id -> count) so we can compare input/output ignoring order. */
function idMultiset(entries: ExperienceEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.id, (counts.get(entry.id) ?? 0) + 1);
  }
  return counts;
}

function multisetsEqual(
  a: Map<string, number>,
  b: Map<string, number>,
): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const [key, count] of a) {
    if (b.get(key) !== count) {
      return false;
    }
  }
  return true;
}

describe('sortExperience', () => {
  // Feature: personal-portfolio-website, Property 5: Experience entries are ordered most recent to oldest
  it('orders entries by descending sortKey and is a non-mutating permutation of the input', () => {
    fc.assert(
      fc.property(fc.array(entryArb), (entries) => {
        const inputSnapshot = entries.map((entry) => ({ ...entry }));

        const result = sortExperience(entries);

        // Descending order by sortKey (most recent first).
        for (let i = 1; i < result.length; i++) {
          expect(result[i - 1].sortKey).toBeGreaterThanOrEqual(
            result[i].sortKey,
          );
        }

        // Permutation of the input: same length and same multiset of ids.
        expect(result.length).toBe(entries.length);
        expect(
          multisetsEqual(idMultiset(result), idMultiset(entries)),
        ).toBe(true);

        // Input array is not mutated (order and contents unchanged).
        expect(entries).toEqual(inputSnapshot);
      }),
      { numRuns: 100 },
    );
  });
});
