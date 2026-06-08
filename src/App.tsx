import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Skills } from './components/Skills';
import { Projects } from './components/Projects';
import { Experience } from './components/Experience';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

import {
  profile,
  about,
  skillCategories,
  projects,
  experience,
  links,
  contactDetails,
  navLinks,
} from './data/content';

/**
 * Application shell.
 *
 * Composes the full single-page portfolio: the fixed {@link Navbar} plus every
 * content section rendered in document order — Hero (`#home`), About
 * (`#about`), Skills (`#skills`), Projects (`#projects`), Experience
 * (`#experience`), Contact (`#contact`) — followed by the Footer. Each section
 * carries its own anchor id (defined within the section components) so the
 * Navbar links and the Hero "View Projects" button can scroll to them (Req 1.2,
 * 1.3, 2.5).
 *
 * All content is wired from the central data module (`src/data/content.ts`) so
 * the UI stays data-driven and the single source of truth for pinned text,
 * skills, projects, experience, and links lives in one place (Req 2.1, 3.1,
 * 4.1, 5.1, 6.1, 7.1, 8.1).
 *
 * The Navbar is fixed (`fixed top-0`), so it overlays the top of the document.
 * A global `scroll-margin-top` on the section anchors (see `index.css`) offsets
 * anchor-scroll targets by the navbar height so a section's heading is not
 * hidden beneath the bar; the Hero additionally reserves top padding so its
 * content clears the navbar on initial load.
 */
function App(): JSX.Element {
  return (
    <div className="min-h-screen overflow-x-hidden bg-base text-ink">
      <a href="#home" className="sr-only">
        Skip to content
      </a>

      {/* Fixed navigation bar, visible across all scroll positions (Req 1.3). */}
      <Navbar links={navLinks} />

      {/* Sections in document order, each with its own anchor id. */}
      <main>
        <Hero
          name={profile.name}
          role={profile.role}
          summary={profile.summary}
          cvUrl={links.cv}
          githubUrl={links.github}
          linkedinUrl={links.linkedin}
        />

        <About paragraphs={[...about.paragraphs]} />

        <Skills categories={skillCategories} />

        <Projects projects={projects} />

        <Experience entries={experience} />

        <Contact details={contactDetails} />
      </main>

      <Footer
        name={profile.name}
        githubUrl={links.github}
        linkedinUrl={links.linkedin}
      />
    </div>
  );
}

export default App;
