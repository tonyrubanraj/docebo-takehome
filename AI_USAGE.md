# AI Usage

## Tools used

- **Claude Code** in VS Code: wrote the code, tests and docs, ran tests and builds, checked the UI in a headless browser, and prepared each commit for my approval.
- **A separate AI chat assistant:** helped me draft the step-by-step prompts I gave Claude Code.

## What AI helped with

| Area             | How AI was used                                                                                                                                              | Your involvement                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Project rules    | Followed the rules in `CLAUDE.md`: plan first, tests before code, never edit the contract tests, small commits, show the diff before committing              | Set the rules, approved every commit, and had `CLAUDE.md` kept up to date as the code changed                                                  |
| Service logic    | Implemented `getInProgressCourses()` to pass the starter tests                                                                                               | Specified filter, mapping, sort and "don't mutate the seed"; reviewed the diff                                                                 |
| Input validation | Compared live API behaviour for 12 tricky IDs against the spec, found that `1.0`, `1e0`, `0x1`, `" 1"` and huge IDs were accepted, then fixed it tests-first | Picked the cases to check and the fix (`/^[1-9]\d*$/` plus safe-integer check)                                                                 |
| Pace rule        | Wrote 10 boundary tests, then `computePace`, then wired it into the API with 3 API tests                                                                     | Designed the rule: order of checks, linear expected %, 15-point tolerance, past due = behind; chose the test cases and fixed dates             |
| Seed data        | Added `enrolledAt` / `dueAt` and learner 3                                                                                                                   | Chose the dates for the courses that drive the pace demo and required relative dates only; asked for a check that no absolute dates slipped in |
| Frontend         | Wrote the fetch hook, the four page states, course cards, learner picker, Refresh, feature flag and CSS                                                      | Specified abort handling, error messages, accessibility (progress bar roles, text labels on badges) and picker options                         |
| Analytics        | Added the stub `track` client and both events                                                                                                                | Chose the events and props, and required `course_progress_viewed` to fire exactly once under React StrictMode                                  |
| Verification     | Ran tests and builds; checked the API with curl and every UI state in headless Chrome                                                                        | Reviewed the results and the final requirements report                                                                                         |
| Docs             | Drafted the READMEs, this file and `PRODUCT.md`                                                                                                              | Chose the success metric and reviewed the content                                                                                              |

## What you rejected or rewrote

- **"Last active" wording:** AI rounded to the nearest unit, so 54 days showed as "2 months ago". I chose to round down so it never overstates. I then rejected "last week / last month" wording in favour of "1 week ago / 1 month ago", which reads unambiguously.

## What you'd do differently without AI

Writing the docs by hand would have taken a large part of the 2-hour budget, so I would have prioritised the required states and the pace rule over the feature flag and the second analytics event.

## Ownership statement

I understand every part of this submission and can change it live:

- **Backend:** the route's ID validation, the service's filter, sort, stale and pace logic, `computePace` and its tests, and the seed data.
- **Frontend:** the `useLearnerProgress` hook (abort handling, error messages, refetch), the page states in `App.tsx`, `CourseCard` formatting, the analytics events and the feature flag.
