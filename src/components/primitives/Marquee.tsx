import type { ReactNode } from "react";
import { MarqueePause } from "@/components/interactive/MarqueePause";
import { cx } from "@/lib/cx";

// Two identical lists in a track, with the pause button beside it (not over it). Motion is CSS only
// (see .marquee in globals.css) and is off without JavaScript or under reduced motion, where the
// first list is a static wrapped list and the duplicate is hidden.
// Each strip has its own pause button (WCAG 2.2.2).
export function Marquee({
  label,
  items,
  variant = "tech",
}: {
  label: string;
  items: { key: string; content: ReactNode }[];
  variant?: "tech" | "receipts";
}) {
  const receipts = variant === "receipts";

  const renderItems = () =>
    items.map((item) => (
      <li
        key={item.key}
        className={
          receipts
            ? "mr-3 block rounded-[14px] border border-line bg-card px-5 py-3.5 text-[.9rem] leading-[1.35] text-muted"
            : "flex items-center whitespace-nowrap px-[26px] font-serif text-[clamp(1.4rem,2.6vw,2rem)] leading-none after:ml-[52px] after:font-sans after:text-[.7em] after:text-accent-text after:content-['✦']"
        }
      >
        {item.content}
      </li>
    ));

  const listClass = receipts
    ? "justify-start [animation-direction:reverse] [animation-duration:50s]"
    : undefined;

  return (
    <div
      className={cx(
        "marquee",
        receipts
          ? "border-b border-line py-[22px]"
          : "border-y border-line py-[18px]",
      )}
    >
      <div className="marquee-track">
        <ul aria-label={label} className={listClass}>
          {renderItems()}
        </ul>
        <ul aria-hidden="true" className={listClass}>
          {renderItems()}
        </ul>
      </div>
      <MarqueePause />
    </div>
  );
}
