import { cx } from "@/lib/cx";

// The three window dots (close, minimize, zoom). Shared by the window headers and the hero intro,
// so they always look the same. Decorative.
export function TrafficLights({ className }: { className?: string }) {
  return (
    <span className={cx("flex gap-[7px]", className)} aria-hidden="true">
      <i className="block size-[11px] shrink-0 rounded-full bg-tl-close" />
      <i className="block size-[11px] shrink-0 rounded-full bg-tl-min" />
      <i className="block size-[11px] shrink-0 rounded-full bg-tl-zoom" />
    </span>
  );
}
