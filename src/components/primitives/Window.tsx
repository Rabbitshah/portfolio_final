import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { TrafficLights } from "./TrafficLights";

// How tall the screen area is: a fixed height for mock visuals, a 16:9 frame for images.
const screenFrames = {
  mock: "h-[180px] p-[18px] min-[700px]:h-[210px]",
  "mock-featured": "h-[210px] p-[18px] min-[700px]:h-[270px]",
  image: "aspect-video",
};

// Static for now. Drag, tilt and working traffic lights arrive in Phase 3.
export function Window({
  title,
  meta,
  screen,
  screenFrame = "mock",
  decorativeScreen = false,
  caption,
  children,
  className,
}: {
  title: string;
  meta?: string;
  screen?: ReactNode;
  screenFrame?: keyof typeof screenFrames;
  /** Hide the screen area from assistive tech (for mock visuals). */
  decorativeScreen?: boolean;
  caption?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("min-w-0", className)}>
      <article className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-line bg-card transition-colors hover:border-line-strong">
        <header className="flex select-none items-center gap-3.5 border-b border-line px-4 py-3 font-mono text-[.76rem] text-muted">
          <TrafficLights />
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {meta && <span className="shrink-0">{meta}</span>}
        </header>
        {screen && (
          <div
            aria-hidden={decorativeScreen || undefined}
            className={cx(
              "relative overflow-hidden border-b border-line bg-bg-2",
              screenFrames[screenFrame],
            )}
          >
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
