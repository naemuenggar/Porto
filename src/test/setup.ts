import '@testing-library/jest-dom';

// jsdom does not implement several browser APIs that the animation adapters
// (Motion / Anime.js) rely on. We provide lightweight shims here so reveal and
// micro-interaction adapters can mount in tests without throwing.
// _Requirements: 11.2_

// --- window.matchMedia (reduced-motion detection) ---------------------------
// jsdom has no matchMedia. Default the shim to "no preference" (matches: false)
// so animations are enabled in tests unless a test overrides this.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => {
    const mql: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // deprecated, kept for compatibility
      removeListener: () => {}, // deprecated, kept for compatibility
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
    return mql;
  };
}

// --- IntersectionObserver (Motion viewport observation) ---------------------
// jsdom has no IntersectionObserver. Provide a no-op implementation that
// records the API surface the adapters use (observe / unobserve / disconnect).
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
  // Mirror onto window so both access patterns resolve.
  (window as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    globalThis.IntersectionObserver;
}

// --- requestAnimationFrame / cancelAnimationFrame ---------------------------
// Provide a timer-backed shim so RAF callbacks run (and can be cancelled)
// without a persistent loop. Only added when jsdom lacks them.
if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return setTimeout(() => callback(performance.now()), 16) as unknown as number;
  };
}

if (typeof globalThis.cancelAnimationFrame !== 'function') {
  globalThis.cancelAnimationFrame = (handle: number): void => {
    clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
  };
}
