import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

import { Footer } from './Footer';

const NAME = 'Naemu Enggar Mahcaya';
const GITHUB_URL = 'https://github.com/example';
const LINKEDIN_URL = 'https://linkedin.com/in/example';

/** Render the Footer with sensible defaults that individual tests can override. */
function renderFooter(
  overrides: Partial<React.ComponentProps<typeof Footer>> = {},
) {
  const props: React.ComponentProps<typeof Footer> = {
    name: NAME,
    githubUrl: GITHUB_URL,
    linkedinUrl: LINKEDIN_URL,
    ...overrides,
  };
  return render(<Footer {...props} />);
}

afterEach(() => {
  cleanup();
});

describe('Footer — candidate name (Req 8.1)', () => {
  it('renders the candidate name as visible text', () => {
    renderFooter();

    const name = screen.getByText(NAME, { selector: 'span' });
    expect(name).toBeInTheDocument();
    expect(name).toBeVisible();
  });
});

describe('Footer — social links (Req 8.2, 8.3, 8.4)', () => {
  it('renders exactly two labeled external links: GitHub and LinkedIn', () => {
    renderFooter();

    const nav = screen.getByRole('navigation', { name: 'Footer social links' });
    const links = within(nav).getAllByRole('link');

    expect(links).toHaveLength(2);
    expect(within(nav).getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
  });

  it('opens each link in a new tab when URLs are provided', () => {
    renderFooter();

    const github = screen.getByRole('link', { name: 'GitHub' });
    const linkedin = screen.getByRole('link', { name: 'LinkedIn' });

    expect(github).toHaveAttribute('href', GITHUB_URL);
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', expect.stringContaining('noopener'));

    expect(linkedin).toHaveAttribute('href', LINKEDIN_URL);
    expect(linkedin).toHaveAttribute('target', '_blank');
    expect(linkedin).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});

describe('Footer — unavailable links (Req 8.5)', () => {
  it('renders the GitHub link as unavailable (aria-disabled, no navigation) when its URL is null', () => {
    renderFooter({ githubUrl: null });

    const github = screen.getByRole('link', { name: 'GitHub' });
    expect(github).toHaveAttribute('aria-disabled', 'true');
    expect(github).not.toHaveAttribute('href');
    expect(github.tagName).not.toBe('A');
  });

  it('renders the LinkedIn link as unavailable (aria-disabled, no navigation) when its URL is null', () => {
    renderFooter({ linkedinUrl: null });

    const linkedin = screen.getByRole('link', { name: 'LinkedIn' });
    expect(linkedin).toHaveAttribute('aria-disabled', 'true');
    expect(linkedin).not.toHaveAttribute('href');
    expect(linkedin.tagName).not.toBe('A');
  });

  it('still renders exactly two labeled links when both URLs are null', () => {
    renderFooter({ githubUrl: null, linkedinUrl: null });

    const nav = screen.getByRole('navigation', { name: 'Footer social links' });
    const links = within(nav).getAllByRole('link');

    expect(links).toHaveLength(2);
    expect(within(nav).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(within(nav).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
