import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Dependency / build smoke test.
 *
 * Verifies that package.json declares pinned, React-18-compatible versions of
 * the adopted icon/animation libraries (Iconsax, Motion, Anime.js) and that no
 * deferred runtime dependency (Jitter/Vector renderer, or a Barba transition
 * runtime) has been introduced ahead of the open questions (OQ-1/OQ-2/OQ-3).
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6, 10.5
 */

const here = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = resolve(here, '../../package.json');

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
const deps = pkg.dependencies ?? {};
const devDeps = pkg.devDependencies ?? {};

/** A pinned, exact version has no range prefix (^ or ~) and no range operator. */
function isPinnedExact(version: string | undefined): boolean {
  if (!version) return false;
  // Reject caret/tilde ranges, comparison ranges, wildcards, and OR ranges.
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version.trim());
}

describe('dependency smoke test — adopted animation/icon libraries', () => {
  it('declares iconsax-react as a dependency pinned to an exact version', () => {
    expect(deps).toHaveProperty('iconsax-react');
    expect(isPinnedExact(deps['iconsax-react'])).toBe(true);
  });

  it('declares motion as a dependency pinned to an exact version', () => {
    expect(deps).toHaveProperty('motion');
    expect(isPinnedExact(deps['motion'])).toBe(true);
  });

  it('declares animejs as a dependency pinned to an exact version', () => {
    expect(deps).toHaveProperty('animejs');
    expect(isPinnedExact(deps['animejs'])).toBe(true);
  });

  it('provides @types/animejs in devDependencies (animejs lacks bundled types)', () => {
    expect(devDeps).toHaveProperty('@types/animejs');
  });

  it('keeps React pinned to a React-18-compatible range', () => {
    expect(deps).toHaveProperty('react');
    expect(deps['react']).toMatch(/^[\^~]?18\./);
    expect(deps).toHaveProperty('react-dom');
    expect(deps['react-dom']).toMatch(/^[\^~]?18\./);
  });
});

describe('dependency smoke test — deferred runtimes are absent', () => {
  const allDeps = { ...deps, ...devDeps };
  const allNames = Object.keys(allDeps);

  it('does not declare any Jitter/Vector runtime dependency yet (OQ-3)', () => {
    const jitterLike = allNames.filter((name) => /jitter/i.test(name));
    expect(jitterLike).toEqual([]);
  });

  it('declares the Lottie player runtime pinned to an exact version (OQ-3 confirmed)', () => {
    // OQ-3 confirmed: the Jitter/Vector renderer is in scope and uses the
    // lazy-loaded Lottie player (@lottiefiles/dotlottie-react). The dependency
    // MUST be pinned to an explicit, React-18-compatible version (Req 1.2/1.3).
    expect(deps).toHaveProperty('@lottiefiles/dotlottie-react');
    expect(isPinnedExact(deps['@lottiefiles/dotlottie-react'])).toBe(true);
  });

  it('does not add an MP4 runtime player dependency (native <video> is used)', () => {
    // OQ-3 resolved to Lottie JSON via @lottiefiles/dotlottie-react; MP4 assets,
    // if any, are played with the native <video> element. No dedicated MP4/video
    // player runtime (video.js, hls.js, dash.js, etc.) should be declared (Req 1.4/10.5).
    const mp4PlayerLike = allNames.filter((name) => /video\.?js|hls|dash|mp4/i.test(name));
    expect(mp4PlayerLike).toEqual([]);
  });

  it('does not declare a Barba transition runtime yet (OQ-1/OQ-2)', () => {
    const barbaLike = allNames.filter((name) => /barba/i.test(name));
    expect(barbaLike).toEqual([]);
  });
});
