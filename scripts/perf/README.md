# Performance measurement scripts

LCP and CLS for the home page of a **production build**, measured the same way every time.
Every LCP/CLS number in a PR report should come from `pnpm perf:lcp`.

## The settings (fixed in `settings.mjs`, no command-line overrides)

|          | Mobile                                              | Desktop           |
| -------- | --------------------------------------------------- | ----------------- |
| Runs     | **15**                                              | **9**             |
| Viewport | 390x844, mobile and touch emulation, device scale 2 | 1440x900, scale 1 |
| CPU      | 4x slowdown                                         | none              |
| Network  | 1.6 Mbit/s down, 750 Kbit/s up, 150 ms round trip   | none              |
| Cache    | off                                                 | off               |

After the `load` event each run waits 3.5 s, then reads the metrics. Every run is a fresh browser
context (a cold load).

## What it reports

Per profile: **median, min and max LCP**, **median and max LCP minus FCP**, **max CLS**, the number of
runs with a layout shift in the first second, and the number of runs where the headline changed size
(a font swap or a reflow). The JSON also has every run (LCP, FCP, LCP minus FCP, CLS, LCP element).

- LCP minus FCP is 0 when the largest element (the h1) is painted in the very first frame.
- CLS should be 0. If it is not, run `node scripts/perf/cls-sources.mjs` to see which element moved.

## Running it

```bash
pnpm build
pnpm perf:lcp .review/lcp-main --label main
```

This starts `next start` on port 3210, measures it, and stops it. It takes about 5 minutes. It writes
`.review/lcp-main.json` and `.review/lcp-main.md` (write them somewhere git ignores, such as `.review/`).
It refuses to run without a build in `.next`. To measure a server you already started, use
`--url http://localhost:3000/` (it refuses a dev server).

Do not run anything else heavy while it measures (tests, builds, other servers): the numbers depend on
the machine's load.

## Comparing: run it back to back, in the order main, branch, branch, main

Two builds measured at different times can differ by 80 ms or more with no code difference at all. Real
example from this project: the same build measured twice in one session moved by 92 ms on mobile.
So never compare one batch of `main` from yesterday with one batch of a branch from today.

```bash
git checkout main          && pnpm build && pnpm perf:lcp .review/lcp-main-1 --label main
git checkout my-branch     && pnpm build && pnpm perf:lcp .review/lcp-branch-1 --label branch
                                            pnpm perf:lcp .review/lcp-branch-2 --label branch-again
git checkout main          && pnpm build && pnpm perf:lcp .review/lcp-main-2 --label main-again
node scripts/perf/compare.mjs .review/lcp-main-1.json .review/lcp-branch-1.json .review/lcp-branch-2.json .review/lcp-main-2.json
```

The order main, branch, branch, main spreads any drift in the machine (temperature, background load) over
both builds. `compare.mjs` refuses to compare reports with different settings.

How to read it:

- Look at the spread inside each batch (min / max) and at how far the same build moved between its two
  batches. A difference smaller than that is **no detectable change**; it is not proof of zero.
- If the branch's two batches agree with each other and with the second `main` batch, an early gap was a
  session effect.
- Report the numbers, not a verdict: median, min, max, LCP minus FCP, CLS.

## Other helpers

- `node scripts/perf/size.mjs <out.json>` : gzipped CSS and HTML size of a running production server.
  (First-load JS is already reported by `tests/e2e/bundle.spec.ts`.)
- `node scripts/perf/cls-sources.mjs [runs]` : which elements shift, if any (desktop profile).
- `node scripts/perf/compare.mjs a.json b.json ...` : the side-by-side table above.

## Not covered

Slower networks, other browsers (LCP is a Chromium metric), other pages (only `/`), and real devices.
