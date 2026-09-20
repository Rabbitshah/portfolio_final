import { site } from "@/lib/content";
import { Button } from "@/components/primitives/Button";
import { Container } from "@/components/primitives/Container";

const primaryCta = "max-[559px]:basis-full max-[559px]:justify-center";
const otherCta =
  "max-[559px]:basis-[calc(50%-6px)] max-[559px]:grow max-[559px]:justify-center";

// No form and no copy-email button yet: mailto and profile links only.
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="py-[clamp(72px,10vw,140px)] [@media(max-height:500px)_and_(orientation:landscape)]:py-14"
    >
      <Container>
        <span className="font-mono text-[.78rem] uppercase tracking-[.04em] text-muted">
          07 — Contact
        </span>
        <h2
          id="contact-title"
          className="mb-10 mt-2 font-serif text-[clamp(3rem,10vw,9rem)] font-normal leading-[.95] tracking-[-.03em] [&_em]:italic [&_em]:text-accent-text"
        >
          Let&apos;s build <em>something</em>.
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            href={`mailto:${site.contact.email}`}
            arrow
            className={primaryCta}
          >
            {site.contact.email}
          </Button>
          <Button href={site.links.github} external className={otherCta}>
            GitHub ↗
          </Button>
          <Button href={site.links.linkedin} external className={otherCta}>
            LinkedIn ↗
          </Button>
        </div>
      </Container>
    </section>
  );
}
