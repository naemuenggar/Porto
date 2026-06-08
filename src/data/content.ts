/**
 * Central content/data module — the single source of truth for all pinned
 * portfolio text, skills, projects, experience, links, and navigation.
 *
 * All text below is fixed per the requirements document and must not be
 * paraphrased. Rendering components consume these typed constants so the UI
 * stays data-driven and easy to test.
 */
import {
  SiHtml5,
  SiCss,
  SiJavascript,
  SiTypescript,
  SiReact,
  SiTailwindcss,
  SiBootstrap,
  SiPhp,
  SiLaravel,
  SiMysql,
  SiSupabase,
  SiGit,
  SiGithub,
  SiVercel,
  SiNpm,
  SiFlutter,
  SiDart,
} from 'react-icons/si';
import { FaPalette } from 'react-icons/fa';
import { MdDevices, MdBugReport, MdSupportAgent } from 'react-icons/md';
import { TbApi } from 'react-icons/tb';
import { VscCode } from 'react-icons/vsc';

import type {
  ContactDetails,
  ExperienceEntry,
  NavLink,
  Project,
  SkillCategory,
} from '../types';

/** Hero/profile identity text (Req 2.1, 2.2, 2.3). */
export const profile = {
  name: 'Naemu Enggar Mahcaya',
  role: 'Web Developer & IT Student',
  summary:
    'Mahasiswa Teknologi Informasi yang memiliki minat pada pengembangan aplikasi web, implementasi UI, integrasi database, dan pembuatan website yang responsif, fungsional, serta mudah digunakan. Terbiasa membangun project menggunakan teknologi modern seperti React, TypeScript, Laravel, MySQL, Supabase, dan Tailwind CSS.',
} as const;

/** About section content — professional multi-paragraph profile. */
export const about = {
  paragraphs: [
    'Saya adalah mahasiswa Teknologi Informasi yang memiliki ketertarikan kuat pada pengembangan website dan aplikasi berbasis web. Saya fokus membangun aplikasi yang tidak hanya memiliki tampilan menarik, tetapi juga fungsional, responsif, dan nyaman digunakan oleh pengguna.',
    'Dalam proses belajar dan mengembangkan project, saya terbiasa mengerjakan bagian front-end seperti slicing UI, membuat layout responsive, membangun komponen reusable, serta menghubungkan tampilan dengan data. Selain itu, saya juga memiliki pengalaman menggunakan Laravel, MySQL, dan Supabase untuk kebutuhan backend sederhana, autentikasi, penyimpanan data, dan pengelolaan informasi.',
    'Beberapa project yang saya kerjakan meliputi website e-commerce, aplikasi split bill, dashboard web application, dan aplikasi mobile sederhana. Dari project tersebut, saya belajar bagaimana merancang alur pengguna, mengelola data, memperbaiki bug, serta memastikan aplikasi dapat berjalan dengan baik ketika digunakan secara langsung.',
    'Saat ini saya terus mengembangkan kemampuan di bidang web development, terutama pada React, TypeScript, Laravel, database, dan deployment aplikasi. Saya terbuka untuk kesempatan magang atau kerja praktik di bidang Web Developer, Front-End Developer, atau IT Development.',
  ],
} as const;

/**
 * Skills grouped into categories (Req 4.1, 4.3). Each skill is rendered as an
 * individual card with an icon and text label; the label is always shown so a
 * failed icon never leaves a card empty (Req 4.4).
 */
export const skillCategories: SkillCategory[] = [
  {
    title: 'Frontend',
    skills: [
      { name: 'HTML', Icon: SiHtml5 },
      { name: 'CSS', Icon: SiCss },
      { name: 'JavaScript', Icon: SiJavascript },
      { name: 'TypeScript', Icon: SiTypescript },
      { name: 'React', Icon: SiReact },
      { name: 'Tailwind CSS', Icon: SiTailwindcss },
      { name: 'Bootstrap', Icon: SiBootstrap },
      { name: 'Responsive Design', Icon: MdDevices },
    ],
  },
  {
    title: 'Backend & Database',
    skills: [
      { name: 'PHP', Icon: SiPhp },
      { name: 'Laravel', Icon: SiLaravel },
      { name: 'MySQL', Icon: SiMysql },
      { name: 'Supabase', Icon: SiSupabase },
      { name: 'REST API Basic', Icon: TbApi },
    ],
  },
  {
    title: 'Tools & Deployment',
    skills: [
      { name: 'Git', Icon: SiGit },
      { name: 'GitHub', Icon: SiGithub },
      { name: 'Vercel', Icon: SiVercel },
      { name: 'npm', Icon: SiNpm },
      { name: 'Visual Studio Code', Icon: VscCode },
    ],
  },
  {
    title: 'Other',
    skills: [
      { name: 'Flutter', Icon: SiFlutter },
      { name: 'Dart', Icon: SiDart },
      { name: 'UI Implementation', Icon: FaPalette },
      { name: 'Debugging', Icon: MdBugReport },
      { name: 'Basic IT Support', Icon: MdSupportAgent },
    ],
  },
];

/**
 * Portfolio projects (Req 5.1, 5.2, 5.3, 5.4).
 * githubUrl / liveDemoUrl are null where no real destination is configured;
 * the UI renders those action buttons in a disabled state (Req 5.7).
 */
