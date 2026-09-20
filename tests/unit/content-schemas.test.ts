import { certifications } from "@content/certifications";
import { experience } from "@content/experience";
import { faq } from "@content/faq";
import { derivedHighlightLabels, otherHighlights } from "@content/highlights";
import { log } from "@content/log";
import { note } from "@content/notes";
import { papers } from "@content/papers";
import { projects } from "@content/projects";
import { site } from "@content/site";
import { marquee, skillGroups } from "@content/skills";
import { describe, expect, it } from "vitest";
import {
  certificationsSchema,
  derivedHighlightLabelsSchema,
  experienceSchema,
  faqSchema,
  logSchema,
  marqueeSchema,
  noteSchema,
  otherHighlightsSchema,
  papersSchema,
  parseContent,
  projectsSchema,
  siteSchema,
  skillGroupsSchema,
  validateRelations,
} from "@/lib/content/schemas";

// A deep copy of real content that a test can break in one place.
const copy = <T>(value: T): T => structuredClone(value);

function message(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    return (error as Error).message;
  }
  return "";
}

const parseProjects = (data: unknown) =>
  parseContent("projects", "projects", projectsSchema, data);
const parseExperience = (data: unknown) =>
  parseContent("experience", "experience", experienceSchema, data);
const parseSite = (data: unknown) =>
  parseContent("site", "site", siteSchema, data);

describe("the real content passes every schema", () => {
  it("validates each file unchanged", () => {
    expect(parseSite(site)).toBeTruthy();
    expect(parseProjects(projects)).toHaveLength(projects.length);
    expect(parseExperience(experience)).toHaveLength(experience.length);
    parseContent("skills", "skillGroups", skillGroupsSchema, skillGroups);
    parseContent("skills", "marquee", marqueeSchema, marquee);
    parseContent(
      "certifications",
      "certifications",
      certificationsSchema,
      certifications,
    );
    parseContent("papers", "papers", papersSchema, papers);
    parseContent("faq", "faq", faqSchema, faq);
    parseContent("log", "log", logSchema, log);
    parseContent(
      "highlights",
      "derivedHighlightLabels",
      derivedHighlightLabelsSchema,
      derivedHighlightLabels,
    );
    parseContent(
      "highlights",
      "otherHighlights",
      otherHighlightsSchema,
      otherHighlights,
    );
    parseContent("notes", "note", noteSchema, note);
    validateRelations({ projects, papers });
  });

  it("has 8 visible projects, all with a visual", () => {
    const visible = projects.filter((project) => project.visible);
    expect(visible).toHaveLength(8);
    for (const project of visible) expect(project.visual).toBeTruthy();
  });
});

describe("projects", () => {
  it("rejects a duplicate slug and names the file and field", () => {
    const bad = copy(projects);
    bad[1]!.slug = bad[0]!.slug;
    const text = message(() => parseProjects(bad));
    expect(text).toContain("content/projects.ts");
    expect(text).toContain("projects[1].slug");
    expect(text).toContain("Duplicate slug");
  });

  it("rejects a duplicate order", () => {
    const bad = copy(projects);
    bad[2]!.order = bad[0]!.order;
    expect(message(() => parseProjects(bad))).toContain("projects[2].order");
  });

  it('rejects "#" as a link', () => {
    const bad = copy(projects);
    bad[0]!.links.live = "#";
    const text = message(() => parseProjects(bad));
    expect(text).toContain("projects[0].links.live");
    expect(text).toContain("https URL");
  });

  it("rejects an http link", () => {
    const bad = copy(projects);
    bad[0]!.links.code = "http://example.com/repo";
    expect(message(() => parseProjects(bad))).toContain(
      "projects[0].links.code",
    );
  });

  it("rejects a media file that does not exist", () => {
    const index = projects.findIndex((project) => project.media);
    const bad = copy(projects);
    bad[index]!.media!.src = "/assets/does-not-exist.png";
    const text = message(() => parseProjects(bad));
    expect(text).toContain(`projects[${index}].media.src`);
    expect(text).toContain("exactly this name and case");
  });

  it("rejects a media file whose case differs, even on Windows", () => {
    const index = projects.findIndex((project) => project.media);
    const bad = copy(projects);
    const real = bad[index]!.media!.src;
    bad[index]!.media!.src = real.replace(/[a-z]/, (letter) =>
      letter.toUpperCase(),
    );
    expect(real).not.toBe(bad[index]!.media!.src);
    expect(message(() => parseProjects(bad))).toContain(
      `projects[${index}].media.src`,
    );
  });

  it('rejects a visible "image" project without media', () => {
    const index = projects.findIndex(
      (project) => project.visible && project.visual === "image",
    );
    const bad = copy(projects);
    delete bad[index]!.media;
    expect(message(() => parseProjects(bad))).toContain(
      `projects[${index}].media`,
    );
  });

  it("rejects an unknown key (a typo)", () => {
    const bad = copy(projects) as unknown as Record<string, unknown>[];
    bad[0]!.lnks = {};
    expect(message(() => parseProjects(bad))).toContain("projects");
  });
});

