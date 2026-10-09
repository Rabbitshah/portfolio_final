import type { Project } from "@/lib/content";
import Image from "next/image";
import type { ReactNode } from "react";
import { Chip } from "@/components/primitives/Chip";
import { Window } from "@/components/primitives/Window";
import { cx } from "@/lib/cx";
import { BarsVisual } from "./visuals/BarsVisual";
import { ChatVisual } from "./visuals/ChatVisual";
import { LessonVisual } from "./visuals/LessonVisual";
import { ResumeVisual } from "./visuals/ResumeVisual";
import { RowsVisual } from "./visuals/RowsVisual";

// Captions are copied from reference/portfolio-template.html.
const mockups: Record<string, { node: ReactNode; caption: string }> = {
  bars: { node: <BarsVisual />, caption: "sample data · kg CO₂e / month" },
  rows: { node: <RowsVisual />, caption: "sample data" },
  lesson: { node: <LessonVisual />, caption: "sample UI" },
  resume: { node: <ResumeVisual />, caption: "sample layout" },
  chat: { node: <ChatVisual />, caption: "sample chat" },
};

const linkClass =
  "inline-flex min-h-11 min-w-11 items-center gap-1.5 border-b border-transparent font-medium transition-colors hover:border-accent-text hover:text-accent-text";

export function ProjectWindow({ project }: { project: Project }) {
  const mockup = mockups[project.visual];
  const links = [
    { href: project.links.live, label: "Live ↗" },
    { href: project.links.code, label: "Code ↗" },
    { href: project.links.paper, label: "Paper ↗" },
  ].filter((link): link is { href: string; label: string } => !!link.href);

  let screen: ReactNode;
  if (mockup) {
    screen = mockup.node;
  } else if (project.media) {
    // No priority: project images are below the fold. Sizes match the 2-column grid.
    screen = (
      <Image
        src={project.media.src}
        alt={project.media.alt}
        fill
        sizes="(min-width: 700px) 50vw, 100vw"
        className="object-cover object-top"
      />
    );
  }

  return (
    <Window
      title={project.window}
      meta={project.period}
      screen={screen}
      screenFrame={
        mockup ? (project.featured ? "mock-featured" : "mock") : "image"
      }
      decorativeScreen={!!mockup}
      caption={mockup?.caption}
      cursorLabel="open"
      className={cx(project.featured && "min-[700px]:col-span-2")}
    >
      <h3 className="font-serif text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.1]">
        {project.title}
      </h3>
      <p className="max-w-[68ch] text-muted">{project.short}</p>
      <details className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-medium [&::-webkit-details-marker]:hidden">
          Deep dive
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <p className="mt-1 max-w-[68ch] text-muted">{project.deep}</p>
      </details>
      <ul className="flex flex-wrap gap-2">
        {project.stack.map((item) => (
          <li key={item}>
            <Chip>{item}</Chip>
          </li>
        ))}
      </ul>
      {links.length > 0 && (
        <div className="mt-auto flex gap-[18px] pt-1.5">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </Window>
  );
}
