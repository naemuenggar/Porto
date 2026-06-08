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
    expect(about.paragraphs).toHaveLength(4);
    for (const paragraph of about.paragraphs) {
      expect(paragraph.trim().length).toBeGreaterThan(0);
    }
  });

  it('has three experience entries', () => {
    expect(experience).toHaveLength(3);
  });

  it('has exactly 3 projects', () => {
    expect(projects).toHaveLength(3);
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
      'Tailwind CSS',
      'Bootstrap',
      'Responsive Design',
    ]);
  });

  it('includes the expected backend & database skills', () => {
    const backend = skillCategories.find(
      (c) => c.title === 'Backend & Database',
    );
    expect(backend?.skills.map((s) => s.name)).toEqual([
      'PHP',
      'Laravel',
      'MySQL',
      'Supabase',
      'REST API Basic',
    ]);
  });

  it('includes the expected tools & deployment skills', () => {
    const tools = skillCategories.find((c) => c.title === 'Tools & Deployment');
    expect(tools?.skills.map((s) => s.name)).toEqual([
      'Git',
      'GitHub',
      'Vercel',
      'npm',
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
    expect(profile.role).toBe('Web Developer & IT Student');
  });

  it('has a non-empty hero summary mentioning web development', () => {
    expect(profile.summary.length).toBeGreaterThan(0);
    expect(profile.summary).toContain('pengembangan aplikasi web');
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
});

describe('content integrity — experience entries (Req 6.2, 6.3)', () => {
  it('contains exactly the three expected titles', () => {
    expect(experience.map((entry) => entry.title)).toEqual([
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
