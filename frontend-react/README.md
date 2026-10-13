# Frontend — React UI

Vite + React + TypeScript. Shows the "My progress" page from `GET /api/learners/:id/progress` through the Vite proxy.

**Requires Node.js 20+.**

## Quick start

Run the backend first (`cd ../backend && npm run dev`), then from this folder:

```bash
npm install
npm run dev
```

Open the URL Vite prints (http://localhost:5173).

Run with `VITE_FLAG_PACE=false npm run dev` to hide the pace badge.

`npm run build` typechecks and builds. There is no frontend test runner.

## What's on the page

- **Learner picker:** stands in for a signed-in user. The chosen ID is sent as `x-authenticated-learner-id`. Options cover mixed progress (1), ahead of pace (2), empty (3), unknown learner (999) and invalid ID (abc).
- **Refresh** button that re-fetches the list.
- **States:**
  - Loading: 3 skeleton cards (`aria-busy="true"`)
  - Error: the API's message, or "Can't reach the progress service…" when the backend is down, with a Retry button
  - Empty: "You have no courses in progress"
- **Course card:**
  - Progress bar with the percentage as text
  - "Last active 2 days ago", with the full local date on hover
  - **Pace** badge (Ahead / On track / Behind, none when there is no due date)
  - **Inactive** badge when stale
  - "Due <date>" when there is a due date
- **Analytics:** `[analytics]` JSON lines in the browser console:
  - `course_progress_viewed` once per successful load
  - `progress_refreshed` when Refresh or Retry is clicked

## Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Page, learner picker and the four states |
| `src/useLearnerProgress.ts` | Fetch hook: abort on cleanup, error messages, `refetch` |
| `src/CourseCard.tsx` | One course card and its date formatting |
| `src/analytics.ts` | Stub analytics client (`track`) |
| `src/flags.ts` | Feature flags from Vite env vars |
| `src/types.ts` | Copy of the API response types |

## Proxy

`vite.config.ts` forwards `/api` and `/health` to `http://localhost:3001`. Keep using relative `/api/...` URLs so the interviewer can run both processes locally.

When the backend is down, the proxy answers an empty 500; the UI shows that as "Can't reach the progress service".
