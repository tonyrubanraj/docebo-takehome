import type { CourseProgress } from './types';
import { useLearnerProgress } from './useLearnerProgress';

const LEARNER_ID = '1';
const SKELETON_COUNT = 3;

export function App() {
  const { data, error, loading, refetch } = useLearnerProgress(LEARNER_ID);

  return (
    <main className="page">
      <p className="eyebrow">Docebo · pilot</p>
      <h1>My progress</h1>
      <p className="lede">In-progress courses for learner {LEARNER_ID}.</p>
      {loading ? (
        <SkeletonList />
      ) : error ? (
        <div className="notice" role="alert">
          <p>{error}</p>
          <button type="button" onClick={refetch}>
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
        <li key={course.courseId} className="course">
          <h2>{course.title}</h2>
          <p className="meta">
            {course.completionPercentage}% · {course.lastActivityAt}
          </p>
          {course.isStale ? <span className="badge">Inactive</span> : null}
        </li>
      ))}
    </ul>
  );
}
