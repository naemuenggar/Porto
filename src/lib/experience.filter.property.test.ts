import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterValidExperience } from './experience';
import type { ExperienceEntry } from '../types';

// Feature: personal-portfolio-website, Property 6: Invalid experience entries are omitted and valid ones retained
describe('Property 6: Invalid experience entries are omitted and valid ones retained', () => {
  it('filterValidExperience keeps every valid entry and drops every invalid one', () => {
    // Validates: Requirements 6.4

    // A valid title/description trims to 1..max non-whitespace characters.
    // We generate the non-whitespace content first, then optionally pad it with
    // surrounding whitespace so trimming is genuinely exercised.
    const validText = (max: number) =>
      fc
        .string({ minLength: 1, maxLength: max })
        // Constrain to non-whitespace so the trimmed length matches the raw length.
        .filter((s) => s.trim().length >= 1 && s.trim().length <= max)
        .chain((core) =>
          fc
            .tuple(
              fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { maxLength: 5 }),
              fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { maxLength: 5 }),
            )
            .map(([lead, trail]) => lead + core + trail),
        );

    // Invalid text is either empty, whitespace-only, or oversized (trimmed
    // length exceeds the bound).
    const invalidText = (max: number) =>
      fc.oneof(
        fc.constant(''),
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 6 }),
        // Oversized: more than `max` non-whitespace characters after trimming.
        fc
          .integer({ min: max + 1, max: max + 50 })
          .map((n) => 'x'.repeat(n)),
      );

    // An entry generator that independently chooses validity for title and
    // description, so we cover all four combinations of (valid/invalid).
    const entryArb: fc.Arbitrary<ExperienceEntry> = fc
      .record({
        id: fc.string(),
        titleValid: fc.boolean(),
        descValid: fc.boolean(),
        sortKey: fc.integer(),
      })
      .chain(({ id, titleValid, descValid, sortKey }) =>
        fc
          .tuple(
            titleValid ? validText(100) : invalidText(100),
            descValid ? validText(500) : invalidText(500),
          )
          .map(([title, description]) => ({ id, title, description, sortKey })),
      );

    // Independent oracle mirroring the spec's validity rule (Req 6.4).
    const isValid = (e: ExperienceEntry) => {
      const t = e.title.trim().length;
      const d = e.description.trim().length;
      return t >= 1 && t <= 100 && d >= 1 && d <= 500;
    };

    fc.assert(
      fc.property(fc.array(entryArb, { maxLength: 30 }), (entries) => {
        const result = filterValidExperience(entries);
        const expected = entries.filter(isValid);

        // Exactly the valid entries are returned, in their original order,
        // with no invalid entry surviving and no valid entry dropped.
        expect(result).toEqual(expected);
        // Every surviving entry genuinely satisfies the bounds.
        expect(result.every(isValid)).toBe(true);
        // No invalid entry leaked through.
        expect(result.some((e) => !isValid(e))).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
