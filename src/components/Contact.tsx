import { useState } from 'react';
import type { FormEvent } from 'react';
import { SiGithub } from 'react-icons/si';
import { FaEnvelope, FaMapMarkerAlt, FaLinkedin } from 'react-icons/fa';

import { ExternalLink } from './ExternalLink';
import { LIMITS, isValidEmail, validateContactForm } from '../lib/validation';
import type {
  ContactDetails,
  ContactFormErrors,
  ContactFormState,
} from '../types';

/**
 * Contact section (Requirement 7).
 *
 * Two pieces are exported:
 *
 * - {@link Contact}: shows the candidate's contact details (email, GitHub,
 *   LinkedIn, location), each with an adjacent icon (Req 7.1, 7.4). The email
 *   uses a `mailto:` link (Req 7.3); the GitHub/LinkedIn links delegate to the
 *   shared {@link ExternalLink} helper so they open in a new tab (Req 7.2). It
 *   also renders the {@link ContactForm}, supplying a default async submit
 *   handler so the section works standalone (the App can override later).
 * - {@link ContactForm}: a controlled Name/Email/Message form with max-length
 *   enforcement (Req 7.5, 7.6), a submit control (Req 7.7), on-blur email
 *   validation (Req 7.9), submit-time required-field/email validation
 *   (Req 7.8, 7.10), and success/failure handling (Req 7.11, 7.12).
 *
 * Visual styling uses only palette tokens (`base`, `surface`, `ink`, `accent`),
 * hover changes on the submit button, an accent focus ring on inputs/buttons,
 * body text at the ≥16px `text-base` minimum, and transitions bounded within
 * 100–500ms (Req 10.1, 10.2, 10.3, 10.4, 10.5).
 */

/** Shared input styling: palette tokens, ≥16px text, accent focus ring. */
const INPUT_BASE =
  'w-full rounded-md border border-ink/20 bg-base px-4 py-3 text-base text-ink ' +
  'placeholder:text-ink/40 transition-colors duration-200 focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent';

/** Submit button styling: filled accent, hover change, accent focus ring. */
const SUBMIT_BUTTON =
  'inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 ' +
  'text-base font-medium text-ink transition-colors duration-200 ' +
  'hover:bg-accent/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-base ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/** The empty form state used for initial render and post-success reset. */
const EMPTY_FORM: ContactFormState = { name: '', email: '', message: '' };

/**
 * A no-op default submit handler. Resolves immediately so the standalone
 * Contact section exercises the success path until the App injects a real one.
 */
function defaultSubmit(_data: ContactFormState): Promise<void> {
  return Promise.resolve();
}

export interface ContactFormProps {
  /**
   * Called with the form values on a valid submit. Resolving triggers the
   * confirmation + clear path (Req 7.11); rejecting triggers the error +
   * retain-values path (Req 7.12). Defaults to a resolved promise so the form
   * works standalone.
   */
  onSubmit?: (data: ContactFormState) => Promise<void>;
}

