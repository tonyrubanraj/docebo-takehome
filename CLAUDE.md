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
- `services/progressService.ts` holds the business logic. `getInProgressCourses()` ships as an intentionally incomplete stub: it returns completed and not-started courses, never sets `isStale`, and doesn't sort. It must filter to `in_progress`, compute completion from lessons (rounded 0–100), set `isStale` when last activity is more than `STALE_DAYS` (30) ago, and sort by `lastActivityAt` descending. The helpers `computeCompletionPercentage` and `isEnrollmentStale` are already there.
- `data/seed.ts` is the in-memory store. Its timestamps come from `daysAgo()` at import time, so stale and fresh fixtures stay valid whenever the code runs. `knownLearnerIds` is derived from the enrollments, so adding a learner means adding an enrollment for them. Expected results: learner 1 returns 3 courses, learner 2 returns 1, and learner 999 returns 404.
- `types.ts` separates the raw `CourseEnrollment` (seed shape) from the `CourseProgress` / `LearnerProgressResponse` API shapes.

**Contract**: `backend/tests/progress.api.test.ts` defines the expected API behavior. Tests go through HTTP via supertest against `createApp()`, not by calling the service directly.

**Frontend** (`frontend-react/src/`): a single `App.tsx` with a hardcoded `LEARNER_ID`. It handles only the happy path so far, with no real loading, error, or empty states. It fetches through the Vite proxy (`vite.config.ts` forwards `/api` and `/health` to :3001), so keep URLs relative. `src/types.ts` is a hand-maintained copy of the backend response types. If you change the API shape, update both.

## Rules

- Propose a plan and wait for approval before writing code
- Never edit existing tests to make them pass; fix the code
- Write tests for new behaviour before implementing it
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
