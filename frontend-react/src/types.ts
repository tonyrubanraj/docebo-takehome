export type Pace = 'ahead' | 'on_track' | 'behind' | 'no_target';

export type CourseProgress = {
  courseId: string;
  title: string;
  completionPercentage: number;
  lastActivityAt: string;
  status: 'in_progress';
  isStale?: boolean;
  dueAt: string | null;
  pace: Pace;
};

export type LearnerProgressResponse = {
  learnerId: number;
  courses: CourseProgress[];
};
