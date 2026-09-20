// The only module that reads content/*.ts. Everything is validated with Zod when this module
// loads, so bad content fails `next build`, `next dev` and the unit tests with a message
// that names the file and the field. Import content from here, never from @content/*.
import { certifications as rawCertifications } from "@content/certifications";
import { experience as rawExperience } from "@content/experience";
import { faq as rawFaq } from "@content/faq";
import {
  derivedHighlightLabels as rawDerivedHighlightLabels,
  otherHighlights as rawOtherHighlights,
} from "@content/highlights";
import { log as rawLog } from "@content/log";
import { note as rawNote } from "@content/notes";
import { papers as rawPapers } from "@content/papers";
import { projects as rawProjects } from "@content/projects";
import { site as rawSite } from "@content/site";
import {
  marquee as rawMarquee,
  skillGroups as rawSkillGroups,
} from "@content/skills";
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
} from "./schemas";

export type { Certification } from "@content/certifications";
export type { Experience } from "@content/experience";
export type { FaqItem } from "@content/faq";
export type { Highlight } from "@content/highlights";
export type { LogEntry } from "@content/log";
export type { Note } from "@content/notes";
export type { Paper } from "@content/papers";
export type { Project } from "@content/projects";
export type { Site } from "@content/site";
export type { SkillGroup } from "@content/skills";

export const site = parseContent("site", "site", siteSchema, rawSite);
export const projects = parseContent(
  "projects",
  "projects",
  projectsSchema,
  rawProjects,
);
export const experience = parseContent(
  "experience",
  "experience",
  experienceSchema,
  rawExperience,
);
export const skillGroups = parseContent(
  "skills",
  "skillGroups",
  skillGroupsSchema,
  rawSkillGroups,
);
export const marquee = parseContent(
  "skills",
  "marquee",
  marqueeSchema,
  rawMarquee,
);
export const certifications = parseContent(
  "certifications",
  "certifications",
  certificationsSchema,
  rawCertifications,
);
export const papers = parseContent("papers", "papers", papersSchema, rawPapers);
export const faq = parseContent("faq", "faq", faqSchema, rawFaq);
export const log = parseContent("log", "log", logSchema, rawLog);
export const derivedHighlightLabels = parseContent(
  "highlights",
  "derivedHighlightLabels",
  derivedHighlightLabelsSchema,
  rawDerivedHighlightLabels,
);
export const otherHighlights = parseContent(
  "highlights",
  "otherHighlights",
  otherHighlightsSchema,
  rawOtherHighlights,
);
export const note = parseContent("notes", "note", noteSchema, rawNote);

validateRelations({ projects, papers });

export const visibleProjects = projects
  .filter((project) => project.visible)
  .sort((a, b) => a.order - b.order);
