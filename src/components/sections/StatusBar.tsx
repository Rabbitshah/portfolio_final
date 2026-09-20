import Link from "next/link";
import { site } from "@/lib/content";
import { MobileMenu } from "@/components/interactive/MobileMenu";
import { ThemeToggle } from "@/components/interactive/ThemeToggle";
import { BarPill } from "@/components/primitives/BarPill";
import { Brand } from "./Brand";

export function StatusBar() {
  return (
    <BarPill>
      <Brand />
      <nav aria-label="Primary" className="max-[759px]:hidden">
        <ul className="flex gap-1">
          {site.nav.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-full px-3 text-[.9rem] text-muted transition-colors hover:bg-bg-2 hover:text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-2">
        {site.availability.open && (
          <span className="hidden items-center gap-2 whitespace-nowrap pr-1.5 font-mono text-[.72rem] text-muted min-[1100px]:flex">
            <i
              aria-hidden="true"
              className="size-2 animate-[avail-pulse_2.2s_infinite] rounded-full bg-accent shadow-[0_0_0_0_var(--accent)] outline outline-1 outline-line-strong"
            />
            {site.availability.label}
          </span>
        )}
        <MobileMenu
          brand={<Brand />}
          items={site.menu}
          email={site.contact.email}
          github={site.links.github}
          linkedin={site.links.linkedin}
        />
        <ThemeToggle />
      </div>
    </BarPill>
  );
}
