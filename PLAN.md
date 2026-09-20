# PLAN.md — Portfolio rebuild in full-stack Next.js

Owner: Maanav Shah · Reference implementation: `reference/portfolio-template.html` · Project rules: `CLAUDE.md`

> Versions are deliberately not pinned here. Claude Code must look up current stable versions and APIs in the official docs before using them.

---

## 0. How to use this with Claude Code

1. Create the repo. Put `CLAUDE.md` and `PLAN.md` in the root, and the template at `reference/portfolio-template.html`.
2. Start each session with: *"Read CLAUDE.md and PLAN.md. Work on Phase N only. Propose a plan first."* Use plan mode.
3. One phase per session. Commit at the end of each phase. Deploy a Vercel preview after every phase.
4. Paste the phase prompt from §10. Tweak the plan by editing this file, not by repeating instructions in chat.
5. When a phase is done, ask Claude Code to run the "Definition of done" from `CLAUDE.md` and paste the output.

---

## 1. Goals and non-goals

**Goals**
- A fast, accessible, responsive portfolio that recruiters can skim in 10 seconds and engineers can dig into.
- Keep the look and behavior of the template: Understory palette, Clicky-style desktop-collage interactions, one 3D moment, smooth motion.
- A real backend that proves full-stack skill: contact pipeline, typed content layer, and optionally a grounded "Ask about me" assistant.
- Keep the resume URL `https://maanavshah.vercel.app/` working (deploy to the same Vercel project when ready).

**Non-goals (say no to these)**
- No heavy WebGL scene. The template's CSS cube is the 3D moment. R3F is a backlog item.
- No Redux, no MUI, no auth system for visitors, no CMS product, no vector database for a few thousand words of content.
- No fake testimonials or placeholder numbers in production.

**Honest tradeoff:** every optional feature costs time you could spend applying for jobs. Ship Milestone 1 first (§10), then add depth.

---

## 2. Architecture

```
Browser
  │  static/streamed HTML (Server Components, content from /content)
  ▼
Next.js (Vercel)
  ├─ Server Components ── read typed content (MDX/JSON validated by Zod)
  ├─ Client islands ───── interactions (palette, companion, windows, doodle…)
  ├─ Route Handlers ───── /api/contact  /api/ask (optional)  /api/health
  ├─ Server Actions ───── contact form submit (progressive enhancement)
  └─ Services (src/services)
        ├─ db.ts       → PostgreSQL (Neon or Supabase) via Drizzle
        ├─ ratelimit.ts→ Upstash Redis
        ├─ mailer.ts   → Resend
        └─ llm.ts      → provider adapter (Anthropic/OpenAI), optional
```

Rule of thumb: content is static and lives in git. Only *visitor-generated* data (messages, optional chat logs, optional guestbook) lives in the database.

---

## 3. Tech stack

| Area | Choice | Why | Status |
|---|---|---|---|
| Framework | Next.js App Router, React Server Components | SEO, streaming, matches your resume | Core |
| Language | TypeScript strict | Employers expect it | Core |
| Styling | Tailwind CSS + CSS variable tokens | Your default; tokens map 1:1 from the template | Core |
| Motion | Framer Motion (`motion`) | Your default. Reveal, accordion, page transitions, magnetic springs | Core |
| Primitives | shadcn/ui on Radix (Dialog, Command, Sheet, Accordion) | Free focus traps and a11y for menu, palette, FAQ | Core |
| Fonts | `next/font` (Instrument Serif, Hanken Grotesk, JetBrains Mono) | Self-hosted, no layout shift | Core |
| Content | Typed MDX/JSON in `/content` + Zod (+ `gray-matter`) | Git-based CMS. Keep it simple; a content-collections library is optional | Core |
| Validation | Zod (forms, env, content) | One validation story | Core |
| DB | PostgreSQL (Neon or Supabase) + Drizzle | You know Postgres; Drizzle is light | Core (contact) |
| Rate limit | Upstash Redis | Serverless-friendly; you know Redis | Core (contact) |
| Email | Resend | Simple API. Verify sender/domain rules in its docs | Core (contact) |
| Spam guard | Honeypot + time trap; Cloudflare Turnstile if needed | No CAPTCHA friction | Core / optional |
| Admin auth | Single-admin custom JWT via `jose` (signed httpOnly cookie, password hash in env) | Matches your "custom JWT, not Firebase" rule; no user table | Optional |
| AI | Provider adapter, model from env | Grounded Q&A over `/content` | Optional (Phase 5) |
| Analytics | Vercel Analytics or Plausible | Privacy-friendly, no cookie banner | Optional |
| Tests | Vitest + Testing Library, Playwright, axe, Lighthouse CI | Includes the responsive audit | Core |
| CI/CD | GitHub Actions + Vercel previews | Every PR gets a preview | Core |
| Package mgr | pnpm | Fast, strict | Core |

