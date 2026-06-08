import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Navbar } from './Navbar';
import { navLinks } from '../data/content';
import { scrollToSection } from '../lib/scroll';

// Mock the scroll helper so link selection can be asserted without touching
// real DOM scrolling (which jsdom does not implement).
vi.mock('../lib/scroll', () => ({
  scrollToSection: vi.fn(),
}));

const scrollToSectionMock = vi.mocked(scrollToSection);

/**
 * Example (assertion) tests for the Navbar component.
 *
 * These pin the navigation labels/order, fixed positioning, the mobile menu
 * control, its initial collapsed state, and the toggle + link-select behavior.
 *
 * _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_
 */

const EXPECTED_LABELS = [
  'Home',
  'About',
  'Skills',
  'Projects',
  'Experience',
  'Contact',
];

/** The id of the collapsible mobile menu rendered only when expanded. */
const MOBILE_MENU_ID = 'primary-navigation-menu';
const MENU_CONTROL_LABEL_OPEN = 'Open navigation menu';
const MENU_CONTROL_LABEL_CLOSE = 'Close navigation menu';

describe('Navbar', () => {
  beforeEach(() => {
    scrollToSectionMock.mockClear();
  });

  it('renders the six navigation labels in the required order (Req 1.1)', () => {
    render(<Navbar links={navLinks} />);

    // While collapsed, only the inline link list is rendered (the collapsible
    // mobile menu is absent), so a single list holds the nav entries.
    const list = screen.getByRole('list');
    const labels = within(list)
      .getAllByRole('button')
      .map((button) => button.textContent);

    expect(labels).toEqual(EXPECTED_LABELS);
  });

  it('uses fixed positioning so it stays visible while scrolling (Req 1.3)', () => {
    render(<Navbar links={navLinks} />);

    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav.className).toContain('fixed');
  });

  it('renders a mobile menu control and starts collapsed on load (Req 1.4, 1.5)', () => {
    const { container } = render(<Navbar links={navLinks} />);

    const menuControl = screen.getByRole('button', {
      name: MENU_CONTROL_LABEL_OPEN,
    });
    expect(menuControl).toBeInTheDocument();
    expect(menuControl).toHaveAttribute('aria-expanded', 'false');

    // The collapsible link list must not be present in the collapsed state.
    expect(container.querySelector(`#${MOBILE_MENU_ID}`)).toBeNull();
  });

  it('toggling the control expands the collapsible menu links (Req 1.6)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Navbar links={navLinks} />);

    await user.click(
      screen.getByRole('button', { name: MENU_CONTROL_LABEL_OPEN }),
    );

    const mobileMenu = container.querySelector(`#${MOBILE_MENU_ID}`);
    expect(mobileMenu).not.toBeNull();

    const expandedLabels = within(mobileMenu as HTMLElement)
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(expandedLabels).toEqual(EXPECTED_LABELS);

    // The control now reflects the expanded state.
    expect(
      screen.getByRole('button', { name: MENU_CONTROL_LABEL_CLOSE }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('selecting a link scrolls to its section and collapses the menu (Req 1.2, 1.7)', async () => {
    const user = userEvent.setup();
    const { container } = render(<Navbar links={navLinks} />);

    // Expand the mobile menu first.
    await user.click(
      screen.getByRole('button', { name: MENU_CONTROL_LABEL_OPEN }),
    );

    const mobileMenu = container.querySelector(`#${MOBILE_MENU_ID}`);
    expect(mobileMenu).not.toBeNull();

    // Select the "Projects" link from within the expanded mobile menu.
    const projectsLink = within(mobileMenu as HTMLElement).getByRole('button', {
      name: 'Projects',
    });
    await user.click(projectsLink);

    // Req 1.2: the matching section anchor is scrolled into view.
    expect(scrollToSectionMock).toHaveBeenCalledWith('projects');

    // Req 1.7: selecting a link collapses the menu back to hidden.
    expect(container.querySelector(`#${MOBILE_MENU_ID}`)).toBeNull();
    expect(
      screen.getByRole('button', { name: MENU_CONTROL_LABEL_OPEN }),
    ).toHaveAttribute('aria-expanded', 'false');
  });
});
