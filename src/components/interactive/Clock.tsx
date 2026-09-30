"use client";

import { useClock } from "@/hooks/useClock";
import { cx } from "@/lib/cx";

// " · 14:05 IST" after the city. Invisible (but taking its space) until the client knows the
// time, so the bar does not shift; without JavaScript it simply stays blank.
export function Clock({
  timeZone,
  label,
}: {
  timeZone: string;
  label: string;
}) {
  const time = useClock(timeZone);
  return (
    <span className={cx("tabular-nums", time === null && "invisible")}>
      <span className="max-[639px]:hidden"> · </span>
      {time ?? "00:00"}
      <span className="max-[639px]:hidden"> {label}</span>
    </span>
  );
}