Not needed for a portfolio: TanStack Query (use Server Actions/fetch in the two places that need it), Redux, Qdrant/RAG (content fits in one prompt).

---

## 4. Repository structure

> For now, content is plain typed TS files in `/content` (`site.ts`, `projects.ts`, `experience.ts`, `skills.ts`, `certifications.ts`, `papers.ts`). Phase 2 adds Zod schemas and loaders. Long-form deep dives move to MDX only if a case-study page needs it. The tree below shows the eventual layout.

```
.
├─ CLAUDE.md
├─ PLAN.md
├─ reference/portfolio-template.html
├─ content/
│  ├─ site.ts                # name, email, links, availability, nav
│  ├─ projects/*.mdx         # one file per project (frontmatter + body)
│  ├─ experience/*.mdx
│  ├─ papers.json
│  ├─ log/*.mdx              # build-log entries
│  ├─ faq.json
│  └─ notes.md               # the typewriter note
├─ public/
│  ├─ media/                 # screenshots, short muted clips (size-capped)
│  └─ resume.pdf             # TODO(content)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # fonts, theme, metadata, JSON-LD
│  │  ├─ page.tsx            # single-page home
│  │  ├─ projects/[slug]/page.tsx
│  │  ├─ log/page.tsx  log/[slug]/page.tsx
│  │  ├─ api/contact/route.ts  api/ask/route.ts  api/health/route.ts
│  │  ├─ opengraph-image.tsx  sitemap.ts  robots.ts  not-found.tsx
│  │  └─ admin/…             # optional
│  ├─ components/
│  │  ├─ ui/                 # shadcn primitives
│  │  ├─ sections/           # Hero, About, Work, Research, Experience, Log, Faq, Contact
│  │  ├─ interactive/        # client islands (see §8)
│  │  └─ primitives/         # Card, Chip, Button, Window, Section, Reveal
│  ├─ hooks/                 # useFinePointer, useReducedMotion, useInView, useClock
│  ├─ lib/                   # pure helpers, content loaders, zod schemas
│  ├─ services/              # db.ts ratelimit.ts mailer.ts llm.ts
│  ├─ db/                    # drizzle schema + migrations
│  ├─ styles/globals.css     # tokens + base
│  └─ env.ts                 # zod-validated env
├─ tests/  e2e/  (Playwright)  unit/  (Vitest)
└─ .github/workflows/ci.yml
```

---

## 5. Content model (validated with Zod at build time)

> For now, content is plain typed TS files in `/content`. Phase 2 adds the Zod schemas and loaders. Long-form deep dives move to MDX only if a case-study page needs it.

**Project (`content/projects/*.mdx` frontmatter)**
```
slug, title, window (e.g. "sustainability-tracker.app"), period ("2025–26"),
featured (bool), order (number),
short (≤ 160 chars), stack (string[]),
visual: "bars" | "rows" | "lesson" | "resume" | "chat" | "image",
media?: { src, alt, width, height },
links: { live?, code? },
metrics?: { label, value }[],
```
Body (MDX) = the "Deep dive" text and the case-study page. `short` is the "Quick read".

**Experience:** `role, org, location, start, end, bullets[]`.
**Paper:** `venue, title, year, role, summary, metrics[], url, doi?` (URLs are required or the field is omitted, never a placeholder).
**Log entry:** `date (YYYY-MM), text` (short) or an MDX post.
**FAQ:** `question, answer`. **Site:** `name, email, github, linkedin, timezone, availability`.

Rule: any missing fact is `TODO(content)` in the file and fails a `pnpm content:check` script in CI for production builds.

## 6. Data model (PostgreSQL, Drizzle)

