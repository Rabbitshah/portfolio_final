import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

export function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cx(
        "py-[clamp(72px,10vw,140px)] [@media(max-height:500px)_and_(orientation:landscape)]:py-14",
        className,
      )}
    >
      <Container>
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <span className="font-mono text-[.78rem] uppercase tracking-[.04em] text-muted">
            {eyebrow}
          </span>
          <h2
            id={`${id}-title`}
            className="max-w-[18ch] font-serif text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] tracking-[-.02em] [&_em]:italic [&_em]:text-accent-text"
          >
            {title}
          </h2>
        </Reveal>
        {children}
      </Container>
    </section>
  );
}
