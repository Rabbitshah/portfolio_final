// content/notes.ts  (the notes.txt card)
// TODO(content): drafted; review every claim. Copied from reference/portfolio-template.html.
// {roles}, {projects} and {papers} are filled from the derived stats in src/lib/stats.ts.

export interface Note {
  title: string;
  date: string;
  label: string;
  paragraphs: string[];
}

export const note: Note = {
  title: "notes.txt",
  date: "sep 2026",
  label: "a note from maanav",
  paragraphs: [
    "hi, i'm maanav.",
    "i build the whole product: the api, the background jobs, the ui, and the docker setup.",
    "the problems i've liked most sit where a normal web app meets ai: document pipelines, chat, and evolutionary algorithms.",
    "i'm early in my career. {roles} roles, {projects} projects and {papers} papers so far, all listed on this page.",
    "say hi below.",
  ],
};
