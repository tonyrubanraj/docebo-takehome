# Learner Progress MVP

A "My progress" page that lists a learner's in-progress courses with completion, last activity, and a **pace** flag (ahead / on track / behind a due date), so they can pick up where they left off.

- **Backend:** Express + TypeScript API in [`backend/`](./backend/README.md)
- **Frontend:** Vite + React + TypeScript in [`frontend-react/`](./frontend-react/README.md) (the React starter; Angular was not used)
- **Docs:** [`PRODUCT.md`](./PRODUCT.md) (scope, extra rule, metric, assumptions) · [`AI_USAGE.md`](./AI_USAGE.md) · [`SPEC.md`](./SPEC.md) (the brief)

## Prerequisites

- Node.js 20+ and npm
- Ports 3001 (API) and 5173 (UI) free

## Run it (4 commands, two terminals)

```bash
# Terminal 1: API on http://localhost:3001
cd backend && npm install && npm run dev

# Terminal 2: UI on http://localhost:5173
cd frontend-react && npm install && npm run dev
```

Open http://localhost:5173.

## Demo

Use the **Learner** picker at the top of the page. Each option shows a different case:

| Option | What you see |
|--------|--------------|
| Learner 1: mixed progress | 3 courses: one **On track** with a due date, one with no due date (no pace badge), one **Behind** and **Inactive** |
| Learner 2: ahead of pace | 1 course marked **Ahead** |
| Learner 3: nothing in progress | Empty state |
| Learner 999: unknown learner | Error state: "Learner 999 not found" with Retry |
| Learner abc: invalid ID | Error state: "Invalid learner ID: abc" with Retry |

Also try:

- **Refresh** (top right) re-fetches the list.
- **Stop the API** and click Refresh to see "Can't reach the progress service. Is the backend running?"
- **Analytics:** open the browser console to see `[analytics]` JSON lines for `course_progress_viewed` and `progress_refreshed`.
- **Feature flag:** start the UI with `VITE_FLAG_PACE=false npm run dev` to hide the pace badge.

## Tests

```bash
cd backend && npm test   # 31 Jest + supertest tests
```

The frontend has no test runner; `npm run build` in `frontend-react/` is the typecheck.

## Project layout

```
.
├── backend/          Express API, in-memory seed data, Jest tests
├── frontend-react/   React UI (the one frontend used)
├── README.md         This file: how to run and demo
├── PRODUCT.md        Product notes
├── AI_USAGE.md       How AI was used
├── CLAUDE.md         Project rules and architecture notes for the AI coding assistant
└── SPEC.md           Take-home brief
```

## Known limitations

- **Auth is a stub.** The UI sends the picked ID as `x-authenticated-learner-id`; the API does not yet check it against the URL (see `PRODUCT.md`).
- **Data is in-memory seed data.** Dates are relative to server start, so the demo always looks the same.
- **No frontend automated tests or CI.** The UI was checked manually in the browser.