describe("experience", () => {
  it("rejects a date that is not ISO", () => {
    const bad = copy(experience);
    bad[0]!.start = "2026-13";
    const text = message(() => parseExperience(bad));
    expect(text).toContain("content/experience.ts");
    expect(text).toContain("experience[0].start");
    expect(text).toContain("ISO date");
  });

  it("rejects entries that are not sorted newest first", () => {
    const bad = copy(experience);
    [bad[0], bad[1]] = [bad[1]!, bad[0]!];
    const text = message(() => parseExperience(bad));
    expect(text).toContain("experience[1].start");
    expect(text).toContain("sorted newest first");
  });

  it("accepts an open end and a bare year on the oldest entry", () => {
    const ok = copy(experience);
    expect(ok[0]!.end).toBeNull(); // the current role
    ok[ok.length - 1]!.start = "2022";
    expect(() => parseExperience(ok)).not.toThrow();
  });
});

describe("papers, log, notes and site", () => {
  it("rejects a related project that does not exist", () => {
    const bad = copy(papers);
    bad[1]!.relatedProject = "no-such-project";
    const text = message(() => validateRelations({ projects, papers: bad }));
    expect(text).toContain("content/papers.ts");
    expect(text).toContain("papers[1].relatedProject");
  });

  it("rejects a paper URL that is not https", () => {
    const bad = copy(papers);
    bad[1]!.url = "http://doi.org/10.1234/x";
    expect(
      message(() => parseContent("papers", "papers", papersSchema, bad)),
    ).toContain("papers[1].url");
  });

  it("rejects a log date that is not ISO", () => {
    const bad = copy(log);
    bad[0]!.date = "Sep 2026";
    expect(message(() => parseContent("log", "log", logSchema, bad))).toContain(
      "log[0].date",
    );
  });

  it("rejects an unknown token in the note", () => {
    const bad = copy(note);
    bad.paragraphs[0] = "{nope} things";
    const text = message(() => parseContent("notes", "note", noteSchema, bad));
    expect(text).toContain("note.paragraphs[0]");
    expect(text).toContain("{nope}");
  });

  it('allows "/#about" in navigation but not "#about"', () => {
    const ok = copy(site);
    expect(() => parseSite(ok)).not.toThrow();
    const bad = copy(site);
    bad.nav[0]!.href = "#about";
    expect(message(() => parseSite(bad))).toContain("site.nav[0].href");
  });

  it("accepts a résumé that is an https URL or an existing public file, and rejects the rest", () => {
    const https = copy(site);
    https.links.resume = "https://example.com/resume.pdf";
    expect(() => parseSite(https)).not.toThrow();

    const local = copy(site);
    local.links.resume = "/assets/Icon.jpeg"; // stands in for /resume.pdf until that file exists
    expect(() => parseSite(local)).not.toThrow();

    const missing = copy(site);
    missing.links.resume = "/resume.pdf";
    expect(message(() => parseSite(missing))).toContain("site.links.resume");

    const hash = copy(site);
    hash.links.resume = "#";
    expect(message(() => parseSite(hash))).toContain("site.links.resume");
  });
});
