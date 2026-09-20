import Link from "next/link";
import { site } from "@content/site";

const initials = site.name
  .split(" ")
  .map((word) => word.charAt(0).toLowerCase())
  .join("");

// The clock joins the city in Phase 3. Until then the bar shows only the city.
export function Brand() {
  return (
    <Link
      href="/"
      aria-label={`${site.name}, back to top`}
      className="flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap font-mono text-[.8rem]"
    >
      <b className="grid size-7 place-items-center rounded-lg bg-accent font-medium text-accent-ink">
        {initials}
      </b>
      <span className="max-[639px]:hidden">{site.location.city}</span>
    </Link>
  );
}
