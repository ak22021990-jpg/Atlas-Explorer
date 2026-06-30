<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Atlas-Explorer** (2486 symbols, 3483 relationships, 86 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Atlas-Explorer/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Atlas-Explorer/clusters` | All functional areas |
| `gitnexus://repo/Atlas-Explorer/processes` | All execution flows |
| `gitnexus://repo/Atlas-Explorer/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Atlas Explorer**

Atlas Explorer is a single-page web app for geography education: learners explore an
interactive map of US states and Canadian provinces, then play games to test their
knowledge of postal codes, timezones, and locations. This milestone is a polish-and-completion
pass — fixing ~20 UI/UX bugs across 7 screens and finishing 6 remaining V3 plan features.

**Core Value:** The map must render fully and be usable — exploration and every game depend on seeing
and interacting with the complete North America map without cropping or obscured controls.

### Constraints

- **Tech stack**: React 19 + TS 6 + Vite 8 + Tailwind v4 — match existing patterns, no new frameworks
- **Routing**: HashRouter only (GitHub Pages has no server-side routing)
- **Hosting**: static GitHub Pages — offline resilience (C4) must work client-side, no server state
- **Compatibility**: existing session/localStorage schema is relied upon — migrate, don't break
- **Execution**: fixes applied via OpenCode CLI by the user
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages & Runtime
- **TypeScript 6.0** (`app/tsconfig.app.json`, target `es2023`, strict mode, `verbatimModuleSyntax`)
- **React 19.2** with JSX (`react-jsx`)
- **HTML5** (`app/index.html` — single entry point)
- **CSS** with TailwindCSS v4 utility classes
## Build & Dev Tooling
| Tool | Version | Config File | Purpose |
|------|---------|-------------|---------|
| Vite | ^8.0.10 | `app/vite.config.ts` | Dev server + production bundler |
| TypeScript | ~6.0.2 | `app/tsconfig.app.json`, `app/tsconfig.node.json` | Type checking |
| ESLint | ^10.2.1 | `app/eslint.config.js` | Linting (TS + React hooks plugins) |
| Vitest | ^4.1.5 | `app/vite.config.ts` `test` block | Unit testing |
| Playwright | ^1.59.1 | `app/scripts/screenshots.ts` | E2E screenshots (scripts only) |
## Framework / UI
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.5 | Core UI framework |
| react-dom | ^19.2.5 | DOM rendering |
| react-router-dom | ^7.14.2 | Client-side routing (HashRouter) |
| tailwindcss | ^4.2.4 | Utility-first CSS |
| @tailwindcss/vite | ^4.2.4 | TailwindCSS Vite plugin |
| lucide-react | ^1.16.0 | Icon library |
## Testing
| Tool | Version | Scope |
|------|---------|-------|
| Vitest | ^4.1.5 | Runner for all unit tests |
| jsdom | ^29.1.1 | DOM environment for tests |
| @testing-library/react | ^16.3.2 | React component tests (available, not yet used in tests) |
| @testing-library/jest-dom | ^6.9.1 | DOM matchers |
| @testing-library/user-event | ^14.6.1 | User event simulation |
## Infrastructure
- **Hosting:** GitHub Pages (via `app/vite.config.ts` `base: '/Atlas-Explorer/'`)
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`) — builds on push to `main`, deploys to Pages
- **Backend:** Google Apps Script (`apps-script/Code.gs`) — unconfigured (URL is empty string)
## Config & Scripts
- `dev`: `cd app && npx vite`
- `test`: runs 9 Node test scripts sequentially
- `build`: `tsc -b && vite build`
- `lint`: `eslint .`
- `test`: `vitest run`
- `preview`: `vite preview`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style
- **Language:** TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`)
- **Imports:** Type-only imports use `import type { ... }`
- **JSX:** React 19 JSX transform (no `import React from 'react'` needed)
- **CSS:** TailwindCSS v4 utility classes (no CSS modules, no styled-components)
- **Animations defined inline:** Using `<style>` tags inside components (e.g., `InteractiveMap.tsx`, `CodeDrop.tsx`)
- **Format:** No Prettier config detected; ESLint handles code quality
## Patterns
### State Management
- **React Context** (not Redux/Zustand) for global state (session, data, audio)
- **`useReducer`** for complex local state (GameShellPage state machine)
- **`useRef`** + mutable refs for performance-critical values (game counters, animation state)
- **`structuredClone`** for immutable state updates (session mutation)
### Error Handling
- Guard clauses at context usage (throw if used outside provider)
- `try/catch` with fallback to localStorage for network operations
- `console.error` / `console.warn` in catch blocks (no error tracking integration)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Core Business Logic (`app/src/lib/`)
| Module | Responsibility |
|--------|---------------|
| `session.ts` | CRUD for session, game attempts, training tracking, rank logic |
| `scoring.ts` | Pass threshold (70%), star calculation, points calculation |
| `badges.ts` | Evaluate 8 badge conditions after a passing attempt |
| `leaderboard.ts` | Score submission, leaderboard query (local or remote) |
| `crack-the-code.ts` | Question generation, answer checking for CodeDrop |
| `pin-it.ts` | Question generation for PinRush |
| `city-sorter.ts` | Question generation for CityStack |
| `timezones.ts` | Timezone color/fill maps |
| `assets.ts` | Asset path resolution via `import.meta.env.BASE_URL` |
| `game-route.ts` | Game index clamping/resolution from URL params |
| `exploration-trail.ts` | Trail animation for map exploration |
| `region-of-day.ts` | Daily region selection |
| `trainer-report.ts` | Trainer dashboard report generation |
| `tz-sorter.ts` | Timezone sort helpers |
## Routing Strategy
- HashRouter — `TrainingGuard` requires session in localStorage; `PlayGuard` requires completed training
## Game Shell State Machine
- `intro` → `playing` → `pass`/`fail` → `review` (review round for mistake codes)
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->
