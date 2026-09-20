import { projects } from "@content/projects";
import { site } from "@content/site";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Chip } from "@/components/primitives/Chip";
import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { Window } from "@/components/primitives/Window";

const label = "font-mono text-[.78rem] uppercase tracking-[.04em] text-muted";

export function KitPanel({ theme }: { theme: "light" | "dark" }) {
  const project = projects[0];
  if (!project) return null;

  return (
    <div
      data-theme={theme}
      className="min-w-0 rounded-[22px] border border-line bg-bg text-ink"
    >
      <p className={`${label} px-6 pt-6`}>{theme} tokens</p>
      <Section
        id={`kit-${theme}`}
        eyebrow="01 — Primitives"
        title={
          <>
            Every <em>primitive</em>
          </>
        }
      >
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <p className={label}>Button</p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                href={`mailto:${site.contact.email}`}
                arrow
              >
                Email me
              </Button>
              <Button href={site.links.github} external arrow>
                GitHub
              </Button>
              <Button>Plain button</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className={label}>Chip</p>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className={label}>Card</p>
            <Card>
              <h3 className="font-serif text-[1.7rem] leading-[1.15]">
                {project.title}
              </h3>
              <p className="mt-2 max-w-[60ch] text-muted">{project.subtitle}</p>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <p className={label}>Window</p>
            <Window
              title={project.window}
              caption={project.status}
              screen={<p className="text-muted">{project.subtitle}</p>}
            >
              <h3 className="font-serif text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.1]">
                {project.title}
              </h3>
              <p className="max-w-[68ch] text-muted">{project.short}</p>
            </Window>
          </div>

          <div className="flex flex-col gap-3">
            <p className={label}>Reveal</p>
            <Reveal>
              <p className="text-muted">
                Always visible for now. Motion arrives in Phase 3.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>
    </div>
  );
}
