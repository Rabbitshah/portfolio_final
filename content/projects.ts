// content/projects.ts
// Changes from the old file:
//  - No React/icon imports. Content is plain data so it stays server-friendly.
//  - Gradients and icons are gone. Cards use the mock "visual" screens from the template, or a real screenshot.
//  - Links exist only when real. No "#" placeholders.
//  - Added from your resume: Sustainability Tracker, Study Tracker, MindCraft, ProFolio.
//  - `short` is the "Quick read" text, `deep` is the "Deep dive" text.
// Sort by `order`, show only `visible: true`.

export type ProjectVisual =
  "bars" | "rows" | "lesson" | "resume" | "chat" | "image";

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  window: string; // fake file name in the title bar
  period?: string;
  status: "shipped" | "in-progress";
  featured?: boolean;
  visible: boolean;
  order: number;
  role?: string;
  short: string;
  deep: string;
  features: string[];
  stack: string[];
  visual: ProjectVisual;
  media?: { src: string; alt: string };
  links: { live?: string; code?: string; paper?: string };
  metrics?: { label: string; value: string }[];
  metricsNote?: string;
}

export const projects: Project[] = [
  {
    slug: "sustainability-tracker",
    // TODO(content): the old site called this "EcoTracker" (Next.js, Node, PostgreSQL, AWS). Your resume says Django, DRF, Celery, Redis, React, TypeScript, Docker.
    // This file follows the resume. If both are real, they are two projects: tell me which one to keep.
    title: "Sustainability Tracker",
    subtitle: "Carbon footprint platform",
    window: "sustainability-tracker.app",
    period: "2025–26",
    status: "shipped",
    featured: true,
    visible: true,
    order: 1,
    short:
      "Full-stack carbon tracker. Turns logged activity, CSV uploads and PDF utility invoices into CO₂e data with background workers, then shows it on a dashboard.",
    deep: "Companies log activity across Transport, Energy, Food and Waste, and a custom engine converts it to CO₂e. Celery workers ingest CSV uploads (pandas) and pull structured data out of PDF utility invoices (pdfplumber + regex). The dashboard has Recharts visuals, eco-score, streak badges, and a rule-based advice engine for month-over-month reduction tips. The whole stack runs in Docker Compose.",
    features: [
      "Custom CO₂e calculation engine across Transport, Energy, Food and Waste",
      "Async ingestion: CSV bulk uploads (pandas) and PDF invoice parsing (pdfplumber + regex) on Celery workers",
      "Dashboard with Recharts, eco-score, streak badges and a rule-based advice engine",
      "Django API, Celery worker and Redis broker in Docker Compose with a shared media volume",
    ],
    stack: [
      "Django",
      "DRF",
      "Celery",
      "Redis",
      "React",
      "TypeScript",
      "Docker",
    ],
    visual: "bars",
    links: {
      // TODO(content): add live and code URLs when they exist.
    },
  },
  {
    slug: "study-tracker",
    title: "Study Tracker",
    subtitle: "Exam-prep dashboard",
    window: "study-tracker.app",
    period: "2025–26",
    status: "shipped",
    visible: true,
    order: 3,
    short:
      "Exam-prep dashboard with a backlog system. Missed minutes roll into future targets, capped at 2× a day.",
    deep: "Exam-prep dashboard. Missed study minutes roll into future targets with a 2× daily cap. A node-cron job closes the day at 00:01 UTC if you forget. Silent JWT refresh through an Axios interceptor that queues and replays blocked 401 requests. Includes a 960-word GRE flashcard tool.",
    features: [
      "Backlog carry-over with a 2× daily cap",
      "Double-safety end-of-day: manual lock in the UI plus a node-cron job at 00:01 UTC",
      "JWT auth with 15-minute access tokens and 7-day refresh tokens, refreshed silently by an Axios interceptor",
      "GRE vocabulary flashcards: 960 words in 32 groups with keyboard navigation",
    ],
    stack: ["React", "Node.js", "Express", "PostgreSQL", "JWT", "Vite"],
    visual: "rows",
    links: {},
  },
  {
    slug: "profolio",
    title: "ProFolio",
    subtitle: "Intelligent resume & portfolio builder",
    window: "profolio.app",
    period: "Dec 2025",
    status: "shipped",
    visible: true,
    order: 4,
    role: "Co-developer",
    short:
      "Resume and portfolio builder with recruiter search and analytics. Co-developed and published in IJCRT.",
    deep: "Resume and portfolio builder for job seekers, with candidate search, bookmarking and analytics for recruiters. Role-based dashboards (user, recruiter, admin), Passport.js login (local, Google, GitHub) and Cloudinary media. A pilot with 10 users is written up in an IJCRT paper.",
    features: [
      "Customizable resume and portfolio templates with multimedia support",
      "Role-based dashboards for job seekers, recruiters and admins",
      "Passport.js login: local, Google and GitHub OAuth",
      "Cloudinary integration for cloud media storage",
    ],
    stack: [
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "Passport.js",
      "Cloudinary",
    ],
    visual: "resume",
    links: {
      paper: "https://doi.org/10.56975/ijcrt.v13i12.298354",
    },
    // TODO(content): confirm both figures against the paper. The sample is only 10 users, so keep the note.
    metrics: [
      { label: "ATS compatibility", value: "80%+" },
      { label: "Recruiter efficiency", value: "+30%" },
    ],
    metricsNote: "Pilot with 10 users",
  },
  {
    slug: "mindcraft",
    title: "MindCraft",
    subtitle: "Creative learning platform",
    window: "mindcraft.app",
    period: "2025",
    status: "shipped",
    visible: true,
    order: 5,
    short:
      "Course marketplace with learner and instructor roles, a cart with promo codes, and a lesson player.",
    deep: "Course marketplace with learner and instructor roles, a cart with promo codes, mock checkout, and enrollment records. The lesson player tracks progress and has a notepad that autosaves locally. The backend falls back to an in-memory store when MongoDB isn't connected.",
    features: [
      "Role-based auth (learner and instructor)",
      "Cart with promotional discount codes and a mock checkout that creates enrollment records",
      "Lesson player with progress tracking and a local-storage notepad",
      "Graceful degradation: controllers switch between MongoDB and an in-memory store",
    ],
    stack: ["React", "Node.js", "Express", "MongoDB", "JWT"],
    visual: "lesson",
    links: {},
  },
  {
    slug: "ai-mental-health-chatbot",
    title: "AI Mental Health Chatbot",
    subtitle: "Scalable AI assistance",
    window: "mental-health-chatbot.app",
    period: "Aug 2025",
    status: "shipped",
    visible: true,
    order: 6,
    short:
      "Mental health check-in chatbot on FastAPI and the OpenAI API, with Redis caching to cut LLM costs.",
    deep: "Check-in chatbot with context-aware replies. FastAPI backend on the OpenAI API, with Redis storing conversation history to cut LLM costs. Prompt logic keeps replies supportive. Fully containerised.",
    features: [
      "Context-aware replies through a FastAPI backend",
      "Redis stores conversation history to reduce LLM inference cost",
      "Prompt logic tuned to stay supportive and appropriate",
      "Docker containerisation",
    ],
    stack: ["React", "FastAPI", "Redis", "Docker", "OpenAI API"],
    visual: "chat",
    // The old file used a placeholder image ("underdev.png"). Real screenshots are better than a mock.
    links: {},
  },
  {
    slug: "nexgen-pharma-website",
    title: "NexGen Pharma Website",
    subtitle: "Corporate web platform",
    window: "nexgenpharmasolutions.com",
    period: "May–Jul 2025",
    status: "shipped",
    visible: true,
    order: 7,
    short:
      "Corporate website built from Figma prototypes, with serverless form handling that cut lead response time by 40%.",
    deep: "Corporate website built in Next.js, TypeScript and Tailwind CSS from Figma prototypes. Forms use the Web3Forms API with a modular component structure, which cut lead response time by 40%. Works across mobile, tablet and desktop.",
    features: [
      "Figma-to-code workflow",
      "Next.js performance work",
      "Serverless form handling (Web3Forms)",
      "Cross-device responsive design",
    ],
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Figma", "Web3Forms"],
    visual: "image",
    media: {
      src: "/assets/nexgen.png",
      alt: "NexGen Pharma Solutions website",
    },
    links: { live: "https://www.nexgenpharmasolutions.com/" },
  },
  {
    slug: "wanderlust",
    title: "Wanderlust",
    subtitle: "Accommodation booking platform",
    window: "wanderlust.app",
    period: "Oct 2024",
    status: "shipped",
    visible: true,
    order: 8,
    short:
      "Booking platform with 15+ reusable React components and a Node backend handling search, filtering and booking over PostgreSQL.",
    deep: "Full-featured booking platform. 15+ reusable React components and a Node.js backend that handles search, filtering and booking flows across relational PostgreSQL data.",
    features: [
      "15+ reusable React components",
      "Node.js backend for search, filtering and booking",
      "Relational PostgreSQL data with non-trivial queries",
    ],
    // TODO(content): the old file listed Kubernetes. Your resume does not. Add it back to `stack` only if you actually used it.
    stack: ["React", "Node.js", "PostgreSQL"],
    visual: "image",
    media: {
      src: "/assets/wanderlust.png",
      alt: "Wanderlust booking platform",
    },
    links: { live: "https://major-project-j4mj.onrender.com/" },
  },
  {
    slug: "puaiso-website",
    title: "AI Society Official Website",
    subtitle: "PUAISO platform",
    window: "puaiso.app",
    period: "Aug 2024",
    status: "shipped",
    visible: true,
    order: 9,
    short:
      "Full-stack site for the Parul University AI Society, serving 1,000+ users, built by an 8+ person team with Git-based CI/CD.",
    deep: "Full-stack website serving 1,000+ users: React frontend, Node.js/Express backend and MongoDB on AWS, with dynamic routing, reusable UI components and Git-based CI/CD across an 8+ person team.",
    features: [
      "Dynamic routing and reusable UI components",
      "MongoDB integration",
      "AWS deployment with Git-based CI/CD",
      "Serving 1,000+ users",
    ],
    stack: ["React", "Node.js", "Express", "MongoDB", "AWS"],
    visual: "image",
    media: { src: "/assets/puaiso.png", alt: "PUAISO official website" },
    links: {},
  },

  // ---- Hidden by default. They are off-target for full-stack / AI roles and both were unfinished or course work. ----
  {
    slug: "2d-platformer",
    title: "2D Platformer Game",
    subtitle: "Classic platformer",
    window: "platformer.exe",
    status: "in-progress",
    visible: false, // Unfinished, and the old file used a placeholder image. Show it only when it is playable.
    order: 10,
    short:
      "Classic 2D platformer in C# and Unity with custom physics, level design and character animation.",
    deep: "Classic 2D platformer built with C# and Unity, featuring custom physics, level design and character animations. Under development.",
    features: [],
    stack: ["C#", "Unity"],
    visual: "image",
    links: {},
  },
  {
    slug: "2d-shooter",
    title: "2D Shooter Game",
    subtitle: "Unity action game",
    window: "shooter.exe",
    status: "shipped",
    visible: false,
    order: 11,
    // TODO(content): your resume lists the Coursera course "Game Design and Development 1: 2D Shooter". If this game came from that course, label it "Course project" honestly.
    short:
      "2D shooter in C# and Unity with custom gameplay mechanics, enemy AI and modular game states.",
    deep: "Developed with C# and Unity: custom gameplay mechanics, dynamic enemy AI and modular game states.",
    features: [],
    stack: ["Unity", "C#", "WebGL", "Game Design"],
    visual: "image",
    media: { src: "/assets/shooter.png", alt: "2D shooter game screenshot" },
    links: {},
  },
];

export const visibleProjects = projects
  .filter((p) => p.visible)
  .sort((a, b) => a.order - b.order);
