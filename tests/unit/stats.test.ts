import { experience, note, papers, visibleProjects } from "@/lib/content";
import { describe, expect, it } from "vitest";
import { deriveStats, fillStats } from "@/lib/stats";

const stats = deriveStats({ experience, projects: visibleProjects, papers });

describe("deriveStats", () => {
  it("counts roles without leadership, visible projects and papers", () => {
    expect(stats.roles).toBe(
      experience.filter((entry) => entry.type !== "leadership").length,
    );
    expect(stats.projects).toBe(visibleProjects.length);
    expect(stats.papers).toBe(papers.length);
  });

  it("does not count leadership or hidden projects", () => {
    const counted = deriveStats({
      experience: [
        { ...experience[0]!, type: "internship" },
        { ...experience[0]!, type: "leadership" },
      ],
      projects: [],
      papers: [],
    });
    expect(counted).toEqual({ roles: 1, projects: 0, papers: 0 });
  });
});

describe("fillStats", () => {
  it("fills every token in the note", () => {
    const filled = note.paragraphs.map((text) => fillStats(text, stats));
    expect(filled.join(" ")).not.toMatch(/[{}]/);
    expect(filled.join(" ")).toContain(
      `${stats.roles} roles, ${stats.projects} projects and ${stats.papers} papers`,
    );
  });

  it("rejects an unknown token", () => {
    expect(() => fillStats("{nope}", stats)).toThrow(/nope/);
  });
});
