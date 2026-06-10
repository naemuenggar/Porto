import { describe, it, expect } from 'vitest';
import {
  profile,
  about,
  skillCategories,
  projects,
  experience,
} from './content';

/**
 * Example (assertion) tests for content integrity.
 *
 * These pin the structure and key text of the content module so it cannot
 * silently drift from the intended portfolio data.
 */

describe('content integrity — counts', () => {
  it('groups skills into the four expected categories', () => {
    expect(skillCategories.map((c) => c.title)).toEqual([
      'Frontend',
      'Backend & Database',
      'Tools & Deployment',
      'Other',
    ]);
  });

  it('has a non-empty list of skills in every category', () => {
    for (const category of skillCategories) {
      expect(category.skills.length).toBeGreaterThan(0);
      for (const skill of category.skills) {
        expect(skill.name.length).toBeGreaterThan(0);
        expect(typeof skill.Icon).toBe('function');
      }
    }
  });

  it('has four About paragraphs', () => {
    expect(about.paragraphs).toHaveLength(5);
    for (const paragraph of about.paragraphs) {
      expect(paragraph.trim().length).toBeGreaterThan(0);
    }
  });

  it('has four experience entries', () => {
    expect(experience).toHaveLength(5);
  });

  it('has exactly 6 projects', () => {
    expect(projects).toHaveLength(6);
  });
});

describe('content integrity — skill labels', () => {
  it('includes the expected frontend skills', () => {
    const frontend = skillCategories.find((c) => c.title === 'Frontend');
    expect(frontend?.skills.map((s) => s.name)).toEqual([
      'HTML',
      'CSS',
      'JavaScript',
      'TypeScript',
      'React',
      'Vue 3',
      'Tailwind CSS',
      'Bootstrap',
      'Inertia.js',
      'Chart.js',
      'Responsive Design',
      'Responsive Dashboard UI',
    ]);
  });

  it('includes the expected backend & database skills', () => {
    const backend = skillCategories.find(
      (c) => c.title === 'Backend & Database',
    );
    expect(backend?.skills.map((s) => s.name)).toEqual([
      'PHP',
      'Laravel',
      'Laravel Breeze',
      'MySQL',
      'Supabase',
      'REST API Basic',
      'Authentication',
      'CRUD',
      'Database Migration',
      'Seeder',
    ]);
  });

  it('includes the expected tools & deployment skills', () => {
    const tools = skillCategories.find((c) => c.title === 'Tools & Deployment');
    expect(tools?.skills.map((s) => s.name)).toEqual([
      'Git',
      'GitHub',
      'Composer',
      'npm',
      'Vite',
      'Vercel',
      'XAMPP',
      'Visual Studio Code',
    ]);
  });

  it('includes the expected other skills', () => {
    const other = skillCategories.find((c) => c.title === 'Other');
    expect(other?.skills.map((s) => s.name)).toEqual([
      'Flutter',
      'Dart',
      'UI Implementation',
      'Debugging',
      'Basic IT Support',
    ]);
  });
});

describe('content integrity — profile pinned text', () => {
  it('uses the exact candidate name', () => {
    expect(profile.name).toBe('Naemu Enggar Mahcaya');
  });

  it('positions the candidate as a Web Developer', () => {
    expect(profile.role).toBe('Web Developer');
  });

  it('has a non-empty hero summary mentioning web development', () => {
    expect(profile.summary.length).toBeGreaterThan(0);
    expect(profile.summary).toContain('website modern');
  });
});

describe('content integrity — project pinned text (Req 5.2, 5.3, 5.4)', () => {
  it('pins the e-Commerce Website project (Req 5.2)', () => {
    const project = projects[0];
    expect(project.title).toBe('e-Commerce Website');
    expect(project.description).toBe(
      'Website e-commerce modern berbasis TypeScript yang memiliki fitur halaman produk, detail produk, cart, checkout, dan tampilan responsif.',
    );
    expect(project.techStack).toEqual(['TypeScript', 'React', 'Tailwind CSS']);
  });

  it('pins the SplitBillin – Split Bill App project (Req 5.3)', () => {
    const project = projects[1];
    expect(project.title).toBe('SplitBillin – Split Bill App');
    expect(project.description).toBe(
      'Aplikasi split bill berbasis web untuk membantu pengguna mencatat patungan, mengelola grup, menghitung saldo anggota, dan memantau pembayaran secara lebih mudah.',
    );
    expect(project.techStack).toEqual([
      'React',
      'Supabase',
      'Tailwind CSS',
      'Vercel',
    ]);
  });

  it('pins the Mobile / Flutter App project (Req 5.4)', () => {
    const project = projects[2];
    expect(project.title).toBe('Mobile / Flutter App');
    expect(project.description).toBe(
      'Aplikasi mobile sederhana yang dibuat menggunakan Flutter untuk latihan implementasi UI, navigasi halaman, dan integrasi data.',
    );
    expect(project.techStack).toEqual(['Flutter', 'Dart']);
  });

  it('pins the Admin Monitoring Dashboard project', () => {
    const project = projects[3];
    expect(project.title).toBe('Admin Monitoring Dashboard');
    expect(project.techStack).toEqual([
      'Laravel',
      'Vue 3',
      'Inertia.js',
      'Tailwind CSS',
      'MySQL',
      'Laravel Breeze',
      'Chart.js',
    ]);
    expect(project.githubUrl).toBe(
      'https://github.com/naemuenggar/Laravel-Monitoring',
    );
    expect(project.liveDemoUrl).toBeNull();
  });

  it('pins the CivicFlow project', () => {
    const project = projects[4];
    expect(project.title).toBe('CivicFlow — Public Issue Reporting');
    expect(project.techStack).toContain('Next.js 14');
    expect(project.techStack).toContain('Supabase');
    expect(project.githubUrl).toBe(
      'https://github.com/naemuenggar/civic-flow',
    );
    expect(project.liveDemoUrl).toBeNull();
  });

  it('pins the OmniDoc project', () => {
    const project = projects[5];
    expect(project.title).toBe('OmniDoc — Universal File Converter');
    expect(project.techStack).toEqual([
      'Vue 3',
      'TypeScript',
      'Vite',
      'Pinia',
      'Tailwind CSS',
      'WebAssembly',
    ]);
    expect(project.githubUrl).toBe(
      'https://github.com/naemuenggar/file-converter',
    );
    expect(project.liveDemoUrl).toBe('https://omnidoc-os.vercel.app/');
  });
});

describe('content integrity — experience entries (Req 6.2, 6.3)', () => {
  it('contains exactly the five expected titles', () => {
    expect(experience.map((entry) => entry.title)).toEqual([
      'Fullstack Web Platform Development',
      'Full-Stack Dashboard Development',
      'Web Development Project Experience',
      'Front-End & UI Implementation',
      'IT Student Learning Journey',
    ]);
  });

  it('has titles of 1–100 chars and descriptions of 1–500 chars (Req 6.3)', () => {
    for (const entry of experience) {
      expect(entry.title.length).toBeGreaterThanOrEqual(1);
      expect(entry.title.length).toBeLessThanOrEqual(100);
      expect(entry.description.length).toBeGreaterThanOrEqual(1);
      expect(entry.description.length).toBeLessThanOrEqual(500);
    }
  });
});
