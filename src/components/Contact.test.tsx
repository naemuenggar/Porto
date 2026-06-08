import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Contact, ContactForm } from './Contact';
import { LIMITS } from '../lib/validation';
import type { ContactDetails, ContactFormState } from '../types';

const DETAILS: ContactDetails = {
  email: 'naemuenggar@gmail.com',
  githubUrl: 'https://github.com/naemuenggar',
  linkedinUrl: 'https://www.linkedin.com/in/naemu-enggar-mahacaya',
  location: 'Indonesia',
};

afterEach(() => {
  cleanup();
});

describe('Contact — contact details and adjacent icons (Req 7.1, 7.4)', () => {
  it('displays email, GitHub, LinkedIn, and location, each with an adjacent icon', () => {
    const { container } = render(<Contact details={DETAILS} />);

    // Email is shown as text inside its own list item.
    const emailLink = screen.getByRole('link', { name: DETAILS.email });
    expect(emailLink).toBeInTheDocument();

    // GitHub and LinkedIn links are present.
    expect(screen.getByRole('link', { name: 'GitHub profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LinkedIn profile' })).toBeInTheDocument();

    // Location text is present.
    expect(screen.getByText(DETAILS.location)).toBeInTheDocument();

    // Each detail row is a list item that also contains an SVG icon (Req 7.4).
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(4);
    items.forEach((item) => {
      expect(item.querySelector('svg')).not.toBeNull();
    });
  });
});

describe('Contact — email mailto behavior (Req 7.3)', () => {
  it('renders the email as a mailto: link addressed to the candidate', () => {
    render(<Contact details={DETAILS} />);

    const emailLink = screen.getByRole('link', { name: DETAILS.email });
    expect(emailLink).toHaveAttribute('href', `mailto:${DETAILS.email}`);
  });
});

describe('Contact form — input maxLength attributes (Req 7.5)', () => {
  it('applies maxLength of 100/254/1000 to Name/Email/Message', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'maxLength',
      String(LIMITS.name),
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'maxLength',
      String(LIMITS.email),
    );
    expect(screen.getByLabelText('Message')).toHaveAttribute(
      'maxLength',
      String(LIMITS.message),
    );

    // The constants match the requirement values explicitly (Req 7.5).
    expect(LIMITS.name).toBe(100);
    expect(LIMITS.email).toBe(254);
    expect(LIMITS.message).toBe(1000);
  });
});

describe('Contact form — submit control (Req 7.7)', () => {
  it('renders a submit control', () => {
    render(<ContactForm />);

    const submit = screen.getByRole('button', { name: 'Send Message' });
    expect(submit).toBeInTheDocument();
    expect(submit).toHaveAttribute('type', 'submit');
  });
});

describe('Contact form — success path (Req 7.11)', () => {
  it('shows a confirmation and clears the fields when submission resolves', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(
      (_data: ContactFormState): Promise<void> => Promise.resolve(),
    );

    render(<ContactForm onSubmit={onSubmit} />);

    const name = screen.getByLabelText('Name') as HTMLInputElement;
    const email = screen.getByLabelText('Email') as HTMLInputElement;
    const message = screen.getByLabelText('Message') as HTMLTextAreaElement;

    await user.type(name, 'Jane Doe');
    await user.type(email, 'jane@example.com');
    await user.type(message, 'Hello there!');

    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    // Confirmation message is shown (Req 7.11).
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Thanks! Your message has been sent.',
    );

    // The handler received the entered values.
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there!',
    });

    // Fields are cleared after success (Req 7.11).
    await waitFor(() => {
      expect(name.value).toBe('');
      expect(email.value).toBe('');
      expect(message.value).toBe('');
    });
  });
});

describe('Contact form — failure path (Req 7.12)', () => {
  it('shows an error and retains the entered values when submission rejects', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(
      (_data: ContactFormState): Promise<void> =>
        Promise.reject(new Error('network down')),
    );

    render(<ContactForm onSubmit={onSubmit} />);

    const name = screen.getByLabelText('Name') as HTMLInputElement;
    const email = screen.getByLabelText('Email') as HTMLInputElement;
    const message = screen.getByLabelText('Message') as HTMLTextAreaElement;

    await user.type(name, 'Jane Doe');
    await user.type(email, 'jane@example.com');
    await user.type(message, 'Hello there!');

    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    // Error message is shown (Req 7.12).
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sorry, your message could not be sent. Please try again.',
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Entered values are retained (Req 7.12).
    expect(name.value).toBe('Jane Doe');
    expect(email.value).toBe('jane@example.com');
    expect(message.value).toBe('Hello there!');
  });
});
