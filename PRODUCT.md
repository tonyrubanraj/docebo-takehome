# Product Notes

## User problem

Learners enrolled in several courses at once lose track of where they left off. Progress is scattered across course pages, so a course started weeks ago drifts out of mind until a deadline is close or already missed. They need one place that shows what is in progress, how far along each course is, and which ones need attention now.

## MVP scope

- **API** `GET /api/learners/:learnerId/progress` returns only in-progress courses, most recent activity first, each with:
  - completion % and last activity
  - an `isStale` flag (no activity for more than 30 days)
  - `dueAt` and a `pace` flag (the extra rule)
- **Validation:**
  - 400 for malformed learner IDs, 404 for unknown learners, all as `{ "error": "<message>" }`
  - a known learner with nothing in progress gets 200 with an empty list
- **"My progress" page** with loading, error (with Retry) and empty states.
  - Each course card shows a progress bar, "Last active …", a pace badge, an Inactive badge and the due date.
- **Learner picker** as an auth stub, plus a Refresh button.
- **Analytics:** `course_progress_viewed` and `progress_refreshed` as structured console events.
- **Feature flag** `VITE_FLAG_PACE` to hide the pace badge.
- **31 backend tests**, including 13 for the pace rule.

## Extra business rule

**Pace against a due date.** Each in-progress course gets `pace`: `ahead`, `on_track`, `behind` or `no_target`.

- **Expected progress** = share of time elapsed from `enrolledAt` to `dueAt`, clamped to 0–100%. Example: 20 days into a 40-day window, expected is 50%.
- **Ahead / behind:** completion more than **15 points** above or below expected. Anything in between is `on_track`.
- **Past due:** `behind`, even at 90% complete. The deadline has been missed.
- **No target:** `no_target` when there is no due date, or the due date is not after enrolment. Nothing to measure against, so no badge is shown.

**Why it matters:**

- **Learners:** "Last active" says when they stopped, not whether they are in trouble. Pace turns a due date into a clear signal ("Behind") early enough to act, before the course is overdue.
- **Admins and managers:** "behind" is the population to nudge for compliance and mandatory training. "Ahead" learners can be left alone.

**How it's tested:**

- **`backend/tests/pace.test.ts`:** 10 unit tests on the pure `computePace` function with fixed dates:
  - each `no_target` case
  - past due at 90%
  - exactly ±15 points (`on_track`) and ±16 points (`ahead` / `behind`)
  - `now` before enrolment (clamped)
  - enrolled today at 0%
- **`backend/tests/progress.extra.test.ts`:** 3 API tests that check the seed returns `on_track`, `no_target`, `behind` and `ahead` for the right courses, and that `dueAt` is returned or `null`.

## What I intentionally cut

| Cut                                                   | Why                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Filter or sort the list by pace ("show Behind first") | Validate that learners notice and act on the badge before adding controls around it                                              |
| Real persistence (database)                           | In-memory seed data proves the slice. Pace needs only two date fields that a real LMS already stores                             |
| Frontend automated tests                              | Needs new dependencies (Vitest, Testing Library). Business logic is tested in the backend; UI states were checked in the browser |
| Configurable tolerance or non-linear pace curves      | One fixed, explainable rule (15 points, linear) is enough to learn whether pace is useful                                        |

## Success metric

- **Metric name:** 7-day resume rate.
- **How you'd measure it:**
  - Among learners who fire `course_progress_viewed`, the share who log new lesson activity on one of the listed courses within 7 days of the view.
  - Join the analytics event (`learnerId`, `ts`) to LMS activity events.
  - Compare against a holdout group that does not see the page.
- **What "good" looks like in the first 30 days:**
  - The viewer group resumes at a rate at least 10 percentage points higher than the holdout.
  - Courses shown as **Behind** recover at least as well as the rest.
  - Course completion rates do not fall.

## Assumptions

| Topic                     | Choice and reasoning                                                                                                                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistence               | In-memory seed data. Dates use `daysAgo` / `daysFromNow` relative to server start, so stale, overdue and pace fixtures never drift                                                                                                                                                    |
| Auth                      | A learner picker in the UI stands in for a signed-in user and sends the ID as `x-authenticated-learner-id`. The API deliberately does not check it, as the brief asks. The real check would go in the route: compare it with `:learnerId` and return 403 `{ "error": … }` on mismatch |
| Completion formula        | Completed lessons ÷ total lessons, rounded to 0–100. Every lesson weighs the same because the seed has no durations                                                                                                                                                                   |
| Stale                     | Last activity more than 30 days ago (the starter's rule)                                                                                                                                                                                                                              |
| Pace                      | Linear expected progress from `enrolledAt` to `dueAt`, with a 15-point tolerance so small gaps don't flip the badge. Past due is `behind` regardless of completion                                                                                                                    |
| Learner IDs               | Only plain positive integers are valid. `1.0`, `1e0`, `0x1`, `" 1"` and numbers too large to store exactly are rejected (400), so each learner has exactly one URL                                                                                                                    |
| Known learner, no courses | 200 with `courses: []`, not 404. The learner exists and the UI shows an empty state                                                                                                                                                                                                   |
| Time zones                | The API returns UTC ISO-8601. The UI shows local dates. "Last active" rounds down ("1 month ago", never overstating)                                                                                                                                                                  |
| Analytics format          | A stub client that writes one `[analytics]` JSON line per event to the console. `course_progress_viewed` fires once per successful load (also under React StrictMode). `progress_refreshed` records whether Refresh or Retry was clicked                                              |
| Extra API fields          | `dueAt` (`null` when none) and `pace` are added to each course. They are additive, so existing consumers are unaffected                                                                                                                                                               |
| Feature flag              | `VITE_FLAG_PACE=false` hides the pace badge at build time. This allows shipping the badge to a subset of users first                                                                                                                                                                  |

## What I'd build next

- **Run the experiment:** a page-level flag with a holdout group, plus a `course_selected` event, so the 7-day resume rate can be measured as defined.
- **Real data:** read `enrolledAt`, `dueAt` and lesson activity from the LMS, so the experiment runs on real learners.
- **Make Behind actionable:** sort Behind courses first and show what it takes to catch up (e.g. "2 lessons a week to finish on time").
- **A pace filter in the UI,** once we know learners act on the badge.
