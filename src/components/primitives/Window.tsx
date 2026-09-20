import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// Static in Phase 1a. Drag, tilt and working traffic lights arrive in Phase 3.
export function Window({
  title,
  screen,
  caption,
  children,
  className,
}: {
  title: string;
  screen?: ReactNode;
  caption?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("min-w-0", className)}>
      <article className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-card transition-colors hover:border-line-strong">
        <header className="flex select-none items-center gap-3.5 border-b border-line px-4 py-3 font-mono text-[.76rem] text-muted">
          <span className="flex gap-[7px]" aria-hidden="true">
            <i className="block size-[11px] shrink-0 rounded-full bg-tl-close" />
            <i className="block size-[11px] shrink-0 rounded-full bg-tl-min" />
            <i className="block size-[11px] shrink-0 rounded-full bg-tl-zoom" />
          </span>
          <span className="min-w-0 flex-1 truncate">{title}</span>
        </header>
        {screen && (
          <div className="relative h-[180px] overflow-hidden border-b border-line bg-bg-2 p-[18px] min-[700px]:h-[210px]">
            {screen}
            {caption && (
              <span className="absolute bottom-2.5 right-3.5 font-mono text-[.72rem] uppercase tracking-[.05em] text-muted">
                {caption}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3.5 p-[clamp(20px,2.4vw,28px)] max-[380px]:p-[18px]">
          {children}
        </div>
      </article>
    </div>
  );
}
