import { useCallback, useEffect, useState } from 'react';
import { track } from './analytics';
import type { LearnerProgressResponse } from './types';

const UNREACHABLE_MESSAGE = "Can't reach the progress service. Is the backend running?";

export type LearnerProgressState = {
  data: LearnerProgressResponse | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
};

export function useLearnerProgress(learnerId: string): LearnerProgressState {
  const [data, setData] = useState<LearnerProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Bumped by refetch() so the effect re-runs for the same learnerId.
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      let res: Response;
      try {
        res = await fetch(`/api/learners/${encodeURIComponent(learnerId)}/progress`, {
          headers: { 'x-authenticated-learner-id': learnerId },
          signal: controller.signal,
        });
      } catch (err) {
        if (isAbortError(err)) return;
        fail(UNREACHABLE_MESSAGE);
        return;
      }

      const body: unknown = await res.json().catch(() => null);
      if (controller.signal.aborted) return;

      if (!res.ok) {
        fail(errorMessageFrom(body, res.status));
        return;
      }
      const progress = body as LearnerProgressResponse;
      // Fired here, after the abort check, so only the request that wins is
      // counted: StrictMode's discarded first mount and superseded requests
      // are aborted and return above.
      track('course_progress_viewed', {
        learnerId,
        courseCount: progress.courses.length,
        behindCount: progress.courses.filter((course) => course.pace === 'behind').length,
        staleCount: progress.courses.filter((course) => course.isStale).length,
      });
      setData(progress);
      setLoading(false);
    }

    function fail(message: string) {
      setData(null);
      setError(message);
      setLoading(false);
    }

    void load();
    return () => controller.abort();
  }, [learnerId, requestCount]);

  const refetch = useCallback(() => setRequestCount((count) => count + 1), []);

  return { data, error, loading, refetch };
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function errorMessageFrom(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  // The Vite dev proxy answers an empty 500 when the backend is down, so a 5xx
  // without the API's { error } body means the service itself is unreachable.
  return status >= 500 ? UNREACHABLE_MESSAGE : `Request failed with status ${status}`;
}
