import { useState } from 'react';
import { track } from './analytics';
import { CourseCard } from './CourseCard';
import type { CourseProgress } from './types';
import { useLearnerProgress } from './useLearnerProgress';

// Demo learners, each showing a different state of the page.
const LEARNER_OPTIONS = [
  { value: '1', label: 'Learner 1: mixed progress' },
  { value: '2', label: 'Learner 2: ahead of pace' },
  { value: '3', label: 'Learner 3: nothing in progress (empty state)' },
  { value: '999', label: 'Learner 999: unknown learner (404)' },
  { value: 'abc', label: 'Learner abc: invalid ID (400)' },
];
const SKELETON_COUNT = 3;

export function App() {
  const [learnerId, setLearnerId] = useState('1');
  const { data, error, loading, refetch } = useLearnerProgress(learnerId);

  const refresh = (source: 'refresh' | 'retry') => {
    track('progress_refreshed', { learnerId, source });
    refetch();
  };

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Docebo · pilot</p>
          <h1>My progress</h1>
        </div>
        <button type="button" onClick={() => refresh('refresh')} disabled={loading}>
          Refresh
        </button>
      </header>
      <p className="lede">In-progress courses for learner {learnerId}.</p>
      <div className="picker">
        <label htmlFor="learner-picker">Learner</label>
        <select
          id="learner-picker"
          value={learnerId}
          onChange={(event) => setLearnerId(event.target.value)}
          aria-describedby="learner-picker-hint"
        >
          {LEARNER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p id="learner-picker-hint" className="meta">
          Stand-in for a signed-in user; sent as x-authenticated-learner-id.
        </p>
      </div>
      {loading ? (
        <SkeletonList />
      ) : error ? (
        <div className="notice" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => refresh('retry')}>
            Retry
          </button>
        </div>
      ) : data && data.courses.length === 0 ? (
        <div className="notice">
          <p className="notice-title">You have no courses in progress</p>
          <p className="meta">When you start a course, it will appear here so you can pick up where you left off.</p>
        </div>
      ) : data ? (
        <CourseList courses={data.courses} />
      ) : null}
    </main>
  );
}

function SkeletonList() {
  return (
    <ul className="course-list" aria-busy="true" aria-label="Loading courses">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <li key={i} className="course">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta" />
        </li>
      ))}
    </ul>
  );
}

function CourseList({ courses }: { courses: CourseProgress[] }) {
  return (
    <ul className="course-list">
      {courses.map((course) => (
        <li key={course.courseId}>
          <CourseCard course={course} />
        </li>
      ))}
    </ul>
  );
}
