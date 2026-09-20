// content/site.ts  (replaces personalInfo.ts)
// Identity, links, navigation and hero copy. Plain typed data; Zod schemas arrive in Phase 2.
// Rules: never put the phone number in this file. An unknown fact is a TODO(content) comment, never a placeholder value.

export interface NavItem {
  label: string;
  href: string;
}

export interface Education {
  degree: string;
  school: string;
  city: string;
  start: string; // YYYY
  end: string; // YYYY
  cgpa: string;
}

export interface Site {
  name: string;
  role: string;
  eyebrow: string;
  headline: string;
  intro: string;
  about: string[];
  avatar?: string;
  location: {
    city: string;
    region: string;
    country: string;
    timezone: string;
    utcOffset: string;
  };
  contact: { email: string };
  links: { github: string; linkedin: string; resume?: string };
  availability: { open: boolean; label: string };
  nav: NavItem[];
  menu: NavItem[];
  nowPlaying: string[];
  education: Education[];
}

export const site: Site = {
  name: "Maanav Shah",
  role: "Full-stack engineer",
  eyebrow: "Full-stack engineer · AI-integrated products",
  headline: "I build products that ship, and systems that hold up.",
  intro:
    "Recent CS graduate from Vadodara. I work across Django, FastAPI and Next.js, from background jobs to the UI, and I've published research on neuroevolution.",

  about: [
    "I finished my B.Tech in Computer Science at Parul University in 2026. I like owning a feature from the API and background jobs to the UI and the Docker setup. Most of my work sits where a normal web app meets AI: document pipelines, LLM chat, and evolutionary algorithms.",
    "Most recently I co-built a Quality Management System MVP for automated robotic platforms at NexGen Pharma Solutions. It is in pilot.",
  ],

  // Optional. Copy Icon.jpeg from the old site's public/assets if you want an avatar.
  avatar: "/assets/Icon.jpeg",

  location: {
    city: "Vadodara",
    region: "Gujarat",
    country: "India",
    timezone: "Asia/Kolkata",
    utcOffset: "UTC+5:30",
  },

  // Confirmed public contact email (matches the resume and the old site).
  contact: { email: "maanavshah09@gmail.com" },

  links: {
    github: "https://github.com/Rabbitshah",
    linkedin: "https://www.linkedin.com/in/maanav-shah-64217424a/",
    // TODO(content): replace with "/resume.pdf" once the PDF is in public/. Google Drive link is temporary.
    resume:
      "https://drive.google.com/file/d/1WBRX-gUL7_86II5OMMSKCiXdxVHlkQS-/view?usp=sharing",
  },

  // TODO(content): confirm the wording, and whether you are open to relocation or only remote.
  availability: { open: true, label: "Open to remote roles" },

  // Bar navigation (inline at 760px and up).
  nav: [
    { label: "About", href: "/#about" },
    { label: "Work", href: "/#work" },
    { label: "Research", href: "/#research" },
    { label: "Log", href: "/#log" },
    { label: "Contact", href: "/#contact" },
  ],

  // Full-screen mobile menu (below 760px). Numbered in the UI.
  menu: [
    { label: "About", href: "/#about" },
    { label: "Work", href: "/#work" },
    { label: "Research", href: "/#research" },
    { label: "Experience", href: "/#experience" },
    { label: "Log", href: "/#log" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/#contact" },
  ],

  // Rotating facts in the bar (desktop, 1320px and up). Keep every line true.
  // TODO(content): confirm "latest project"; PraverseAI may be more recent than the Sustainability Tracker.
  nowPlaying: [
    "latest project: sustainability tracker",
    "published: ieee icscds-2025",
    "stack: django · fastapi · next.js",
    "timezone: ist, utc+5:30",
    "latest paper: ijcrt, dec 2025",
  ],

  education: [
    {
      degree: "B.Tech, Computer Science & Engineering",
      school: "Parul University",
      city: "Vadodara",
      start: "2022",
      end: "2026",
      cgpa: "7.62 / 10",
    },
  ],
};
