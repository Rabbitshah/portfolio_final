import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Card({
  as: Tag = "div",
  children,
  className,
}: {
  as?: "div" | "article" | "li";
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tag
      className={cx(
        "relative overflow-hidden rounded-[22px] border border-line bg-card p-[clamp(20px,2.4vw,30px)] transition-colors hover:border-line-strong max-[380px]:p-[18px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
