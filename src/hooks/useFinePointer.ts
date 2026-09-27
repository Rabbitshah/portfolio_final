"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * true on a device with a precise pointer that can hover (mouse, trackpad). false on touch
 * screens and during server rendering, so pointer-only effects never render into the HTML.
 * Updates when the pointer changes (e.g. a tablet gets a mouse).
 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