| Table | Columns | Notes |
|---|---|---|
| `messages` | `id`, `name`, `email`, `body`, `created_at`, `ip_hash`, `user_agent_hash`, `status` (`new`/`read`/`spam`) | Contact form. Store hashed IP only |
| `chat_events` (optional) | `id`, `created_at`, `ip_hash`, `tokens_in`, `tokens_out`, `refused` (bool) | **No question text stored** unless you decide otherwise and disclose it |
| `guestbook` (backlog) | `id`, `name`, `strokes_json`, `created_at`, `approved` | Doodle wall; needs moderation |

## 7. Routes and API

| Route | Type | Purpose |
|---|---|---|
| `/` | Server | Single-page home, all sections |
| `/projects/[slug]` | Server (SSG) | Case study from MDX |
| `/log`, `/log/[slug]` | Server (SSG) | Build log |
| `/api/contact` | POST | Zod-validate → honeypot/time check → rate limit → store → email → 200/4xx JSON |
| `/api/ask` | POST, streaming | Optional grounded Q&A |
| `/api/health` | GET | Liveness for uptime checks |
| `/opengraph-image`, `/sitemap.xml`, `/robots.txt` | Metadata routes | SEO |
| `/admin` | Server + JWT | Optional inbox |

Contact form uses a Server Action with a plain-form fallback, so it works without JS.

---

## 8. Template → component map

Every interactive piece is a small client island. The template's JS is the behavior spec.

| Template feature | Component (client unless noted) | Behavior to preserve |
|---|---|---|
| Curtain + word-by-word headline | `Hero` (server) + CSS | CSS-only; must never hide text if JS fails |
| Floating bar, IST clock | `StatusBar`, `useClock` | `Intl` time in `Asia/Kolkata`; city/tz hidden < 640 px |
| Mobile menu | `MobileMenu` (Radix Dialog) | < 760 px only; Esc/link closes; locks scroll; resets on resize ≥ 760 |
| Now-playing chip | `NowPlaying` | ≥ 1320 px; rotates facts from `site.ts`; cross-fade |
| Command palette | `CommandPalette` (shadcn Command) | Ctrl/Cmd+K; sections, theme, copy email, links, doodle (fine pointer only) |
| CSS 3D cube | `Cube` | Pointer + scroll driven via rAF; paused off-screen; static under reduced motion |
| Desk stickers/icons | `Desk`, `Sticker` | Free drag on fine pointers; icons are real `<a>`; click-vs-drag threshold 4 px; hidden < 980 px |
| Companion | `Companion` | Eyes follow pointer; section-aware bubble with kaomoji; bubble hidden < 760 px; no pointer events on touch |
| Project windows | `ProjectWindow` | Tilt, drag-by-title-bar with spring snap-back; traffic lights: close (+ reopen chip), minimize, zoom; disabled + `aria-hidden` on touch |
| Quick read / Deep dive | `DetailToggle` | Sliding pill; swaps `short`/body; persist choice; both texts in DOM for no-JS |
| Notes typewriter | `TypedNote` | Full text in DOM first (screen readers get it); reserve height to avoid layout shift; skipped under reduced motion |
| FAQ | `Faq` (Radix Accordion) | Animated height; content readable without JS |
| Highlights marquee | `Marquee` (server + CSS) | Duplicate list `aria-hidden`; static wrap under reduced motion |
| Footer wordmark | `Wordmark` | Letters lift toward pointer (fine pointer, motion allowed) |
| Doodle mode | `DoodleLayer` | Canvas fixed layer, DPR-aware, ink fades ~3 s, Esc exits, fine pointer only |
| Cursor ring, magnetic buttons, card spotlight | `CursorRing`, `Magnetic`, `Spotlight` | Fine pointer + motion allowed only |
| Reveal on scroll, count-up | `Reveal`, `CountUp` | Motion `whileInView`; visible by default without JS |
| Theme toggle | `ThemeToggle` | System default + saved choice; no flash on load (cookie or inline script) |
| Copy email | `CopyEmail` | Clipboard with graceful failure message |

**Known gotchas (learned while building the template)**
- Grid columns must be `minmax(0, 1fr)`; a `nowrap` title otherwise stretches the layout at 320 px.
- Never set `touch-action: none` on things users scroll past; scope it to fine pointers.
- `scrollIntoView({behavior:"smooth"})` over a long page takes ~1.5 s: do not assert scroll position immediately in tests.
- The typed note must reserve its final height before typing, or the page jumps.
- The companion must not block taps; on touch it is `pointer-events: none`.
- Fixed elements need safe-area insets (notches, landscape).
- Use real fonts through `next/font`; the template was tested with fallback fonts, so re-check line breaks.

