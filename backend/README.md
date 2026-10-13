# Backend — TypeScript API

Express + TypeScript API for the Learner Progress MVP. It serves a learner's in-progress courses with completion, last activity, a stale flag, and a pace flag. The UI lives in [`frontend-react/`](../frontend-react/README.md).

## Quick start

```bash
cd backend
npm install
npm test          # 31 tests, all passing
npm run dev       # http://localhost:3001
```

Other scripts: `npm run build` (compile to `dist/`), `npm run test:watch`.

## API

### `GET /health`

Returns `{ "status": "ok" }`.

### `GET /api/learners/:learnerId/progress`

Returns in-progress courses for a learner, most recent activity first.

**Success (200):**

```json
{
  "learnerId": 1,
  "courses": [
    {
      "courseId": "course-leadership",
      "title": "Leadership Essentials",
      "completionPercentage": 33,
      "lastActivityAt": "2026-08-22T09:15:00.000Z",
      "status": "in_progress",
      "isStale": false,
      "dueAt": null,
      "pace": "no_target"
    },
    {
      "courseId": "course-onboarding",
      "title": "New Hire Onboarding",
      "completionPercentage": 50,
      "lastActivityAt": "2026-08-20T09:15:00.000Z",
      "status": "in_progress",
      "isStale": false,
      "dueAt": "2026-09-13T09:15:00.000Z",
      "pace": "on_track"
    }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `completionPercentage` | Completed lessons ÷ total lessons, rounded, 0–100 |
| `lastActivityAt` | ISO-8601 UTC timestamp of the learner's last activity |
| `isStale` | `true` when last activity is more than 30 days ago |
| `dueAt` | ISO-8601 UTC due date, or `null` when the course has none |
| `pace` | `ahead`, `on_track`, `behind` or `no_target` (see below) |

**Pace rule.** Expected progress is the share of time elapsed between enrolment and `dueAt`. A course is `ahead` or `behind` when completion is more than 15 points above or below that, otherwise `on_track`. It is `behind` once past due, and `no_target` when there is no due date or the due date is not after enrolment.

A learner who exists but has nothing in progress gets `200` with `"courses": []`.

**Errors** (always `{ "error": "<message>" }`):

| Status | When |
|--------|------|
| 400 | Invalid learner ID: not a positive integer in plain digits (no leading zeros, decimals, exponents, hex or whitespace) or above `Number.MAX_SAFE_INTEGER` |
| 404 | Unknown learner (not in seed data) |
| 404 | Unknown route, including an empty learner ID (`/api/learners//progress`) |

## Implementation

- `src/routes/progressRoutes.ts` validates the learner ID and calls the service.
- `src/services/progressService.ts` filters to `in_progress`, computes completion, `isStale` and `pace`, and sorts by `lastActivityAt` descending. `computePace` is a pure function; the current time is passed in so tests control it.
- `src/data/seed.ts` is the in-memory store.
- The `x-authenticated-learner-id` header is read into `req.authenticatedLearnerId` but deliberately not enforced, as the brief intends; the commented `ForbiddenError` check in the route shows where it would go.

## Tests

| File | Covers |
|------|--------|
| `tests/progress.api.test.ts` | The starter contract (unchanged): filtering, fields, stale flag, sort, 400 and 404 |
| `tests/progress.extra.test.ts` | Strict ID validation, learner 3 empty list, `pace` and `dueAt` in the response |
| `tests/pace.test.ts` | `computePace` rules and boundaries with fixed dates |

## Seed data

`src/data/seed.ts` sets every date relative to server start (`daysAgo` / `daysFromNow`), so the demo looks the same whenever it runs.

- **Learner 1:** 3 in-progress (onboarding `on_track`, leadership `no_target`, compliance `behind` and stale), 1 completed, 1 not started. The API returns 3.
- **Learner 2:** 1 in-progress (safety `ahead`), 1 completed. The API returns 1.
- **Learner 3:** only a completed course. The API returns 200 with an empty list.
- **Learner 999:** does not exist (404).

## CORS

Enabled for all origins so any local frontend dev server can call the API during development.

## Repo layout

See the [project layout in the root README](../README.md#project-layout).

## Frontend integration

The React app proxies `/api` to `http://localhost:3001`. It fetches:

```
GET /api/learners/:learnerId/progress
x-authenticated-learner-id: <learnerId>
```

Learner 1 is the default demo; learner 2 shows a course ahead of pace; learner 3 shows the empty state; learner 999 and `abc` show error states.
