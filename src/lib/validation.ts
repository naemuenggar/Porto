import type { ContactFormState, ContactFormErrors } from '../types';

/**
 * Pure contact-form validation logic for the personal portfolio website.
 *
 * These functions are framework-agnostic (no React/DOM) so they can be unit-
 * and property-tested in isolation. See design "Logic Layer Interfaces".
 */

/**
 * Maximum accepted character lengths per contact-form field.
 * Name 100, Email 254, Message 1000 (Req 7.5, 7.6).
 */
export const LIMITS = { name: 100, email: 254, message: 1000 } as const;

/**
 * Standard email-address format check.
 *
 * Requires a single `@`, a non-empty local part, and a domain with at least
 * one dot-separated label and a top-level label. Disallows whitespace and
 * consecutive dots. (Req 7.9, 7.10)
 */
const EMAIL_PATTERN =
  /^[^\s@]+(?:\.[^\s@]+)*@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** Trims the value, then checks that at least one non-whitespace char remains. */
export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/** Returns true when the value's length does not exceed the given limit. */
export function withinLimit(value: string, limit: number): boolean {
  return value.length <= limit;
}

/** Returns true when the value matches a standard email-address format. */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/**
 * Validates a contact-form state.
 *
 * Returns an empty object when the form is valid. Otherwise populates a
 * per-field message for each empty Name/Email/Message field (Req 7.8) and for
 * an Email value that is present but not a valid email format (Req 7.9, 7.10).
 */
export function validateContactForm(state: ContactFormState): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!isNonEmpty(state.name)) {
    errors.name = 'Name is required.';
  }

  if (!isNonEmpty(state.email)) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(state.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!isNonEmpty(state.message)) {
    errors.message = 'Message is required.';
  }

  return errors;
}
