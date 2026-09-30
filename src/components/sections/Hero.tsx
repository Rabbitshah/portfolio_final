import { Fragment } from "react";
import { site } from "@/lib/content";
import { Button } from "@/components/primitives/Button";
import { Container } from "@/components/primitives/Container";
import { splitHeadline } from "@/lib/headline";
import { Cube } from "./Cube";

function Headline({ text }: { text: string }) {
  return splitHeadline(text).map((run, index) =>
    run.emphasized ? (
      <em key={index}>{run.text}</em>
    ) : (
      <span key={index}>{run.text}</span>
    ),
  );
}

const primaryCta = "max-[559px]:basis-full max-[559px]:justify-center";
const otherCta =
  "max-[559px]:basis-[calc(50%-6px)] max-[559px]:grow max-[559px]:justify-center";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-svh items-center pb-[60px] pt-[clamp(110px,14vw,150px)] max-[699px]:min-h-0 max-[699px]:items-start max-[699px]:pb-12 max-[699px]:pt-28 [@media(max-height:500px)_and_(orientation:landscape)]:min-h-0 [@media(max-height:500px)_and_(orientation:landscape)]:items-start [@media(max-height:500px)_and_(orientation:landscape)]:pb-10 [@media(max-height:500px)_and_(orientation:landscape)]:pt-[92px]"
    >
      <Container>
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-10 min-[700px]:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] min-[700px]:gap-[clamp(24px,5vw,72px)]">
          <div>
            <p className="mb-7 inline-flex items-center gap-2.5 font-mono text-[.78rem] uppercase tracking-[.04em] text-muted before:h-px before:w-7 before:bg-line-strong before:content-['']">
              <span>
                {/* Phrases never split, so a narrow screen wraps at the "·" and not inside one. */}
                {site.eyebrow.split(" · ").map((phrase, index, all) => (
                  <Fragment key={phrase}>
                    {index > 0 && " "}
                    <span className="whitespace-nowrap">
                      {phrase}
                      {index < all.length - 1 && " ·"}
                    </span>
                  </Fragment>
                ))}
              </span>
            </p>
            <h1
              id="hero-title"
              className="font-serif text-[clamp(2.6rem,11.5vw,3.6rem)] leading-[.97] tracking-[-.025em] min-[700px]:text-[clamp(2.6rem,6.2vw,4.6rem)] min-[980px]:text-[clamp(2.9rem,min(5.6vw,11vh),5.4rem)] [&_em]:whitespace-nowrap [&_em]:italic [&_em]:text-accent-text"
            >
              <Headline text={site.headline} />
            </h1>
            <p className="mt-[30px] max-w-[52ch] text-[clamp(1.05rem,1.6vw,1.2rem)] text-muted">
              {site.intro}
            </p>
            <div className="mt-[38px] flex flex-wrap gap-3">
              <Button
                variant="primary"
                href="#work"
                arrow
                className={primaryCta}
              >
                See projects
              </Button>
              {site.links.resume && (
                <Button href={site.links.resume} external className={otherCta}>
                  Résumé
                </Button>
              )}
              <Button
                href={`mailto:${site.contact.email}`}
                className={otherCta}
              >
                Email me
              </Button>
            </div>
          </div>
          <Cube />
        </div>
      </Container>
    </section>
  );
}
