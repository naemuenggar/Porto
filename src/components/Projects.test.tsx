import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen, within } from '@testing-library/react';

import { Projects, ProjectCard } from './Projects';
import { projects } from '../data/content';
import type { Project } from '../types';
import placeholderImage from '../assets/placeholder.svg';

/**
 * Example (assertion) tests for the Projects section.
 *
 * Coverage:
 *  - Req 5.2, 5.3, 5.4: the three pinned project cards render their exact
 *    titles, descriptions, and full technology stacks.
 *  - Req 5.5: every project card exposes a GitHub button and a Live Demo
 *    button.
 *  - Req 5.8: when a project image fails to load, the card swaps in the
 *    bundled placeholder while keeping the title, description, tech stack, and
 *    action links intact.
 *
 * _Requirements: 5.2, 5.3, 5.4, 5.5, 5.8_
 */

afterEach(() => {
  cleanup();
});

/** The three projects pinned by Req 5.2–5.4, with their exact content. */
const EXPECTED_PROJECTS = [
  {
    title: 'e-Commerce Website',
    description:
      'Website e-commerce modern berbasis TypeScript yang memiliki fitur halaman produk, detail produk, cart, checkout, dan tampilan responsif.',
    techStack: ['TypeScript', 'React', 'Tailwind CSS'],
  },
  {
    title: 'SplitBillin – Split Bill App',
    description:
      'Aplikasi split bill berbasis web untuk membantu pengguna mencatat patungan, mengelola grup, menghitung saldo anggota, dan memantau pembayaran secara lebih mudah.',
    techStack: ['React', 'Supabase', 'Tailwind CSS', 'Vercel'],
  },
  {
    title: 'Mobile / Flutter App',
    description:
      'Aplikasi mobile sederhana yang dibuat menggunakan Flutter untuk latihan implementasi UI, navigasi halaman, dan integrasi data.',
    techStack: ['Flutter', 'Dart'],
  },
  {
    title: 'Admin Monitoring Dashboard',
    description:
      'Aplikasi dashboard admin berbasis Laravel untuk menampilkan ringkasan data, mengelola user, mengelola data monitoring/product, melihat laporan, serta memantau aktivitas melalui tabel dan chart sederhana.',
    techStack: [
      'Laravel',
      'Vue 3',
      'Inertia.js',
      'Tailwind CSS',
      'MySQL',
      'Laravel Breeze',
      'Chart.js',
    ],
  },
  {
    title: 'CivicFlow — Public Issue Reporting',
    description:
      'Platform pelaporan masalah publik fullstack yang menghubungkan masyarakat, petugas, dan admin pemerintah daerah. Fitur termasuk RBAC, peta interaktif, dashboard statistik, upload foto, timeline status, dan audit log.',
    techStack: [
      'Next.js 14',
      'TypeScript',
      'Tailwind CSS',
      'Supabase',
      'React Leaflet',
      'Recharts',
    ],
  },
  {
    title: 'OmniDoc — Universal File Converter',
    description:
      'Suite konversi & edit dokumen yang berjalan 100% di sisi klien (browser). Mendukung konversi any-to-any (PDF, Word, PPT, Excel, gambar), OCR, dan tanda tangan PDF menggunakan WebAssembly & Web Workers — file tidak pernah meninggalkan perangkat pengguna.',
    techStack: ['Vue 3', 'TypeScript', 'Vite', 'Pinia', 'Tailwind CSS', 'WebAssembly'],
  },
] as const;

describe('Projects — pinned card content (Req 5.2, 5.3, 5.4)', () => {
  it('renders the exact titles, descriptions, and tech stacks for all three projects', () => {
    render(<Projects projects={projects} />);

    for (const expected of EXPECTED_PROJECTS) {
      // Title (rendered as a heading on each card).
      const heading = screen.getByRole('heading', { name: expected.title });
      expect(heading).toBeInTheDocument();

      // Description text is present verbatim.
      expect(screen.getByText(expected.description)).toBeInTheDocument();

      // Locate the owning card so tech-stack assertions are scoped to it.
      const card = heading.closest('li');
      expect(card).not.toBeNull();

      // Every technology-stack item renders within the card.
      for (const tech of expected.techStack) {
        expect(within(card as HTMLElement).getByText(tech)).toBeInTheDocument();
      }
    }
  });

  it('renders exactly six project cards', () => {
    render(<Projects projects={projects} />);

    const cardTitles = screen.getAllByRole('heading', { level: 3 });
    expect(cardTitles).toHaveLength(6);
  });
});

describe('Projects — action buttons (Req 5.5)', () => {
  it('renders a GitHub and a Live Demo button on each card', () => {
    render(<Projects projects={projects} />);

    for (const expected of EXPECTED_PROJECTS) {
      // The action buttons use accessible names derived from the title. Even
      // when the destination URL is null they still render (as a disabled,
      // non-navigating element with role="link").
      expect(
        screen.getByRole('link', { name: `${expected.title} GitHub repository` }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: `${expected.title} live demo` }),
      ).toBeInTheDocument();
    }
  });
});

describe('Projects — thumbnail rendering and content preservation (Req 5.8, 9.1)', () => {
  it('renders the project thumbnail via VectorMedia while retaining title, description, tech, and links', () => {
    // A project with a distinct (non-placeholder) image and configured links.
    // With no animated `media`, VectorMedia fails visible to the static
    // thumbnail (`fallbackSrc`, the project image), preserving the existing
    // static-image behavior (Req 5.8).
    const project: Project = {
      title: 'e-Commerce Website',
      description:
        'Website e-commerce modern berbasis TypeScript yang memiliki fitur halaman produk, detail produk, cart, checkout, dan tampilan responsif.',
      techStack: ['TypeScript', 'React', 'Tailwind CSS'],
      imageUrl: 'https://example.com/project-image.png',
      githubUrl: 'https://github.com/example/repo',
      liveDemoUrl: 'https://example.com/demo',
    };

    render(
      <ul>
        <ProjectCard project={project} />
      </ul>,
    );

    // The thumbnail renders the project's static image (VectorMedia's
    // fail-visible static source) with the project preview alt text.
    const image = screen.getByRole('img', { name: 'e-Commerce Website preview' });
    expect(image).toHaveAttribute('src', project.imageUrl);

    // Title, description, and tech stack remain intact.
    expect(
      screen.getByRole('heading', { name: 'e-Commerce Website' }),
    ).toBeInTheDocument();
    expect(screen.getByText(project.description)).toBeInTheDocument();
    for (const tech of project.techStack) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }

    // Both action links remain present and still point at their destinations.
    const github = screen.getByRole('link', {
      name: 'e-Commerce Website GitHub repository',
    });
    const liveDemo = screen.getByRole('link', {
      name: 'e-Commerce Website live demo',
    });
    expect(github).toHaveAttribute('href', project.githubUrl);
    expect(liveDemo).toHaveAttribute('href', project.liveDemoUrl);
  });

  it('falls back to the bundled placeholder when a project has no image URL', () => {
    // An empty image URL has no static source, so the card uses the bundled
    // placeholder as the ultimate fallback (Req 5.8).
    const project: Project = {
      title: 'No Image Project',
      description: 'A project without a configured thumbnail image.',
      techStack: ['React'],
      imageUrl: '',
      githubUrl: null,
      liveDemoUrl: null,
    };

    render(
      <ul>
        <ProjectCard project={project} />
      </ul>,
    );

    const image = screen.getByRole('img', { name: 'No Image Project preview' });
    expect(image).toHaveAttribute('src', placeholderImage);
  });
});
