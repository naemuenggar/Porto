import { useReducer } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

import { menuReducer, MENU_INITIAL_STATE } from '../lib/menu';
import { scrollToSection } from '../lib/scroll';
import type { NavLink } from '../types';

/**
 * Fixed navigation bar for the portfolio (Requirement 1).
 *
 * - Renders the supplied links in their given left-to-right order
 *   (Home, About, Skills, Projects, Experience, Contact) (Req 1.1).
 * - Uses `fixed top-0` full-width positioning so it stays visible while the
 *   page scrolls (Req 1.3).
 * - Below the `md` breakpoint (Mobile_Viewport, ≤767px) the inline links are
 *   hidden and a single hamburger menu control is shown; the links default to
 *   collapsed on load (Req 1.4, 1.5). At `md`+ (≥768px) the inline links are
 *   visible and the menu control is hidden.
 * - Open/closed state is driven by the pure `menuReducer` starting from the
 *   collapsed `MENU_INITIAL_STATE`; the menu control dispatches a `'toggle'`
 *   action to flip visibility (Req 1.6).
 * - Selecting a link scrolls its Section_Anchor into view via
 *   `scrollToSection` (Req 1.2) and collapses the menu when it is open
 *   (Req 1.7).
 *
 * Styling uses only palette tokens (`base`, `surface`, `ink`, `accent`) with
 * hover color changes, an accent focus-visible ring, and transitions bounded
 * within 100–500ms (Req 10.2, 10.3, 10.5).
 */
export interface NavbarProps {
  /** Navigation entries rendered in the order provided (Req 1.1). */
  links: NavLink[];
}

/** Shared interactive styling for nav controls (accent focus ring + hover). */
const INTERACTIVE_CLASSES =
  'rounded transition-colors duration-200 hover:text-accent ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-base';

export function Navbar({ links }: NavbarProps): JSX.Element {
  // Visibility state: false = collapsed (initial, Req 1.5), true = expanded.
  const [isOpen, dispatch] = useReducer(menuReducer, MENU_INITIAL_STATE);

  /** Toggle the mobile menu open/closed (Req 1.6). */
  const handleToggle = (): void => {
    dispatch('toggle');
  };

  /**
   * Scroll to the chosen section (Req 1.2) and, when the mobile menu is open,
   * collapse it back to the hidden state (Req 1.7).
   */
  const handleLinkSelect = (anchorId: string): void => {
    scrollToSection(anchorId);
    if (isOpen) {
      dispatch('toggle');
    }
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-surface bg-base/95 text-ink backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-end px-4 py-3">
        {/* Inline links: hidden on Mobile_Viewport, visible at md+ (Req 1.4) */}
        <ul className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <li key={link.anchorId}>
              <button
                type="button"
                onClick={() => handleLinkSelect(link.anchorId)}
                className={`text-base text-ink ${INTERACTIVE_CLASSES}`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Menu control: visible only on Mobile_Viewport (Req 1.4) */}
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls="primary-navigation-menu"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className={`flex-shrink-0 p-2 text-ink md:hidden ${INTERACTIVE_CLASSES}`}
        >
          {isOpen ? (
            <FiX className="h-6 w-6" aria-hidden="true" />
          ) : (
            <FiMenu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Collapsible mobile menu (Req 1.5, 1.6); hidden when collapsed and at md+ */}
      {isOpen && (
        <ul
          id="primary-navigation-menu"
          className="flex flex-col gap-1 border-t border-surface bg-base px-4 py-3 md:hidden"
        >
          {links.map((link) => (
            <li key={link.anchorId}>
              <button
                type="button"
                onClick={() => handleLinkSelect(link.anchorId)}
                className={`block w-full px-2 py-2 text-left text-base text-ink ${INTERACTIVE_CLASSES}`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

export default Navbar;