---

## 9. Design tokens and responsive contract

**Palette: Understory** (contrast checked: all body/muted/accent text ≥ 4.5:1, button labels ≥ 4.5:1)

```css
:root {                /* light */
  --bg:#F1EEE3; --bg-2:#E8E5D8; --card:#FAF8F1;
  --ink:#141A14; --muted:#4F5A52;
  --line:rgba(20,26,20,.14); --line-strong:rgba(20,26,20,.32);
  --accent:#2F7A4B; --accent-ink:#FFFFFF; --accent-text:#1F5C4A;
  --glass:rgba(250,248,241,.82);
}
:root[data-theme="dark"] {
  --bg:#0C120E; --bg-2:#101812; --card:#131C16;
  --ink:#EAF0E4; --muted:#9AA79D;
  --line:rgba(234,240,228,.12); --line-strong:rgba(234,240,228,.3);
  --accent:#86E0A0; --accent-ink:#06170C; --accent-text:#9CCBA8;
  --glass:rgba(19,28,22,.72);
}
/* also apply the dark set under @media (prefers-color-scheme: dark) when no explicit theme is stored */
```
Map these to Tailwind theme colors (`bg`, `card`, `ink`, `muted`, `accent`, …) so components never use raw hex.

**Type:** display Instrument Serif, body Hanken Grotesk, labels JetBrains Mono.

**Responsive contract (from the audited template)**

| Width | Behavior |
|---|---|
| ≥ 1600 | Root font scales up gradually (cap 24 px) so 1920–2560 screens do not look tiny |
| ≥ 1320 | Now-playing chip in the bar |
| ≥ 1100 | "Open to remote roles" label in the bar |
| ≥ 980 | Desktop-collage stickers and scroll hint |
| 700–979 | Two-column hero, 6/6 bento, 2-column project grid, timeline with 150 px date column |
| 760+ | Inline nav; below 760 hamburger + full-screen menu; companion bubble hidden |
| < 700 | Single-column hero, **text first**, cube below; all grids stacked |
| < 640 | Bar shows only logo + time |
| < 560 | Search button hidden; CTA buttons 2-up with a full-width primary |
| < 380 | Tighter padding |
| Landscape, height ≤ 500 | Compact hero; companion hidden |

Headline size uses `clamp()` with both `vw` and `vh` so the CTAs stay above the fold at 1280×720 and 1440×900.

---

## 10. Phases (each ends deployable, with acceptance criteria and a prompt)

### Milestone map
| Milestone | Phases | Outcome |
|---|---|---|
| **M1: Shippable** | 0, 1, 2, 4 (contact), 7-lite | Real site on Vercel, content-driven, contact form works. Start applying with this |
| **M2: Delightful** | 3 | All Clicky-style interactions, responsive and accessible |
| **M3: Proof of depth** | 5, 6 | AI Q&A, admin inbox, analytics |
| **M4: Polish** | 7-full, backlog | Full QA, launch checklist |

### Phase 0 — Repo and tooling
- Scaffold Next.js (TypeScript, Tailwind, App Router, ESLint), pnpm, Prettier, strict `tsconfig`.
- `src/env.ts` (Zod), `.env.example`, scripts from `CLAUDE.md`, Vitest, Playwright, GitHub Actions CI, Vercel project linked (preview only).
- **Accept:** `pnpm typecheck lint test build` pass locally and in CI; empty page deploys to a preview URL.
- **Prompt:** *"Read CLAUDE.md and PLAN.md. Do Phase 0 only. Propose the plan first. Look up current install commands in the official docs; do not pin versions from memory."*

### Phase 1a — Foundation (tokens, primitives, bar)
- Tokens (§9), `next/font`, no-flash theme, Tailwind theme mapping.
- Primitives: `Button`, `Chip`, `Card`, `Section`, `Window`, `Reveal` (visible without JS).
- Bar + `MobileMenu`.
- Temporary `/dev/kit` page showing every primitive in light and dark.
- **Accept:** `/dev/kit` matches the template's look at 390, 768, 1440 in both themes; no horizontal scroll at the 13 sizes; axe has no serious or critical violations on `/dev/kit`.
- **Prompt:** *"Do Phase 1a. Use reference/portfolio-template.html as the visual spec. Server Components only except the mobile menu and theme toggle. Show me screenshots at 390, 768 and 1440 when done."*

