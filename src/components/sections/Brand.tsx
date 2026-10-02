import Link from "next/link";
import { site } from "@/lib/content";
import { Clock } from "@/components/interactive/Clock";

const initials = site.name
  .split(" ")
  .map((word) => word.charAt(0).toLowerCase())
  .join("");

export function Brand() {
  return (
    <Link
      href="/"
      aria-label={`${site.name}, back to top`}
      className="flex min-h-11 min-w-11 shrink-0 items-center gap-2.5 whitespace-nowrap font-mono text-[.8rem]"
    >
      <b className="grid size-7 place-items-center rounded-lg bg-accent font-medium text-accent-ink">
        {initials}
      </b>
      <span>
        <span className="max-[639px]:hidden">{site.location.city}</span>
        <Clock
          timeZone={site.location.timezone}
          label={site.location.timezoneLabel}
        />
      </span>
    </Link>
  );
}
