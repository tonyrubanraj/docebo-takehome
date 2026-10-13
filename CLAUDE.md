# Learner Progress MVP

Shows a learner's in-progress courses with completion % and last activity.

## Overview

The Learner Progress MVP has two parts: an Express + TypeScript API in `backend/` and a Vite + React + TypeScript UI in `frontend-react/`. The UI lists a learner's in-progress courses with completion percentage and last activity.

## Commands

Requires Node 20+. The API runs on port 3001 and the UI on 5173.

```bash
# Backend (backend/)
npm install
npm test                         # Jest + supertest, run once
npm run test:watch
npx jest -t "sorts courses"      # single test by name
npm run dev                      # tsx watch, http://localhost:3001
npm run build                    # tsc -> dist/

# Frontend (frontend-react/), start the backend first
npm install
npm run dev                      # Vite, http://localhost:5173
npm run build                    # tsc --noEmit && vite build (this is also the typecheck)
```

There is no linter and no frontend test setup.

## Architecture

**Backend** (`backend/src/`, CommonJS):

- `app.ts` exports `createApp()`, which tests import directly. Server startup lives separately in `index.ts`. The app has a stand-in auth middleware that reads the `x-authenticated-learner-id` header into `req.authenticatedLearnerId`, and a central error handler that maps `AppError` subclasses (`errors.ts`: `ValidationError` 400, `NotFoundError` 404, `ForbiddenError` 403) to `{ error: message }` JSON. Unknown routes return 404 `{ error: 'Not found' }`.
- `routes/progressRoutes.ts` serves `GET /api/learners/:learnerId/progress`. It returns 400 unless the ID is plain digits with no leading zero (`/^[1-9]\d*$/`) and a safe integer, then calls the service. The route deliberately does **not** compare `authenticatedLearnerId` with `:learnerId`. The commented `ForbiddenError` snippet in the route shows where that check would go.
- `services/progressService.ts` holds the business logic. `getInProgressCourses(learnerId, now = new Date())` throws `NotFoundError` for unknown learners, keeps only the learner's `in_progress` enrollments, and sorts them by `lastActivityAt` descending without mutating the seed. Each course gets `completionPercentage` from `computeCompletionPercentage` (lessons, rounded 0–100), `isStale` from `isEnrollmentStale` (more than `STALE_DAYS` = 30 days inactive), `dueAt` (`null` when none) and `pace`. Pass the injected `now` through to every time-based helper rather than relying on their `new Date()` defaults.
- Pace rule (the take-home's extra business rule): `computePace(enrolledAt, dueAt, completionPct, now)` is a pure function. Its early returns are, in order: no `dueAt` → `no_target`; `dueAt <= enrolledAt` → `no_target`; `now >= dueAt` → `behind`. Otherwise expected = elapsed share of the `enrolledAt` → `dueAt` window, clamped to 0–100 and not rounded. It returns `behind`/`ahead` when completion is more than `PACE_TOLERANCE_POINTS` (15) below/above expected, otherwise `on_track`. Unparseable dates fall through to `on_track`.
- `data/seed.ts` is the in-memory store. Every enrollment has `lastActivityAt` and `enrolledAt` (at or before last activity); `dueAt` is optional. All dates come from `daysAgo()` / `daysFromNow()` at import time, so stale, fresh, overdue and pace fixtures stay valid whenever the code runs. `knownLearnerIds` is derived from the enrollments, so adding a learner means adding an enrollment for them. Expected results: learner 1 returns 3 courses (onboarding `on_track`, leadership `no_target`, compliance `behind` and stale), learner 2 returns 1 (safety `ahead`), learner 3 is known but has only a completed course so returns 200 with `courses: []`, and learner 999 returns 404.
- `types.ts` separates the raw `CourseEnrollment` (seed shape) from the `CourseProgress` / `LearnerProgressResponse` API shapes. `Pace` lives here and is re-exported from `progressService.ts`.

**Contract**: `backend/tests/progress.api.test.ts` is the starter's contract and must not be edited. `progress.extra.test.ts` holds our additions (strict learner ID validation, the learner 3 empty case, `pace` and `dueAt` in the response). API tests go through HTTP via supertest against `createApp()`, not by calling the service directly. The one exception is `pace.test.ts`, which unit-tests the pure `computePace` with fixed ISO dates and never the real clock.

**Frontend** (`frontend-react/src/`): `App.tsx` has a labelled learner picker (`LEARNER_OPTIONS`: 1 mixed, 2 ahead of pace, 3 empty, 999 → 404, abc → 400; default `'1'`) that stands in for a signed-in user and drives `useLearnerProgress`. It renders four states: loading (3 skeleton cards, `aria-busy`), error (message plus Retry calling `refetch`), empty ("You have no courses in progress") and the course list. A Refresh button in the header also calls `refetch`. Each course renders through `CourseCard.tsx`, which keeps its own formatting helpers. A card shows a `role="progressbar"` bar with the percentage as text, "Last active …" (`Intl.RelativeTimeFormat` with `numeric: 'always'`, truncated so it never overstates, inside `<time>` with the full local date as `title`), a pace badge whose text label carries the meaning (none for `no_target`), the Inactive badge, and "Due <date>" when `dueAt` is set. `useLearnerProgress.ts` sends `x-authenticated-learner-id`, aborts on cleanup, ignores `AbortError`, and shows the API's `{ error }` message. An empty 5xx or a rejected fetch shows "Can't reach the progress service…", because the Vite proxy answers an empty 500 when the backend is down. It fetches through the Vite proxy (`vite.config.ts` forwards `/api` and `/health` to :3001), so keep URLs relative. `src/types.ts` is a hand-maintained copy of the backend response types, including `Pace`, `dueAt` and `pace`. If you change the API shape, update both.

## Rules

- Propose a plan and wait for approval before writing code
- Never edit existing tests to make them pass; fix the code
- Write tests for new behaviour before implementing it
- Seed dates must be relative (`daysAgo` / `daysFromNow`), never absolute
- Keep this file up to date when behaviour, the API shape, seed fixtures or conventions change
- Small diffs, one concern per change
- No new dependencies without asking
- Errors: keep the starter's `{ "error": "<message>" }` shape and correct status codes
- Out of scope: Full LMS course authoring or admin panels, Real authentication/SSO integration, Multi-tenant isolation, Mobile apps, Production deployment infrastructure, A second major flow (Continue, course player, catalog)

## Git

- Only commit when I ask. Never push, amend or force-push unless I ask.
- Conventional Commits: `<type>(<scope>): <imperative summary>`, ≤ 72 chars, no trailing period
  - types: feat, fix, test, refactor, docs, chore, ci
  - scopes: api, seed, ui, analytics, docs
- One concern per commit. Run `npm test` in backend/ (and `npm run build` in frontend-react/ for UI changes) first; every commit must be green.
- Stage files by name; never `git add -A`. Never stage node_modules, dist, .DS_Store.
- Add a body only when the "why" isn't obvious; wrap at 72.
- Show me the staged diff and the proposed message before committing.
