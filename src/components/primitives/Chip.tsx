import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex min-h-8 items-center rounded-full border border-line bg-bg-2 px-3 font-mono text-[.74rem] text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}
