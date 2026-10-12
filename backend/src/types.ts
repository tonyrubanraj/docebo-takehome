/** Enrollment status in seed data — not necessarily what the API returns. */
export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed';

export interface Lesson {
  id: string;
  title: string;
  completed: boolean;
}

/** Raw enrollment record used by the in-memory store. */
export interface CourseEnrollment {
  courseId: string;
  title: string;
  learnerId: number;
  lessons: Lesson[];
  /** ISO-8601 timestamp of last learner activity on this course */
  lastActivityAt: string;
  status: EnrollmentStatus;
  /** ISO-8601 UTC timestamp of when the learner enrolled */
  enrolledAt: string;
  /** ISO-8601 UTC due date, if the course has one */
  dueAt?: string;
}

/** API response shape for a single in-progress course. */
export interface CourseProgress {
  courseId: string;
  title: string;
  completionPercentage: number;
  lastActivityAt: string;
  status: 'in_progress';
  /** Set when last activity is older than the stale threshold (see progressService). */
  isStale?: boolean;
}

export interface LearnerProgressResponse {
  learnerId: number;
  courses: CourseProgress[];
}
