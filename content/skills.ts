// content/skills.ts
// Changes from the old file:
//  - Removed the 0-100 "level" numbers. Self-rated bars are unverifiable and recruiters read them as noise.
//    The projects and papers are the proof. Keep names only.
//  - Removed React icon imports (content stays plain data).
//  - Added items your resume and projects use but the old file lacked: Django REST Framework, Celery,
//    Docker Compose, CI/CD, OpenAI API, LLM integration, RAG, Qdrant, Firestore, Genkit AI, MDX, Passport.js,
//    JWT, pandas, Pygame, NEAT, Vercel, Render.
//  - "Web3Forms" is a service you used, not a skill. It lives in the NexGen project instead.
// TODO(content): only keep an item if you can answer a basic interview question about it.

export interface SkillGroup {
  category: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    items: [
      "Python",
      "TypeScript",
      "JavaScript",
      "Java",
      "C++",
      "C#",
      "SQL",
      "HTML/CSS",
    ],
  },
  {
    category: "Frontend",
    items: ["React", "Next.js", "Tailwind CSS", "MDX", "Figma"],
  },
  {
    category: "Backend & APIs",
    items: [
      "Node.js",
      "Express",
      "FastAPI",
      "Django REST Framework",
      "RESTful APIs",
      "Celery",
      "JWT",
      "Passport.js (OAuth)",
    ],
  },
  {
    category: "Databases",
    items: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "SQLite",
      "Firestore",
      "Qdrant",
    ],
  },
  {
    category: "AI / ML",
    items: [
      "LLM integration",
      "OpenAI API",
      "RAG pipelines",
      "Genkit AI",
      "NEAT / neuroevolution",
      "pandas",
    ],
  },
  {
    category: "DevOps & Cloud",
    // TODO(content): Kubernetes appeared in the old Wanderlust entry only. Add it here if it is real.
    items: [
      "Docker",
      "Docker Compose",
      "Git",
      "CI/CD",
      "AWS",
      "Vercel",
      "Render",
    ],
  },
  {
    category: "Testing & Automation",
    items: ["Software testing", "Automation frameworks", "Quality assurance"],
  },
  {
    category: "Game development",
    items: ["Unity", "C#", "WebGL", "Pygame", "Game design"],
  },
];

// Scrolling ticker under the hero. Keep it short and honest.
export const marquee: string[] = [
  "Python",
  "TypeScript",
  "Django REST",
  "FastAPI",
  "React",
  "Next.js",
  "PostgreSQL",
  "Celery",
  "Redis",
  "Docker",
];
