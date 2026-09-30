"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

// WCAG 2.2.2 (Pause, Stop, Hide): a keyboard and touch way to stop the moving strip.
// The button is a flex item beside the track, and CSS pauses the lists from its aria-pressed
// state (see .marquee in globals.css). Only rendered once JavaScript runs; the animation itself
// also needs JavaScript (data-js), so without it there is nothing to pause. Present whether or
// not reduced motion is on.
export function MarqueePause() {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const [paused, setPaused] = useState(false);
  if (!hydrated) return null;

  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label={paused ? "Resume scrolling text" : "Pause scrolling text"}
      onClick={() => setPaused(!paused)}
      className="mx-3 grid size-11 flex-none cursor-pointer place-items-center rounded-full border border-line-strong bg-card text-ink transition-colors hover:bg-ink hover:text-bg"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="size-4"
      >
        {paused ? (
          <path d="M8 5.5v13l11-6.5z" />
        ) : (
          <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
        )}
      </svg>
    </button>
  );
}
