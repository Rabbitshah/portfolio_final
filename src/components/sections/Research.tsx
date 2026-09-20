import { papers } from "@content/papers";
import { Card } from "@/components/primitives/Card";
import { Section } from "@/components/primitives/Section";

export function Research() {
  return (
    <Section
      id="research"
      eyebrow="03 — Research"
      title={
        <>
          Papers, <em>not just repos</em>.
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 min-[760px]:grid-cols-2">
        {papers.map((paper) => (
          <Card as="article" key={paper.slug} className="flex flex-col gap-3">
            <span className="inline-flex self-start rounded-md bg-accent px-2.5 py-1 font-mono text-[.72rem] font-medium text-accent-ink">
              {paper.venueShort}
            </span>
            <p className="font-mono text-[.78rem] uppercase tracking-[.04em] text-muted">
              {paper.role} · {paper.year}
            </p>
            <h3 className="font-serif text-[1.65rem] leading-[1.15]">
              {paper.title}
            </h3>
            <p className="max-w-[60ch] text-muted">{paper.summary}</p>
            {paper.metrics && (
              <div className="mt-1.5 flex flex-wrap gap-x-[26px] gap-y-3">
                {paper.metrics.map((metric) => (
                  <div key={metric.label}>
                    <b className="block font-serif text-[2.4rem] font-normal leading-none text-accent-text">
                      {metric.value}
                    </b>
                    <span className="mt-1 block text-[.8rem] text-muted">
                      {metric.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {paper.metricsNote && (
              <p className="font-mono text-[.74rem] text-muted">
                {paper.metricsNote}
              </p>
            )}
            {paper.url && (
              <div className="mt-auto pt-1.5">
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-11 items-center gap-1.5 border-b border-transparent font-medium transition-colors hover:border-accent-text hover:text-accent-text"
                >
                  {paper.doi ? "DOI ↗" : "Read ↗"}
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Section>
  );
}
