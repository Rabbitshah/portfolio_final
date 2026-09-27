import {
  experience,
  note,
  papers,
  visibleProjects,
  site,
  skillGroups,
} from "@/lib/content";
import type { ReactNode } from "react";
import { Card } from "@/components/primitives/Card";
import { Chip } from "@/components/primitives/Chip";
import { CountUp } from "@/components/primitives/CountUp";
import { Section } from "@/components/primitives/Section";
import { Window } from "@/components/primitives/Window";
import { cx } from "@/lib/cx";
import { formatRange } from "@/lib/format";
import { deriveStats, fillStats } from "@/lib/stats";

const stats = deriveStats({ experience, projects: visibleProjects, papers });

const mono = "font-mono text-[.78rem] uppercase tracking-[.04em] text-muted";
const cardTitle = "mb-3 mt-2.5 font-serif text-[1.7rem] leading-[1.15]";

// Bento columns: 12 wide from 980px, 6 + 6 from 700px, stacked below that.
const seven = "col-span-12 min-[700px]:col-span-6 min-[980px]:col-span-7";
const five = "col-span-12 min-[700px]:col-span-6 min-[980px]:col-span-5";
const four = "col-span-12 min-[700px]:col-span-6 min-[980px]:col-span-4";
const fourAlone = "col-span-12 min-[980px]:col-span-4";

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-3.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-[18px] gap-y-1.5 text-[.95rem]">
      {rows.map(([term, detail]) => (
        <div key={term} className="contents">
          <dt className="pt-[3px] font-mono text-[.74rem] uppercase tracking-[.04em] text-muted">
            {term}
          </dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

export function About() {
  const latest = [...experience].sort((a, b) =>
    b.start.localeCompare(a.start),
  )[0];
  const education = site.education[0];

  return (
    <Section
      id="about"
      eyebrow="01 — About"
      title={
        <>
          One person, the <em>whole stack</em>.
        </>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <Card as="article" className={seven}>
          <span className={mono}>Who</span>
          <h3 className={cardTitle}>
            Backend, frontend, and the boring parts in between.
          </h3>
          <div className="flex max-w-[60ch] flex-col gap-3 text-muted">
            {site.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Card>

        {latest && (
          <Card as="article" className={five}>
            <span className={mono}>Latest role</span>
            <h3 className={cardTitle}>{latest.orgShort ?? latest.org}</h3>
            <p className="max-w-[60ch] text-muted">
              {latest.role}, {formatRange(latest.start, latest.end)}.
            </p>
            {(latest.summary ?? latest.bullets[0]) && (
              <p className="mt-3 max-w-[60ch] text-muted">
                {latest.summary ?? latest.bullets[0]}
              </p>
            )}
          </Card>
        )}

        <Card as="article" className={four}>
          <span className={mono}>By the numbers</span>
          <div className="mt-2 grid grid-cols-3 gap-2 max-[560px]:gap-1">
            {(
              [
                [stats.roles, "roles & internships"],
                [stats.projects, "projects"],
                [stats.papers, "published papers"],
              ] as const
            ).map(([value, label]) => (
              <div key={label}>
                <b className="block font-serif text-[clamp(2.6rem,5vw,4rem)] font-normal leading-none text-accent-text">
                  <CountUp value={value} />
                </b>
                <span className="mt-1.5 block text-[.85rem] leading-[1.3] text-muted">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {education && (
          <Card as="article" className={four}>
            <span className={mono}>Education</span>
            <Facts
              rows={[
                ["Degree", education.degree],
                ["School", `${education.school}, ${education.city}`],
                [
                  "Years",
                  `${education.start} – ${education.end} · CGPA ${education.cgpa}`,
                ],
              ]}
            />
          </Card>
        )}

        <Card as="article" className={fourAlone}>
          <span className={mono}>Where &amp; when</span>
          <Facts
            rows={[
              [
                "Based in",
                `${site.location.city}, ${site.location.region}, ${site.location.country}`,
              ],
              [
                "Timezone",
                `${site.location.timezoneLabel} (${site.location.utcOffset})`,
              ],
            ]}
          />
        </Card>

        <Window
          title={note.title}
          meta={note.date}
          className={cx("col-span-12", "[&>article]:rounded-[22px]")}
        >
          <span className={mono}>{note.label}</span>
          <div className="flex max-w-[64ch] flex-col gap-4 font-mono text-[.95rem] leading-[1.75]">
            {note.paragraphs.map((paragraph) => (
              <p key={paragraph}>{fillStats(paragraph, stats)}</p>
            ))}
          </div>
        </Window>

        <Card as="article" className="col-span-12">
          <span className={mono}>Toolbox</span>
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-6 min-[700px]:grid-cols-2 min-[980px]:grid-cols-3">
            {skillGroups.map((group) => (
              <div key={group.category}>
                <h3 className={mono}>{group.category}</h3>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Chip>{item}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}