export function ContactForm({
  onSubmit = defaultSubmit,
}: ContactFormProps): JSX.Element {
  const [values, setValues] = useState<ContactFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
  // Submission-outcome banner: success confirmation or failure error (Req 7.11, 7.12).
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    field: keyof ContactFormState,
    value: string,
  ): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear the field-level error as the visitor edits it.
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /**
   * On blur of the Email field with a non-empty but malformed value, surface
   * the invalid-email message (Req 7.9). A valid or empty value clears it.
   */
  const handleEmailBlur = (): void => {
    const email = values.email;
    if (email.trim().length > 0 && !isValidEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address.',
      }));
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setConfirmation(null);
    setSubmitError(null);

    // Required-field + email-format validation (Req 7.8, 7.10).
    const validation = validateContactForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setStatus('submitting');
    try {
      // Valid submit: hand off to the caller (Req 7.11, 7.12).
      await onSubmit(values);
      // Success: confirmation message + clear all fields (Req 7.11).
      setConfirmation('Thanks! Your message has been sent.');
      setValues(EMPTY_FORM);
    } catch {
      // Failure: error message + retain entered values (Req 7.12).
      setSubmitError(
        'Sorry, your message could not be sent. Please try again.',
      );
    } finally {
      setStatus('idle');
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name field — accepts 1..100 chars (Req 7.5, 7.6). */}
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-name" className="text-base font-medium text-ink">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          maxLength={LIMITS.name}
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          className={INPUT_BASE}
        />
        {errors.name && (
          <p id="contact-name-error" role="alert" className="text-base text-accent">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email field — accepts 1..254 chars; blur-validates format (Req 7.5, 7.6, 7.9). */}
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-email" className="text-base font-medium text-ink">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          maxLength={LIMITS.email}
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={handleEmailBlur}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          className={INPUT_BASE}
        />
        {errors.email && (
          <p id="contact-email-error" role="alert" className="text-base text-accent">
            {errors.email}
          </p>
        )}
      </div>

      {/* Message field — accepts 1..1000 chars (Req 7.5, 7.6). */}
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="text-base font-medium text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={LIMITS.message}
          value={values.message}
          onChange={(e) => handleChange('message', e.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={`${INPUT_BASE} resize-y`}
        />
        {errors.message && (
          <p id="contact-message-error" role="alert" className="text-base text-accent">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit control (Req 7.7). */}
      <div className="flex flex-col gap-3">
        <button type="submit" disabled={status === 'submitting'} className={SUBMIT_BUTTON}>
          {status === 'submitting' ? 'Sending…' : 'Send Message'}
        </button>

        {/* Success confirmation (Req 7.11). */}
        {confirmation && (
          <p role="status" className="text-base font-medium text-accent">
            {confirmation}
          </p>
        )}

        {/* Submission failure error (Req 7.12). */}
        {submitError && (
          <p role="alert" className="text-base font-medium text-accent">
            {submitError}
          </p>
        )}
      </div>
    </form>
  );
}

export interface ContactProps {
  /** Contact details (email, GitHub, LinkedIn, location) shown in the section (Req 7.1). */
  details: ContactDetails;
  /**
   * Optional submit handler forwarded to the {@link ContactForm}. Defaults to a
   * resolved promise so the section works standalone; the App can override it.
   */
  onSubmit?: (data: ContactFormState) => Promise<void>;
}

export function Contact({ details, onSubmit }: ContactProps): JSX.Element {
  const { email, githubUrl, linkedinUrl, location } = details;

  return (
    <section id="contact" className="bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">Contact</h2>

        {/* Single-column on mobile; two columns from md up (Req 9.1). */}
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* Contact details, each with an adjacent icon (Req 7.1, 7.4). */}
          <ul className="flex flex-col gap-4">
            {/* Email via mailto: link (Req 7.3). */}
            <li className="flex items-center gap-3 text-base text-ink">
              <FaEnvelope aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-accent" />
              <a
                href={`mailto:${email}`}
                className="min-w-0 break-all rounded text-accent transition-colors duration-200 hover:text-ink hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {email}
              </a>
            </li>

            {/* GitHub — opens in a new tab (Req 7.2). */}
            <li className="flex items-center gap-3 text-base text-ink">
              <SiGithub aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-accent" />
              <ExternalLink href={githubUrl} aria-label="GitHub profile">
                <span>GitHub</span>
              </ExternalLink>
            </li>

            {/* LinkedIn — opens in a new tab (Req 7.2). */}
            <li className="flex items-center gap-3 text-base text-ink">
              <FaLinkedin aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-accent" />
              <ExternalLink href={linkedinUrl} aria-label="LinkedIn profile">
                <span>LinkedIn</span>
              </ExternalLink>
            </li>

            {/* Location text (Req 7.1). */}
            <li className="flex items-center gap-3 text-base text-ink">
              <FaMapMarkerAlt aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-accent" />
              <span>{location}</span>
            </li>
          </ul>

          {/* Contact form (Req 7.5–7.12). */}
          <ContactForm onSubmit={onSubmit} />
        </div>
      </div>
    </section>
  );
}

export default Contact;
