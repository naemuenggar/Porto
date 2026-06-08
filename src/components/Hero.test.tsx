import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Hero } from './Hero';
import { scrollToSection } from '../lib/scroll';

// Mock the scroll helper so we can assert it is invoked with the right anchor
// without depending on jsdom layout/scroll behavior (Req 2.5).
vi.mock('../lib/scroll', () => ({
  scrollToSection: vi.fn(),
}));

const NAME = 'Naemu Enggar Mahcaya';
const ROLE = 'Web Developer & IT Student';
const SUMMARY =
  'Mahasiswa Teknologi Informasi yang memiliki minat pada pengembangan aplikasi web, implementasi UI, integrasi database, dan pembuatan website yang responsif, fungsional, serta mudah digunakan. Terbiasa membangun project menggunakan teknologi modern seperti React, TypeScript, Laravel, MySQL, Supabase, dan Tailwind CSS.';
const GITHUB_URL = 'https://github.com/example';
const LINKEDIN_URL = 'https://linkedin.com/in/example';
const CV_URL = 'https://example.com/cv.pdf';

/** Render the Hero with sensible defaults that individual tests can override. */
function renderHero(overrides: Partial<React.ComponentProps<typeof Hero>> = {}) {
  const props: React.ComponentProps<typeof Hero> = {
    name: NAME,
    role: ROLE,
    summary: SUMMARY,
    cvUrl: CV_URL,
    githubUrl: GITHUB_URL,
    linkedinUrl: LINKEDIN_URL,
    ...overrides,
  };
  return render(<Hero {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('Hero — content (Req 2.1–2.4)', () => {
  it('renders the exact name, role, and summary text', () => {
    renderHero();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(NAME);
    expect(screen.getByText(ROLE)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY)).toBeInTheDocument();
  });

  it('renders the "View Projects" and "Download CV" buttons', () => {
    renderHero();

    expect(screen.getByRole('button', { name: 'View Projects' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download CV' })).toBeInTheDocument();
  });
});

describe('Hero — View Projects (Req 2.5)', () => {
  it('calls scrollToSection("projects") when clicked', async () => {
    const user = userEvent.setup();
    renderHero();

    await user.click(screen.getByRole('button', { name: 'View Projects' }));

    expect(scrollToSection).toHaveBeenCalledTimes(1);
    expect(scrollToSection).toHaveBeenCalledWith('projects');
  });
});

describe('Hero — Download CV (Req 2.6, 2.7)', () => {
  it('initiates a download when cvUrl is valid and shows no error', async () => {
    const user = userEvent.setup();

    // Spy on anchor click so we can confirm a download was triggered without a
    // real navigation occurring in jsdom.
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      renderHero({ cvUrl: CV_URL });

      await user.click(screen.getByRole('button', { name: 'Download CV' }));

      expect(clickSpy).toHaveBeenCalledTimes(1);
      // No error indication should be present on the success path.
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    } finally {
      clickSpy.mockRestore();
    }
  });

  it('shows an error and does not navigate when cvUrl is null', async () => {
    const user = userEvent.setup();

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      renderHero({ cvUrl: null });

      await user.click(screen.getByRole('button', { name: 'Download CV' }));

      // An inline error indication is shown (Req 2.7)...
      expect(screen.getByRole('alert')).toBeInTheDocument();
      // ...and no download/navigation is initiated.
      expect(clickSpy).not.toHaveBeenCalled();
    } finally {
      clickSpy.mockRestore();
    }
  });
});

describe('Hero — social links (Req 2.8)', () => {
  it('renders GitHub and LinkedIn links opening in a new tab when URLs are provided', () => {
    renderHero({ githubUrl: GITHUB_URL, linkedinUrl: LINKEDIN_URL });

    const github = screen.getByRole('link', { name: 'GitHub profile' });
    const linkedin = screen.getByRole('link', { name: 'LinkedIn profile' });

    expect(github).toHaveAttribute('href', GITHUB_URL);
    expect(github).toHaveAttribute('target', '_blank');

    expect(linkedin).toHaveAttribute('href', LINKEDIN_URL);
    expect(linkedin).toHaveAttribute('target', '_blank');
  });
});
