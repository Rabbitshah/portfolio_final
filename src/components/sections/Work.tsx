import { visibleProjects } from "@content/projects";
import { Section } from "@/components/primitives/Section";
import { ProjectWindow } from "./ProjectWindow";

export function Work() {
  return (
    <Section
      id="work"
      eyebrow="02 — Work"
      title={
        <>
          Things I built, <em>and how</em>.
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 min-[700px]:grid-cols-2 min-[700px]:items-start">
        {visibleProjects.map((project) => (
          <ProjectWindow key={project.slug} project={project} />
        ))}
      </div>
    </Section>
  );
}
