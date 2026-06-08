import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isValidEmail, validateContactForm } from './validation';
import type { ContactFormState } from '../types';

/**
 * Property-based test for the contact-form email-format validation logic.
 *
 * Property 8 asserts that `isValidEmail` rejects every malformed email string
 * and accepts every well-formed one, and that a fully populated contact form
 * carrying a malformed email is flagged invalid (i.e. it does not submit),
 * while a populated form with a well-formed email produces no email error.
 */

// Feature: personal-portfolio-website, Property 8: Email-format validation flags any malformed email
describe('Property 8: Email-format validation flags any malformed email', () => {
  // Generator for clearly malformed email strings. fast-check's emailAddress()
  // produces VALID addresses, so malformed cases are constructed deliberately.
  const malformedEmail = fc.oneof(
    // No '@' at all.
    fc.string({ minLength: 1 }).filter((s) => !s.includes('@') && !/\s/.test(s)),
    // Empty local part: "@domain.com".
    fc.domain().map((d) => `@${d}`),
    // Missing domain entirely: "local@".
    fc
      .stringMatching(/^[a-z0-9]+$/)
      .filter((s) => s.length > 0)
      .map((local) => `${local}@`),
    // Domain without a TLD/dot: "local@domain".
    fc.tuple(
      fc.stringMatching(/^[a-z0-9]+$/).filter((s) => s.length > 0),
      fc.stringMatching(/^[a-z0-9]+$/).filter((s) => s.length > 0),
    ).map(([local, host]) => `${local}@${host}`),
    // Contains whitespace, which a standard format disallows.
    fc
      .tuple(fc.emailAddress(), fc.constantFrom(' ', '\t', '\n'))
      .map(([email, ws]) => `${email}${ws}`),
    // Multiple '@' symbols.
    fc
      .tuple(fc.emailAddress(), fc.emailAddress())
      .map(([a, b]) => `${a}@${b}`),
    // Consecutive dots in the domain, e.g. "local@a..b.com".
    fc.emailAddress().map((email) => email.replace('@', '@a..b.')),
  );

  const nonEmptyText = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

  it('rejects malformed emails and accepts well-formed ones; a populated form with an invalid email does not submit', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        malformedEmail,
        nonEmptyText,
        nonEmptyText,
        (validEmail, badEmail, name, message) => {
          // Well-formed addresses pass the format check.
          expect(isValidEmail(validEmail)).toBe(true);

          // Malformed addresses fail the format check.
          expect(isValidEmail(badEmail)).toBe(false);

          // A populated form carrying a malformed email is flagged invalid
          // (an email error is present), which blocks submission (Req 7.10).
          const invalidState: ContactFormState = { name, email: badEmail, message };
          const invalidErrors = validateContactForm(invalidState);
          expect(invalidErrors.email).toBeDefined();

          // A populated form with a well-formed email has no email error and
          // is therefore submittable.
          const validState: ContactFormState = { name, email: validEmail, message };
          const validErrors = validateContactForm(validState);
          expect(validErrors.email).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
