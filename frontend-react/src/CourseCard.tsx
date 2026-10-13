import { FLAGS } from './flags';
import type { CourseProgress, Pace } from './types';

const PACE_LABELS: Record<Exclude<Pace, 'no_target'>, string> = {
  ahead: 'Ahead',
  on_track: 'On track',
  behind: 'Behind',
};

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' });
const fullDateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' });
const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
// Largest unit first; the first one the gap reaches is used.
const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * DAY_MS],
  ['month', 30 * DAY_MS],
  ['week', 7 * DAY_MS],
  ['day', DAY_MS],
  ['hour', 60 * MINUTE_MS],
  ['minute', MINUTE_MS],
];

export function CourseCard({ course }: { course: CourseProgress }) {
  const { title, completionPercentage, lastActivityAt, isStale, pace, dueAt } = course;
  const showPace = FLAGS.paceBadge && pace !== 'no_target';

  return (
    <article className="course">
      <h2>{title}</h2>
      <div className="progress-row">
        <div
          className="progress"
          role="progressbar"
          aria-label={`${title} completion`}
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-fill" style={{ width: `${completionPercentage}%` }} />
        </div>
        <span className="progress-value">{completionPercentage}%</span>
      </div>
      <p className="meta">
        Last active{' '}
        <time dateTime={lastActivityAt} title={fullDateTime.format(new Date(lastActivityAt))}>
          {formatRelative(lastActivityAt, Date.now())}
        </time>
        {dueAt ? (
          <>
            {' · Due '}
            <time dateTime={dueAt} title={fullDateTime.format(new Date(dueAt))}>
              {shortDate.format(new Date(dueAt))}
            </time>
          </>
        ) : null}
      </p>
      {showPace || isStale ? (
        <div className="badges">
          {showPace ? (
            <span className={`badge badge-pace-${pace}`}>{PACE_LABELS[pace]}</span>
          ) : null}
          {isStale ? <span className="badge">Inactive</span> : null}
        </div>
      ) : null}
    </article>
  );
}

function formatRelative(iso: string, nowMs: number): string {
  const diffMs = new Date(iso).getTime() - nowMs;
  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (Math.abs(diffMs) >= unitMs) {
      // trunc rounds toward zero, so 54 days reads "1 month ago", never "2 months ago".
      return relativeTime.format(Math.trunc(diffMs / unitMs), unit);
    }
  }
  return 'just now';
}