export const projects: Project[] = [
  {
    title: 'e-Commerce Website',
    description:
      'Website e-commerce modern berbasis TypeScript yang memiliki fitur halaman produk, detail produk, cart, checkout, dan tampilan responsif.',
    techStack: ['TypeScript', 'React', 'Tailwind CSS'],
    imageUrl: '/projects/ecommerce.png',
    githubUrl: 'https://github.com/naemuenggar/e-commerce',
    liveDemoUrl: null,
  },
  {
    title: 'SplitBillin – Split Bill App',
    description:
      'Aplikasi split bill berbasis web untuk membantu pengguna mencatat patungan, mengelola grup, menghitung saldo anggota, dan memantau pembayaran secara lebih mudah.',
    techStack: ['React', 'Supabase', 'Tailwind CSS', 'Vercel'],
    imageUrl: '/projects/splitbill.png',
    githubUrl: 'https://github.com/naemuenggar/SplitBillin',
    liveDemoUrl: 'https://splitbillin.vercel.app/',
  },
  {
    title: 'Mobile / Flutter App',
    description:
      'Aplikasi mobile sederhana yang dibuat menggunakan Flutter untuk latihan implementasi UI, navigasi halaman, dan integrasi data.',
    techStack: ['Flutter', 'Dart'],
    imageUrl: '/projects/flutter.png',
    githubUrl: 'https://github.com/naemuenggar/Dart-Queue',
    liveDemoUrl: null,
  },
];

/**
 * Experience timeline entries — project-based / learning experience.
 * `sortKey` is higher for more recent items so the timeline renders
 * most-recent-first after sorting. Titles are 1–100 chars and descriptions
 * are 1–500 chars.
 */
export const experience: ExperienceEntry[] = [
  {
    id: 'web-development-projects',
    title: 'Web Development Project Experience',
    subtitle: 'Personal Projects',
    description:
      'Mengembangkan beberapa project berbasis web seperti e-commerce website, split bill application, dan dashboard web application. Berfokus pada pembuatan tampilan responsive, pengelolaan data, implementasi fitur utama, serta deployment aplikasi agar dapat diakses secara online.',
    highlights: [
      'Membangun UI website menggunakan React, TypeScript, Tailwind CSS, dan Bootstrap.',
      'Mengembangkan fitur dashboard untuk menampilkan data dan membantu proses monitoring.',
      'Membuat aplikasi SplitBillin untuk mencatat patungan, mengelola grup, dan menghitung saldo anggota.',
      'Menggunakan Supabase dan MySQL untuk penyimpanan data pada beberapa project.',
      'Melakukan deployment project ke Vercel.',
    ],
    sortKey: 3,
  },
  {
    id: 'frontend-ui-implementation',
    title: 'Front-End & UI Implementation',
    subtitle: 'Portfolio and Web Projects',
    description:
      'Mengerjakan implementasi tampilan website berdasarkan kebutuhan project dengan memperhatikan struktur halaman, konsistensi desain, responsive layout, dan user experience. Terbiasa membuat komponen UI yang rapi dan mudah dikembangkan kembali.',
    highlights: [
      'Membuat layout responsive untuk desktop dan mobile.',
      'Mengatur struktur component agar kode lebih mudah dibaca.',
      'Menghubungkan halaman dengan data project.',
      'Memperbaiki tampilan, spacing, warna, dan state pada UI.',
    ],
    sortKey: 2,
  },
  {
    id: 'it-student-journey',
    title: 'IT Student Learning Journey',
    subtitle: 'Telkom University',
    description:
      'Sebagai mahasiswa Teknologi Informasi, saya mempelajari dasar-dasar pemrograman, database, pengembangan aplikasi, jaringan komputer, dan manajemen proyek IT. Pengetahuan tersebut saya terapkan melalui tugas kuliah, project pribadi, dan pengembangan portfolio.',
    highlights: [
      'Mempelajari pemrograman web, database, dan software development.',
      'Terbiasa menggunakan GitHub untuk menyimpan dan mengelola project.',
      'Memahami dasar troubleshooting aplikasi dan environment development.',
      'Aktif mengembangkan project untuk memperkuat portfolio.',
    ],
    sortKey: 1,
  },
];

/**
 * Social, document, and contact links plus location (Req 7.1, 8.1).
 * Values that point to a real destination open externally; `cv` is null until
 * a CV file is configured, which renders the Download CV control as
 * unavailable (Req 2.7).
 */
export const links = {
  github: 'https://github.com/naemuenggar',
  linkedin: 'https://www.linkedin.com/in/naemu-enggar-mahacaya',
  cv: null as string | null,
  email: 'naemuenggar@gmail.com',
  location: 'Indonesia',
} as const;

/** Contact section details derived from `links` (Req 7.1). */
export const contactDetails: ContactDetails = {
  email: links.email,
  githubUrl: links.github,
  linkedinUrl: links.linkedin,
  location: links.location,
};

/**
 * Navigation entries in the fixed left-to-right order
 * Home, About, Skills, Projects, Experience, Contact (Req 1.1).
 */
export const navLinks: NavLink[] = [
  { label: 'Home', anchorId: 'home' },
  { label: 'About', anchorId: 'about' },
  { label: 'Skills', anchorId: 'skills' },
  { label: 'Projects', anchorId: 'projects' },
  { label: 'Experience', anchorId: 'experience' },
  { label: 'Contact', anchorId: 'contact' },
];
