// content/highlights.ts  (the "receipts" strip)
// TODO(content): drafted; review every claim. Copied from reference/portfolio-template.html.
// The first three numbers (papers, roles, projects) are derived from the other content
// files in src/lib/stats.ts. Only their labels live here. Never hard-code those counts.

export interface Highlight {
  value: string;
  label: string;
}

export const derivedHighlightLabels = {
  papers: "papers, IEEE and IJCRT",
  roles: "roles and internships",
  projects: "projects",
};

export const otherHighlights: Highlight[] = [
  { value: "1,000+", label: "users on the AI Society site" },
  { value: "99%", label: "uptime across 5+ events" },
  { value: "−30%", label: "load time after refactors" },
  { value: "2,500+", label: "students reached, 15+ events" },
  { value: "−40%", label: "lead response time, NexGen site" },
];
