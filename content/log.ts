// content/log.ts
// TODO(content): drafted; review every claim. Copied from reference/portfolio-template.html.
// `date` is YYYY-MM, or YYYY when the month is not known. Newest first.

export interface LogEntry {
  date: string;
  text: string;
}

export const log: LogEntry[] = [
  {
    date: "2026-09",
    text: "Rebuilt this site: faster, server-friendly, and easier to update.",
  },
  {
    date: "2026-05",
    text: "Graduated: B.Tech in Computer Science and Engineering, Parul University.",
  },
  {
    date: "2026-01",
    text: "Started work on the QMS MVP at NexGen Pharma Solutions.",
  },
  {
    date: "2025-12",
    text: "ProFolio paper published in IJCRT (Vol. 13, Issue 12).",
  },
  {
    date: "2025-08",
    text: "Shipped the AI mental health chatbot (FastAPI, Redis, OpenAI API).",
  },
  {
    date: "2025",
    text: "NEAT autonomous-car paper presented at IEEE ICSCDS-2025.",
  },
];
