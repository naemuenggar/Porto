/**
 * Smooth-scroll helper for in-page navigation.
 *
 * Wraps `scrollIntoView({ behavior: 'smooth' })` so navigation links and the
 * Hero "View Projects" button can scroll a Section_Anchor to the top of the
 * viewport (Req 1.2, 2.5). The DOM lookup is guarded so a missing element is a
 * safe no-op rather than a runtime error.
 */
export function scrollToSection(anchorId: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const target = document.getElementById(anchorId);
  target?.scrollIntoView({ behavior: 'smooth' });
}
