import { Icons } from '../lib/icons';
import { ExternalLink } from './ExternalLink';

/**
 * Footer section (Req 8).
 *
 * Renders the candidate's name as visible text (Req 8.1) and exactly two
 * distinct external links labeled "GitHub" and "LinkedIn" (Req 8.2). Each link
 * delegates to {@link ExternalLink}, which opens a configured destination in a
 * new browser tab while keeping the current page open (Req 8.3, 8.4) and, when
 * no destination is configured, renders a non-navigating, visibly unavailable
 * element instead (Req 8.5).
 *
 * Visual styling uses only palette tokens (`surface` background, `ink` text)
 * with transitions bounded within 100–500ms.
 */
export interface FooterProps {
  /** Candidate name shown as visible text (Req 8.1). */
  name: string;
  /** GitHub profile URL, or null when not configured (renders unavailable). */
  githubUrl: string | null;
  /** LinkedIn profile URL, or null when not configured (renders unavailable). */
  linkedinUrl: string | null;
}

export function Footer({
  name,
  githubUrl,
  linkedinUrl,
}: FooterProps): JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface text-ink">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        {/* Candidate name as visible text (Req 8.1). */}
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold text-ink">{name}</span>
          <span className="text-sm text-ink/70">
            © {year} {name}. All rights reserved.
          </span>
        </div>

        {/* Exactly two distinct external links: GitHub and LinkedIn (Req 8.2). */}
        <nav aria-label="Footer social links" className="flex items-center gap-6">
          <ExternalLink href={githubUrl} aria-label="GitHub">
            <Icons.github aria-hidden="true" className="h-5 w-5" />
            <span>GitHub</span>
          </ExternalLink>

          <ExternalLink href={linkedinUrl} aria-label="LinkedIn">
            <Icons.linkedin aria-hidden="true" className="h-5 w-5" />
            <span>LinkedIn</span>
          </ExternalLink>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
