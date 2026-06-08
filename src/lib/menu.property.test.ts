import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { menuReducer, toggleMenu, MENU_INITIAL_STATE } from './menu';
import type { MenuAction } from './menu';

/**
 * Property-based test for the menu toggle reducer (Req 1.6).
 *
 * Generators produce random-length sequences of `'toggle'` actions starting
 * from the collapsed initial state (false). The resulting visibility must equal
 * the parity of the toggle count (odd = expanded/true, even = collapsed/false),
 * and any two consecutive toggles must be self-inverse (return to the previous
 * state).
 */

/** Arbitrary for a sequence of toggle actions of arbitrary length. */
const toggleSequenceArb: fc.Arbitrary<MenuAction[]> = fc.array(
  fc.constant<MenuAction>('toggle'),
);

describe('menuReducer toggle parity', () => {
  // Feature: personal-portfolio-website, Property 10: Menu toggle is parity-consistent and self-inverse
  it('resulting visibility equals the parity of the toggle count and two toggles are self-inverse', () => {
    fc.assert(
      fc.property(toggleSequenceArb, (actions) => {
        let state = MENU_INITIAL_STATE;

        actions.forEach((action, index) => {
          const previous = state;
          state = menuReducer(state, action);

          // Parity invariant: after (index + 1) toggles from false, the state
          // is true iff an odd number of toggles have been applied.
          const toggleCount = index + 1;
          expect(state).toBe(toggleCount % 2 === 1);

          // Single toggle always flips the boolean.
          expect(state).toBe(!previous);

          // Self-inverse: toggling twice returns to the previous state.
          expect(toggleMenu(state)).toBe(previous);
        });

        // Zero toggles leaves the menu collapsed (matches even parity).
        if (actions.length === 0) {
          expect(state).toBe(MENU_INITIAL_STATE);
          expect(MENU_INITIAL_STATE).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });
});
