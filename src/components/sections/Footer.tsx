import { site } from "@/lib/content";
import { Container } from "@/components/primitives/Container";

const firstName = site.name.split(" ")[0] ?? site.name;

export function Footer() {
  // The year is read when the page is built, so it only changes on the next deploy.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line pb-[calc(28px+env(safe-area-inset-bottom,0px))] pt-7 text-[.85rem] text-muted">
      <Container>
        <div
          aria-hidden="true"
          className="mb-[26px] flex w-full select-none justify-center overflow-hidden pt-[.12em] font-serif text-[clamp(4rem,19vw,17rem)] leading-[.86] tracking-[-.04em] text-ink"
        >
          {[...firstName.toLowerCase()].map((letter, index) => (
            <span key={index} className="inline-block">
              {letter}
            </span>
          ))}
        </div>
      </Container>
      <Container className="flex flex-wrap justify-between gap-4">
        <span>
          © {year} {site.name}
        </span>
        <span>
          {site.location.city}, {site.location.country}
        </span>
      </Container>
    </footer>
  );
}
