// The measurement settings. They are fixed on purpose: every LCP/CLS number in this project is
// measured with exactly these, so reports from different days and branches can be compared.
// Do not add command-line overrides. If a setting has to change, change it here, in a commit
// that says why, and re-measure `main` with the new settings before comparing anything.

export const SETTINGS = Object.freeze({
  // Cache is off for every run (a cold load), in both profiles.
  cacheDisabled: true,
  // After the load event, wait this long before reading the metrics.
  settleMs: 3500,
  // The h1's size is sampled every frame for this long, to catch a font swap.
  fontSwapWatchMs: 2000,
  // A layout shift counts as "early" if it happens within this time of navigation start.
  earlyShiftMs: 1000,

  mobile: Object.freeze({
    name: "mobile 390x844, throttled",
    runs: 15,
    viewport: Object.freeze({ width: 390, height: 844 }),
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    // Chrome DevTools "4x slowdown".
    cpuThrottleRate: 4,
    network: Object.freeze({
      // Chrome DevTools throughput is in bytes per second.
      downloadBytesPerSecond: (1.6 * 1024 * 1024) / 8, // 1.6 Mbit/s
      uploadBytesPerSecond: (750 * 1024) / 8, // 750 Kbit/s
      latencyMs: 150, // round trip time
    }),
  }),

  desktop: Object.freeze({
    name: "desktop 1440x900, unthrottled",
    runs: 9,
    viewport: Object.freeze({ width: 1440, height: 900 }),
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 1,
    cpuThrottleRate: null,
    network: null,
  }),
});

/** One sentence per profile, written into every report. */
export function describeSettings() {
  const { mobile: m, desktop: d } = SETTINGS;
  const kbit = (bytes) => Math.round((bytes * 8) / 1024) / 1000;
  return [
    `Production build, Playwright Chromium, cache off, ${SETTINGS.settleMs} ms settle after load.`,
    `Mobile: ${m.viewport.width}x${m.viewport.height} (isMobile, touch), CPU ${m.cpuThrottleRate}x slowdown, ` +
      `${kbit(m.network.downloadBytesPerSecond)} Mbit/s down, ` +
      `${Math.round((m.network.uploadBytesPerSecond * 8) / 1024)} Kbit/s up, ${m.network.latencyMs} ms RTT, ${m.runs} runs.`,
    `Desktop: ${d.viewport.width}x${d.viewport.height}, no throttling, ${d.runs} runs.`,
  ].join(" ");
}
