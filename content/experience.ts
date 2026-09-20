// content/experience.ts
// Bullets come from your resume. Figures are self-reported: keep them only if you can explain each one in an interview.
// Dates are ISO (YYYY-MM). end: null means "present".

export interface Experience {
  id: string;
  role: string;
  org: string;
  orgShort?: string; // shorter name for tight spots, e.g. the About card
  team?: string;
  location: string;
  type: "internship" | "role" | "leadership";
  start: string;
  end: string | null;
  summary?: string; // one line, used when there are no bullets yet
  bullets: string[];
}

export const experience: Experience[] = [
  {
    id: "praverse-sde",
    role: "Software Development Engineer",
    org: "Praverse Tech Private Limited",
    orgShort: "Praverse Tech",
    location: "Vadodara, India",
    type: "role",
    start: "2026-07",
    end: null,
    summary:
      "Software Development Engineer at Praverse Tech, working on backend, integrations, testing and deployment across products.",
    // TODO(content): confirm wording with employer
    bullets: [
      "Build and maintain the backend for the company's products.",
      "Handle the integrations that connect each product's parts and services.",
      "Test releases and handle deployment.",
      "Plan each project by breaking it into tasks and to-dos.",
    ],
  },
  {
    id: "nexgen-sde-intern",
    role: "Software Development Intern",
    org: "NexGen Pharma Solutions",
    team: "Robotics & Intelligent Systems",
    location: "Vadodara, India",
    type: "internship",
    start: "2026-01",
    // TODO(content): one resume says "Present", the other says Jul 2026. Confirm the real end date.
    end: "2026-07",
    bullets: [
      "Co-developed a Quality Management System (QMS) MVP that integrates with automated robotic platforms used in pharmaceutical workflows. Designed to cut process completion time by 25%; currently in pilot.",
      "Built modular software components for complex business logic, improving reliability and cross-platform integration.",
      "Tested and debugged the platform, and wrote technical documentation covering deployment steps and integration logic.",
    ],
  },
  {
    id: "nexgen-web-intern",
    role: "Web Developer Intern",
    org: "NexGen Pharma Solutions",
    location: "Vadodara, India",
    type: "internship",
    start: "2025-05",
    end: "2025-07",
    bullets: [
      // TODO(content): the old site said "ReactJS and Tailwind CSS"; your resume and projects file say Next.js + TypeScript. Confirm.
      "Built the corporate website in Next.js, TypeScript and Tailwind CSS, working across mobile, tablet and desktop.",
      "Integrated the Web3Forms API with a modular component structure and cut lead response time by 40%.",
      "Prototyped UI workflows in Figma and turned them into production components.",
    ],
  },
  {
    id: "puaiso-fullstack",
    role: "Full-Stack Developer",
    org: "PUAISO (Parul University AI Society)",
    location: "Vadodara, India",
    type: "role",
    start: "2024-07",
    end: "2024-11",
    bullets: [
      "Shipped web platforms in an 8+ person Agile team of developers, designers and QA.",
      "Cut load times by 30% through code reviews and refactoring.",
      "Ran the technical setup for 5+ university events (500+ participants) at 99% uptime.",
    ],
  },
  {
    id: "cdc-core-coordinator",
    role: "Core Coordinator",
    org: "Career Development Cell (CDC), Parul University",
    location: "Vadodara, India",
    type: "leadership",
    start: "2022-09",
    end: "2024-12",
    bullets: [
      // TODO(content): the old site said "over 2500 participants" for registration; the resume says 2,500+ students across 15+ events. Same claim, confirm wording.
      "Planned and ran 15+ large events for 2,500+ students, coordinating faculty, students and external speakers.",
    ],
  },
];
