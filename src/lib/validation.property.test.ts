import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateContactForm } from './validation';
import type { ContactFormState } from '../types';

/**
 * Property-based tests for the contact-form validation logic.
 */
describe('validateContactForm - required-field validation', () => {
  // Feature: personal-portfolio-website, Property 7: Required-field validation flags every empty field and blocks submission
  it('flags every empty/whitespace-only field and blocks submission', () => {
    // A value that counts as "empty" after trimming: "" or whitespace-only.
    const emptyValue = fc.stringMatching(/^\s*$/);
    // A value that is genuinely present (at least one non-whitespace char).
    const presentValue = fc
      .string({ minLength: 1 })
      .filter((s) => s.trim().length > 0);

    // Each field is either empty or present, chosen independently.
    const fieldArb = fc.oneof(
      emptyValue.map((value) => ({ value, isEmpty: true })),
      presentValue.map((value) => ({ value, isEmpty: false })),
    );

    fc.assert(
      fc.property(
        fieldArb,
        fieldArb,
        fieldArb,
        // Keep a valid email when "present" so the email error, if any,
        // is attributable to emptiness rather than format.
        fc.constant('person@example.com'),
        (nameField, emailField, messageField, validEmail) => {
          // Ensure at least one field is empty so the property is exercised.
          fc.pre(
            nameField.isEmpty || emailField.isEmpty || messageField.isEmpty,
          );

          const state: ContactFormState = {
            name: nameField.value,
            email: emailField.isEmpty ? emailField.value : validEmail,
            message: messageField.value,
          };

          const errors = validateContactForm(state);

          // Every empty field must produce its own error.
          if (nameField.isEmpty) {
            expect(errors.name).toBeTruthy();
          }
          if (emailField.isEmpty) {
            expect(errors.email).toBeTruthy();
          }
          if (messageField.isEmpty) {
            expect(errors.message).toBeTruthy();
          }

          // With at least one error present, submission is blocked:
          // a valid form is signalled by an empty errors object.
          expect(Object.keys(errors).length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 200 },
    );
  });
});