### Phase 1b — Sections from the content files
- Sections rendered on the server from the files in `/content`: Hero, marquee, About bento, Work, Research, Experience, Log, FAQ, Contact, Footer wordmark.
- Responsive contract implemented. Remove `/dev/kit` at the end.
- **Accept:** visually matches the template at 390, 768, 1440; readable with JS disabled; no horizontal scroll at the 13 sizes; Lighthouse SEO 100 and Accessibility ≥ 95 on a preview.
- **Prompt:** *"Do Phase 1b. Use reference/portfolio-template.html as the visual spec and the files in /content as the only source of content. Show me screenshots at 390, 768 and 1440 when done."*

### Phase 2 — Content layer, SEO, case studies
- Zod schemas and loaders for §5. Move all placeholder copy into `/content`.
- `/projects/[slug]`, `/log`, `/log/[slug]`. Detail toggle data model (`short` vs body).
- Metadata API, `sitemap.ts`, `robots.ts`, JSON-LD `Person`, dynamic OG image, canonical URL.
- `pnpm content:check` fails on `TODO(content)` when `NODE_ENV=production`.
- **Accept:** adding a project = adding one MDX file; invalid frontmatter fails the build with a clear message; link preview validated in an OG debugger.
- **Prompt:** *"Do Phase 2. Content is validated with Zod at build time. Do not invent any facts; use TODO(content) markers."*

### Phase 4 — Contact backend (do this before Phase 3 for M1)
- Drizzle schema + migration for `messages`. `src/services/{db,ratelimit,mailer}.ts`.
- Server Action + `/api/contact`: Zod, honeypot, minimum-time trap, per-IP rate limit, store (hashed IP), send email to you, friendly errors, works without JS.
- Success/failure UI with `aria-live`.
- **Accept:** unit tests for validation and rate limiting; e2e test submits a message on a preview; a spam-looking post is rejected; nothing sensitive in logs.
- **Prompt:** *"Do Phase 4. Follow the services/ convention. Verify the Resend and Upstash APIs in their docs first. Add tests. Never log message bodies."*

### Phase 3 — Interaction layer (M2)
Build in this order; each item is its own commit and is reduced-motion and pointer-capability safe (§8):
1. `useFinePointer`, `useReducedMotion`, `Reveal`/`CountUp`
2. `StatusBar` clock, `NowPlaying`, `CopyEmail`, `Marquee`
3. `CommandPalette`
4. `ProjectWindow` (tilt, drag, traffic lights) + `DetailToggle`
5. `Companion`
6. `Cube`, `Desk`/`Sticker`
7. `TypedNote`, `Faq` accordion, `Wordmark`
8. `CursorRing`, `Magnetic`, `Spotlight`
9. `DoodleLayer`
10. Optional: page transitions (Framer Motion) if they do not hurt INP
- **Accept:** each behavior matches the template; keyboard-only run-through works; reduced-motion run-through shows a complete static page; first-load JS within budget; no console errors.
- **Prompt:** *"Do Phase 3, item N only. Port the behavior from the template's JS into a typed client component. State the pointer-capability and reduced-motion behavior in your plan."*

### Phase 5 — "Ask about Maanav" assistant (optional, M3)
- The companion bubble and command palette get an "Ask" mode.
- `/api/ask`: streams from the LLM adapter (`llm.ts`, model from env). The system prompt contains **only** the content from `/content` and rules: answer only from that content, say "I don't know, ask him directly" otherwise, refuse off-topic requests, never invent employers, dates, numbers or links, keep answers short.
- Guardrails: per-IP rate limit, daily global token cap, max input length, prompt-injection tests, no question text stored, a visible "AI answers from my resume; verify important details" note.
- **Accept:** an eval file with ≥ 25 questions (facts, unknowns, off-topic, injections). Every fact answer is correct, every unknown answer declines, every injection fails. Cost per 100 questions measured and noted in the README.
- **Why no RAG/Qdrant:** the whole content fits in one prompt. Add retrieval only if content grows large; a note in the README about that decision reads better than needless infrastructure.
- **Prompt:** *"Do Phase 5. Start by writing the eval questions and the refusal rules, then implement. Show me the eval results."*

