import { Router, type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../errors';
import { getInProgressCourses } from '../services/progressService';
import type { LearnerProgressResponse } from '../types';

export const progressRouter = Router();

progressRouter.get(
  '/learners/:learnerId/progress',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const learnerId = parseLearnerId(req.params.learnerId);

      // Fictional trust boundary: req.authenticatedLearnerId (set by the
      // stand-in middleware in app.ts) is what a real check would compare
      // against `learnerId` before returning data — this starter does not
      // enforce it on purpose. e.g.:
      //   if (req.authenticatedLearnerId !== undefined && req.authenticatedLearnerId !== learnerId) {
      //     throw new ForbiddenError(`Learner ${req.authenticatedLearnerId} cannot access learner ${learnerId}'s progress`);
      //   }

      const courses = getInProgressCourses(learnerId);
      const body: LearnerProgressResponse = { learnerId, courses };
      res.json(body);
    } catch (error) {
      next(error);
    }
  },
);

function parseLearnerId(raw: string | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) {
    throw new ValidationError('Invalid learner ID: missing');
  }
  // Canonical digits only: Number() alone would accept "1.0", "1e0", "0x1" and " 1".
  const learnerId = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(learnerId)) {
    throw new ValidationError(`Invalid learner ID: ${value}`);
  }
  return learnerId;
}
