import { enrollments, knownLearnerIds } from '../data/seed';
import { NotFoundError } from '../errors';
import type { CourseEnrollment, CourseProgress } from '../types';

/** Days without activity before a course is considered stale (business rule hint). */
export const STALE_DAYS = 30;

/**
 * Return in-progress courses for a learner, sorted by last activity (most recent first).
 * Throws NotFoundError when the learner does not exist in seed data.
 */
export function getInProgressCourses(learnerId: number, now: Date = new Date()): CourseProgress[] {
  if (!knownLearnerIds.has(learnerId)) {
    throw new NotFoundError(`Learner ${learnerId} not found`);
  }

  // filter() returns a new array, so sorting it leaves the seed untouched.
  return enrollments
    .filter((enrollment) => enrollment.learnerId === learnerId && enrollment.status === 'in_progress')
    .map((enrollment) => toCourseProgress(enrollment, now))
    .sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt));
}

export function computeCompletionPercentage(enrollment: CourseEnrollment): number {
  if (enrollment.lessons.length === 0) {
    return 0;
  }
  const completed = enrollment.lessons.filter((lesson) => lesson.completed).length;
  return Math.round((completed / enrollment.lessons.length) * 100);
}

export function isEnrollmentStale(lastActivityAt: string, now: Date = new Date()): boolean {
  const lastActivity = new Date(lastActivityAt);
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > STALE_DAYS;
}

function toCourseProgress(enrollment: CourseEnrollment, now: Date): CourseProgress {
  return {
    courseId: enrollment.courseId,
    title: enrollment.title,
    completionPercentage: computeCompletionPercentage(enrollment),
    lastActivityAt: enrollment.lastActivityAt,
    status: 'in_progress',
    isStale: isEnrollmentStale(enrollment.lastActivityAt, now),
  };
}