### Phase 6 — Admin inbox and analytics (optional, M3)
- `/admin`: single-admin login (bcrypt/argon2 hash in env, `jose` JWT in httpOnly, secure, sameSite cookie), list/mark-read/spam messages, login rate limit.
- Analytics (Vercel Analytics or Plausible), no cookies, no message content.
- **Accept:** unauthenticated access returns a redirect/401; tests for auth; no secrets in the client bundle.

### Phase 7 — QA and launch
- **7-lite (M1):** e2e smoke test, build on CI, custom domain/URL, redirects, Search Console, OG check.
- **7-full (M4):**
  - Playwright viewport matrix at the 13 sizes: assert `scrollWidth <= innerWidth`, no tap target < 44 px on touch profiles, no text < 11.5 px.
  - axe on light and dark; keyboard test; reduced-motion test; JS-disabled test.
  - Lighthouse CI budgets (Performance ≥ 90 mobile, A11y ≥ 95, SEO 100).
  - Manual checks on a real iPhone (Safari) and a real Android (Chrome), plus a desktop Firefox.
  - README with architecture, decisions, and how to run.

### Backlog
- R3F 3D cube upgrade, lazy-loaded with a static fallback on mobile and reduced motion.
- Guestbook "doodle wall" (moderated, rate limited, size-capped).
- RSS for the build log; project filtering by stack; case-study writing for the two papers.

---

## 11. Testing and quality gates

| Layer | Tool | What it covers |
|---|---|---|
| Unit | Vitest | Zod schemas, content loaders, rate-limit and contact logic, clock formatting |
| Component | Testing Library | Menu, palette, accordion, toggle keyboard behavior |
| E2E | Playwright | Contact flow, palette, menu, viewport matrix, overflow, tap targets, JS-off render |
| A11y | axe (in Playwright) | Both themes |
| Perf | Lighthouse CI | Budgets in §9 and `CLAUDE.md` |
| Content | `pnpm content:check` | No `TODO(content)` in production |

**Viewport matrix:** 320×640, 360×740, 390×844, 430×932, 600×900, 768×1024, 844×390, 1024×768, 1180×820, 1280×720, 1440×900, 1920×1080, 2560×1440.

## 12. Security and privacy checklist
- [ ] Security headers and a CSP (Next config/middleware); no inline script except the theme bootstrap (nonce or hash)
- [ ] All inputs validated with Zod; output escaped; email headers built safely (no header injection)
- [ ] Rate limits on contact, ask, and admin login
- [ ] Honeypot + time trap; Turnstile only if spam appears
- [ ] Secrets only in env; `NEXT_PUBLIC_*` reviewed; nothing sensitive in the client bundle
- [ ] Hash IPs; no message or chat text in analytics or logs
- [ ] Phone number never published; consider rendering the email client-side to reduce scraping
- [ ] Dependency audit in CI

## 13. Environment variables
`DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL`, optional: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `ASK_DAILY_TOKEN_CAP`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, `TURNSTILE_SECRET_KEY`.
All read through `src/env.ts`. Provide `.env.example` with no real values.

## 14. Content TODOs (do not ship until resolved)
- [ ] NEAT paper figures (97% completion, 6× faster training) and the IEEE Xplore URL/DOI: confirm against the paper itself
- [ ] ProFolio pilot figures (80%+ ATS compatibility, 30% recruiter efficiency): confirm against the paper
- [ ] Résumé PDF, live URLs and repo URLs for each project, real screenshots or short muted clips
- [ ] Highlights strip numbers (users, uptime, load time, lead response): each must match your resume
- [ ] Notes, FAQ answers, and log entries: rewrite in your own voice and check every claim
- [ ] Availability wording ("Open to remote roles", "open to work")
- [ ] Any real recommendations you can quote with permission (none are invented)
- [ ] Confirm you own the domain/Vercel project you deploy to

## 15. Risks and decisions
| Risk | Mitigation |
|---|---|
| Over-building delays your job search | Ship M1 first; M2 and M3 are upgrades |
| AI assistant says something false about you | Grounded prompt, refuse-when-unsure, eval suite, visible disclaimer. Remove it if it ever misleads |
| AI cost or abuse | Rate limits, token cap, input limit, kill switch env var |
| Motion hurts performance or accessibility | Budgets, reduced-motion path, JS-off path, pointer gating |
| Spam through the contact form | Honeypot, time trap, rate limit, optional Turnstile |
| Content drift between template and site | `/content` is the single source; template is only a visual spec |
| Fonts/line breaks differ from template | Re-check after `next/font` is wired |
