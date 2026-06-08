/**
 * Pure menu-toggle reducer for the mobile Navbar (Req 1.6).
 *
 * The boolean state represents navigation-link visibility: `false` is the
 * collapsed (hidden) state the Navbar initializes to on load (Req 1.5), and
 * `true` is the expanded (visible) state.
 *
 * The reducer is intentionally framework-agnostic and side-effect free so it
 * can be property-tested for parity: starting from `false`, each `'toggle'`
 * flips the boolean, meaning an odd number of toggles yields `true` (expanded)
 * and an even number yields `false` (collapsed). Two consecutive toggles are
 * self-inverse and return the menu to its previous state.
 */

/** The single action accepted by the menu reducer. */
export type MenuAction = 'toggle';

/** Visibility state when the Navbar first loads (Req 1.5). */
export const MENU_INITIAL_STATE = false;

/**
 * Reduce a menu visibility state given an action.
 *
 * @param state Current visibility: `true` = expanded, `false` = collapsed.
 * @param action The action to apply; `'toggle'` flips visibility.
 * @returns The next visibility state.
 */
export function menuReducer(state: boolean, action: MenuAction): boolean {
  switch (action) {
    case 'toggle':
      return !state;
    default:
      return state;
  }
}

/** Convenience flip helper equivalent to `menuReducer(state, 'toggle')`. */
export function toggleMenu(state: boolean): boolean {
  return menuReducer(state, 'toggle');
}
