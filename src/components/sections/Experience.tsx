import { experience } from "@content/experience";
import { Section } from "@/components/primitives/Section";
import { formatRange } from "@/lib/format";

export function Experience() {
  const entries = [...experience].sort((a, b) =>
    b.start.localeCompare(a.start),
  );

  return (
    <Section
      id="experience"
      eyebrow="04 — Experience"
      title={
        <>
          Where I&apos;ve <em>worked</em>.
        </>
      }
    >
      <ol className="ml-1.5 border-l border-line-strong">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="relative grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-2 pb-[clamp(32px,4vw,52px)] pl-[clamp(22px,4vw,44px)] before:absolute before:-left-1.5 before:top-2 before:size-[11px] before:rounded-full before:border-2 before:border-accent-text before:bg-bg before:content-[''] last:pb-0 min-[700px]:grid-cols-[150px_minmax(0,1fr)] min-[980px]:grid-cols-[200px_minmax(0,1fr)]"
          >
            <span className="font-mono text-[.78rem] uppercase tracking-[.04em] text-muted">
              {formatRange(entry.start, entry.end)}
            </span>
            <div>
              <h3 className="font-serif text-[1.7rem] leading-[1.15]">
                {entry.role}
              </h3>
              <p className="mt-1 text-muted">
                {entry.org} · {entry.location}
              </p>
              <ul className="mt-3 flex max-w-[70ch] flex-col gap-2 text-muted">
                {entry.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="relative pl-[18px] before:absolute before:left-0 before:top-[.72em] before:h-px before:w-2 before:bg-line-strong before:content-['']"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
