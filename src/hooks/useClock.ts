"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Calls back at every minute boundary, and when the tab becomes visible again.
function subscribe(onChange: () => void): () => void {
  let interval: number | undefined;
  const timeout = window.setTimeout(
    () => {
      onChange();
      interval = window.setInterval(onChange, 60_000);
    },
    60_000 - (Date.now() % 60_000),
  );
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearTimeout(timeout);
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/**
 * "HH:MM" in `timeZone`, updated every minute. null during server rendering and hydration,
 * so the static HTML never contains a time and the first client render matches it.
 */
export function useClock(timeZone: string): string | null {
  const format = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone,
      }),
    [timeZone],
  );
  const getSnapshot = useCallback(() => format.format(Date.now()), [format]);
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
