import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { withinLimit, LIMITS } from './validation';

// Feature: personal-portfolio-website, Property 9: Field input never exceeds its maximum length
describe('Property 9: Field input never exceeds its maximum length', () => {
  it('withinLimit truthfully reflects value.length <= limit for each field maximum', () => {
    // Validates: Requirements 7.5, 7.6
    const limits = [LIMITS.name, LIMITS.email, LIMITS.message] as const;

    fc.assert(
      fc.property(
        // A field maximum to test against (Name 100, Email 254, Message 1000).
        fc.constantFrom(...limits),
        // Random strings whose length spans well under and well over every
        // limit (max 1100 > 1000) so we exercise both the "retained"
        // (<= limit) and "rejected" (> limit) sides of each field maximum.
        fc.string({ maxLength: 1100 }),
        (limit, value) => {
          // withinLimit must mirror the truthful relationship value.length <= limit.
          expect(withinLimit(value, limit)).toBe(value.length <= limit);
        },
      ),
      { numRuns: 100 },
    );
  });
});
