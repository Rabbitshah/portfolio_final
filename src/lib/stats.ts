import type { Experience } from "@content/experience";
import type { Paper } from "@content/papers";
import type { Project } from "@content/projects";

export interface Stats {
  roles: number;
  projects: number;
  papers: number;
}

// Counts come from the content files. Never hard-code them.
export function deriveStats(input: {
  experience: Experience[];
  projects: Project[];
  papers: Paper[];
}): Stats {
  return {
    roles: input.experience.filter((entry) => entry.type !== "leadership")
      .length,
    projects: input.projects.length,
    papers: input.papers.length,
  };
}

/** Replaces {roles}, {projects} and {papers}. Any other {token} is an error. */
export function fillStats(text: string, stats: Stats): string {
  return text.replace(/\{(\w+)\}/g, (_match, name: string) => {
    if (name !== "roles" && name !== "projects" && name !== "papers") {
      throw new Error(`Unknown stat token {${name}}`);
    }
    return String(stats[name]);
  });
}
