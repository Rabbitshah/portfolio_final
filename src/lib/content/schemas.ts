import type { Certification } from "@content/certifications";
import type { ContactCopy } from "@content/contact";
import type { Experience } from "@content/experience";
import type { FaqItem } from "@content/faq";
import type { Highlight } from "@content/highlights";
import type { LogEntry } from "@content/log";
import type { Note } from "@content/notes";
import type { Paper } from "@content/papers";
import type { Project } from "@content/projects";
import type { Site } from "@content/site";
import type { SkillGroup } from "@content/skills";
import { z } from "zod";
import { existsWithExactCase } from "./public-files";

// ---------- building blocks ----------

const text = z.string().min(1, "Must not be empty");
const year = z.string().regex(/^\d{4}$/, "Must be a year like 2026");

const isoDate = z
  .string()
  .regex(
    /^\d{4}(-(0[1-9]|1[0-2]))?$/,
    "Must be an ISO date: YYYY or YYYY-MM (month 01 to 12)",
  );

function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const httpsUrl = z.string().refine(isHttps, {
  error: (issue) =>
    `Must be an https URL (got ${JSON.stringify(issue.input)}; "#" and relative links are not allowed)`,
});

const publicPath = z
  .string()
  .regex(
    /^\/[^\s#?]+\.[A-Za-z0-9]+$/,
    "Must be a path into public/, like /assets/name.png",
  )
  .refine(existsWithExactCase, {
    error: (issue) =>
      `No file in public/ with exactly this name and case: ${JSON.stringify(issue.input)}`,
  });

// Internal hrefs such as "/#about" are allowed in navigation; so are https URLs.
const navHref = z
  .string()
  .refine((value) => /^\/(#[a-z0-9-]+)?$/.test(value) || isHttps(value), {
    error: (issue) =>
      `Must be an internal href like "/#about" or an https URL (got ${JSON.stringify(issue.input)})`,
  });

type Issues = { addIssue: (issue: z.core.$ZodRawIssue) => void };

function reportDuplicates<T>(
  list: T[],
  ctx: Issues,
  field: string,
  pick: (item: T) => string | number,
): void {
  const seen = new Map<string | number, number>();
  list.forEach((item, index) => {
    const value = pick(item);
    const first = seen.get(value);
    if (first !== undefined) {
      ctx.addIssue({
        code: "custom",
        input: value,
        path: [index, field],
        message: `Duplicate ${field} ${JSON.stringify(value)} (already used at [${first}])`,
      });
    } else {
      seen.set(value, index);
    }
  });
}

// ---------- per-file schemas ----------

const location = z.strictObject({
  city: text,
  region: text,
  country: text,
  timezone: text,
  timezoneLabel: text,
  utcOffset: text,
});

export const siteSchema: z.ZodType<Site> = z.strictObject({
  name: text,
  role: text,
  eyebrow: text,
  headline: text,
  intro: text,
  about: z.array(text).min(1),
  avatar: publicPath.optional(),
  location,
  contact: z.strictObject({ email: z.email() }),
  links: z.strictObject({
    github: httpsUrl,
    linkedin: httpsUrl,
    // Today an https URL; later "/resume.pdf" once the file is in public/.
    resume: z.union([httpsUrl, publicPath]).optional(),
  }),
  availability: z.strictObject({ open: z.boolean(), label: text }),
  nav: z.array(z.strictObject({ label: text, href: navHref })).min(1),
  menu: z.array(z.strictObject({ label: text, href: navHref })).min(1),
  nowPlaying: z.array(text),
  education: z.array(
    z.strictObject({
      degree: text,
      school: text,
      city: text,
      start: year,
      end: year,
      cgpa: text,
    }),
  ),
});

const projectSchema = z
  .strictObject({
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Must be lowercase kebab-case"),
    title: text,
    subtitle: text,
    window: text,
    period: text.optional(),
    status: z.enum(["shipped", "in-progress"]),
    featured: z.boolean().optional(),
    visible: z.boolean(),
    order: z.number().int().positive(),
    role: text.optional(),
    short: text,
    deep: text,
    features: z.array(text),
    stack: z.array(text).min(1),
    visual: z.enum(["bars", "rows", "lesson", "resume", "chat", "image"]),
    media: z.strictObject({ src: publicPath, alt: text }).optional(),
    links: z.strictObject({
      live: httpsUrl.optional(),
      code: httpsUrl.optional(),
      paper: httpsUrl.optional(),
    }),
    metrics: z.array(z.strictObject({ label: text, value: text })).optional(),
    metricsNote: text.optional(),
  })
  .superRefine((project, ctx) => {
    if (project.visible && project.visual === "image" && !project.media) {
      ctx.addIssue({
        code: "custom",
        input: project.visual,
        path: ["media"],
        message:
          'A visible project with visual "image" needs a media entry (src and alt)',
      });
    }
  });

export const projectsSchema: z.ZodType<Project[]> = z
  .array(projectSchema)
  .superRefine((list, ctx) => {
    reportDuplicates(list, ctx, "slug", (project) => project.slug);
    reportDuplicates(list, ctx, "order", (project) => project.order);
  });

export const experienceSchema: z.ZodType<Experience[]> = z
  .array(
    z.strictObject({
      id: text,
      role: text,
      org: text,
      orgShort: text.optional(),
      team: text.optional(),
      location: text,
      type: z.enum(["internship", "role", "leadership"]),
      start: isoDate,
      end: isoDate.nullable(),
      summary: text.optional(),
      bullets: z.array(text),
    }),
  )
  .superRefine((list, ctx) => {
    reportDuplicates(list, ctx, "id", (entry) => entry.id);
    for (let index = 1; index < list.length; index++) {
      const previous = list[index - 1];
      const current = list[index];
      if (previous && current && previous.start < current.start) {
        ctx.addIssue({
          code: "custom",
          input: current.start,
          path: [index, "start"],
          message: `Experience must be sorted newest first: ${current.start} comes after ${previous.start}`,
        });
      }
    }
  });

export const skillGroupsSchema: z.ZodType<SkillGroup[]> = z.array(
  z.strictObject({ category: text, items: z.array(text).min(1) }),
);

export const marqueeSchema: z.ZodType<string[]> = z.array(text).min(1);

export const certificationsSchema: z.ZodType<Certification[]> = z.array(
  z.strictObject({
    title: text,
    issuer: text,
    issued: isoDate.optional(),
    description: text,
  }),
);

export const papersSchema: z.ZodType<Paper[]> = z
  .array(
    z.strictObject({
      slug: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Must be lowercase kebab-case"),
      title: text,
      venue: text,
      venueShort: text,
      year: z.number().int(),
      role: text,
      summary: text,
      metrics: z.array(z.strictObject({ label: text, value: text })).optional(),
      metricsNote: text.optional(),
      doi: z
        .string()
        .regex(/^10\.\d{4,9}\/\S+$/, "Must look like 10.1234/abcd")
        .optional(),
      url: httpsUrl.optional(),
      relatedProject: text.optional(),
    }),
  )
  .superRefine((list, ctx) => {
    reportDuplicates(list, ctx, "slug", (paper) => paper.slug);
  });

export const faqSchema: z.ZodType<FaqItem[]> = z
  .array(z.strictObject({ question: text, answer: text }))
  .superRefine((list, ctx) => {
    reportDuplicates(list, ctx, "question", (item) => item.question);
  });

export const logSchema: z.ZodType<LogEntry[]> = z.array(
  z.strictObject({ date: isoDate, text }),
);

export const derivedHighlightLabelsSchema = z.strictObject({
  papers: text,
  roles: text,
  projects: text,
});

export const otherHighlightsSchema: z.ZodType<Highlight[]> = z.array(
  z.strictObject({ value: text, label: text }),
);

const statTokens = ["roles", "projects", "papers"];

export const noteSchema: z.ZodType<Note> = z.strictObject({
  title: text,
  date: text,
  label: text,
  paragraphs: z
    .array(text)
    .min(1)
    .superRefine((paragraphs, ctx) => {
      paragraphs.forEach((paragraph, index) => {
        for (const match of paragraph.matchAll(/\{(\w+)\}/g)) {
          const token = match[1] ?? "";
          if (!statTokens.includes(token)) {
            ctx.addIssue({
              code: "custom",
              input: token,
              path: [index],
              message: `Unknown token {${token}}; use {roles}, {projects} or {papers}`,
            });
          }
        }
      });
    }),
});

// ---------- contact form copy ----------

const emailToken = /\{(\w+)\}/g;

function onlyEmailToken(message: string, ctx: z.RefinementCtx): void {
  for (const match of message.matchAll(emailToken)) {
    if (match[1] !== "email") {
      ctx.addIssue({
        code: "custom",
        input: match[1],
        message: `Unknown token {${match[1]}}; only {email} is allowed`,
      });
    }
  }
}

const emailCopy = text.superRefine(onlyEmailToken);

export const contactCopySchema: z.ZodType<ContactCopy> = z.strictObject({
  labels: z.strictObject({ name: text, email: text, message: text }),
  messageHint: text.optional(),
  submit: text,
  pending: text,
  privacy: text,
  success: text,
  errorPrefix: text,
  fieldErrors: z.strictObject({
    nameRequired: text,
    nameTooLong: text,
    emailRequired: text,
    emailInvalid: text,
    messageTooShort: text,
    messageTooLong: text,
  }),
  errors: z.strictObject({
    failed: emailCopy,
    unavailable: emailCopy,
    limited: emailCopy,
  }),
});

// ---------- errors and helpers ----------

export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentError";
  }
}

