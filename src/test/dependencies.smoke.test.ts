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
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6
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

  it('does not declare a Lottie/Vector player runtime yet (OQ-3)', () => {
    const vectorLike = allNames.filter((name) => /lottie/i.test(name));
    expect(vectorLike).toEqual([]);
  });

  it('does not declare a Barba transition runtime yet (OQ-1/OQ-2)', () => {
    const barbaLike = allNames.filter((name) => /barba/i.test(name));
    expect(barbaLike).toEqual([]);
  });
});
