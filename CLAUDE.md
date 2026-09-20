# CLAUDE.md — Maanav Shah portfolio

Full-stack Next.js portfolio. Read this file at the start of every session, then read the relevant section of `PLAN.md`.
The reference design and behavior spec is `reference/portfolio-template.html` (single-file, responsive, already tested). It is the spec for how things look and behave. Do not copy its JS wholesale: port each behavior into typed React components.

## Working agreement
1. **Plan first.** For any task bigger than a small fix: propose a short plan, list assumptions, wait for approval.
2. **One phase per session.** Work only on the phase I name. Do not start the next one.
3. **Simplicity first.** Minimum code that solves the task. No speculative abstractions, no extra config, no features I did not ask for.
4. **Surgical changes.** Every changed line must trace to the task. Do not reformat or refactor unrelated code. Mention unrelated problems, do not fix them.
5. **Verify before saying done.** Run the checks in "Definition of done". Show the output. If a check fails, fix it or tell me plainly.
6. **Never invent content.** Personal facts, numbers, links and quotes come from `content/`. If something is missing, add a `TODO(content)` marker and list it at the end of your reply.
7. **Never trust memory for library APIs or versions.** Look them up in the official docs (use the Context7 MCP server if available) before using a library. Do not pin versions from memory. Install the current stable release and tell me what you installed.
8. **Small commits.** Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). One logical change per commit. Never commit secrets or `.env*` files (except `.env.example`).

## Stack (defaults, tweakable)
Next.js App Router · TypeScript (strict) · Tailwind CSS · Framer Motion (`motion`) · shadcn/ui (Radix primitives) · PostgreSQL + Drizzle · Upstash Redis (rate limits) · Resend (email) · Zod · Vitest + Testing Library · Playwright · pnpm · Vercel.
Not used unless I ask: Redux, MUI, GSAP, Lenis, Three.js/R3F, Prisma, Firebase.

## Conventions
- **Server Components by default.** Add `"use client"` only for interactivity. Keep client islands small and leaf-level.
- **Folders:** API clients and external integrations go in `src/services/` (never `utils/`). Pure helpers go in `src/lib/`.
- **Validation:** every external input (forms, route handlers, env vars, content files) is validated with Zod.
- **Env vars:** validated at startup in `src/env.ts`. No `process.env` reads elsewhere. Only `NEXT_PUBLIC_*` may reach the client.
- **Styling:** Tailwind utilities + CSS variables for tokens (see PLAN.md §9). No hard-coded colors in components.
- **No `any`.** No non-null `!` unless commented with why it is safe.
- **Naming:** components `PascalCase.tsx`, hooks `useThing.ts`, one component per file.

## Non-negotiables (quality gates)
- **Accessibility:** semantic HTML, one `<h1>`, visible focus rings, `prefers-reduced-motion` respected for all animation, keyboard-operable everything, dialogs use Radix (focus trap, Esc, `aria-modal`).
- **Progressive enhancement:** all content renders and is readable with JS disabled. Reveal animations must never hide content if JS fails.
- **Pointer capability:** cursor ring, magnetic buttons, drag, tilt, spotlight, doodle mode only when `(hover: hover) and (pointer: fine)`. On touch: no `touch-action: none` on scrollable areas, window traffic-light buttons disabled and `aria-hidden`.
- **Responsive contract:** no horizontal scroll at 320, 360, 390, 430, 600, 768, 844×390, 1024, 1180, 1280, 1440, 1920, 2560 px wide. Tap targets ≥ 44 px on touch. Text ≥ 11.5 px. Grid columns use `minmax(0, 1fr)`. Breakpoint behavior is in PLAN.md §9.
- **Performance:** LCP < 2.5 s, CLS < 0.1, INP < 200 ms on mobile. Set and enforce a first-load JS budget (proposed: ≤ 150 KB gzipped for `/`, adjust after measuring).
- **Privacy:** never publish my phone number. Do not log message bodies or chat questions in analytics. Hash IPs before storing.

## Definition of done (run all, paste results)
```
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e        # Playwright: viewport matrix + overflow + axe
```
Plus a one-paragraph summary: what changed, what I should check by hand, and any `TODO(content)` items.

## Commands
`pnpm dev` · `pnpm build` · `pnpm start` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:e2e` · `pnpm db:generate` · `pnpm db:migrate`
(If a script does not exist yet, create it in the phase that needs it.)

Never write files with PowerShell redirection or `Set-Content`. Use the editor tools, and run `pnpm check:encoding` before committing.

@AGENTS.md