function formatPath(exportName: string, path: PropertyKey[]): string {
  return path.reduce<string>(
    (result, part) =>
      typeof part === "number"
        ? `${result}[${part}]`
        : `${result}.${String(part)}`,
    exportName,
  );
}

/** Validates one content export. Errors name the file and the field. */
export function parseContent<T>(
  file: string,
  exportName: string,
  schema: z.ZodType<T>,
  data: unknown,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const lines = result.error.issues.map(
    (issue) => `  ${formatPath(exportName, issue.path)}: ${issue.message}`,
  );
  throw new ContentError(
    `Invalid content in content/${file}.ts:\n${lines.join("\n")}`,
  );
}

/** Rules that span files. */
export function validateRelations(input: {
  projects: Pick<Project, "slug">[];
  papers: Pick<Paper, "relatedProject">[];
}): void {
  const slugs = new Set(input.projects.map((project) => project.slug));
  const lines: string[] = [];
  input.papers.forEach((paper, index) => {
    if (
      paper.relatedProject !== undefined &&
      !slugs.has(paper.relatedProject)
    ) {
      lines.push(
        `  papers[${index}].relatedProject: no project has the slug ${JSON.stringify(paper.relatedProject)} (see content/projects.ts)`,
      );
    }
  });
  if (lines.length > 0) {
    throw new ContentError(
      `Invalid content in content/papers.ts:\n${lines.join("\n")}`,
    );
  }
}
