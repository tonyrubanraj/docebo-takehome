import request from 'supertest';
import { createApp } from '../src/app';
import { enrollments } from '../src/data/seed';

describe('GET /api/learners/:learnerId/progress learner ID validation', () => {
  const app = createApp();

  it.each([
    ['1.0'],
    ['1e0'],
    ['0x1'],
    ['%201'],
    ['0'],
    ['-1'],
    ['1.5'],
    ['9007199254740993'],
  ])('returns 400 for non-canonical or out-of-range id %s', async (rawId) => {
    const res = await request(app).get(`/api/learners/${rawId}/progress`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid learner id/i);
  });

  it('returns 200 for a canonical id', async () => {
    const res = await request(app).get('/api/learners/1/progress');
    expect(res.status).toBe(200);
    expect(res.body.learnerId).toBe(1);
  });
});

describe('GET /api/learners/:learnerId/progress for a learner with nothing in progress', () => {
  const app = createApp();

  it('returns 200 with an empty course list for known learner 3', async () => {
    const res = await request(app).get('/api/learners/3/progress');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ learnerId: 3, courses: [] });
  });
});

describe('GET /api/learners/:learnerId/progress pace', () => {
  const app = createApp();

  const paceByCourse = async (learnerId: number) => {
    const res = await request(app).get(`/api/learners/${learnerId}/progress`);
    return Object.fromEntries(
      res.body.courses.map((c: { courseId: string; pace: string }) => [c.courseId, c.pace]),
    );
  };

  it('sets pace for each of learner 1 in-progress courses', async () => {
    expect(await paceByCourse(1)).toEqual({
      'course-onboarding': 'on_track', // expected 20/40 days = 50; 50% done
      'course-leadership': 'no_target', // no dueAt
      'course-compliance': 'behind', // due 10 days ago
    });
  });

  it('sets pace ahead for learner 2 course-safety', async () => {
    // expected 10/40 days = 25; 50% done > 25 + 15
    expect(await paceByCourse(2)).toEqual({ 'course-safety': 'ahead' });
  });

  it('returns dueAt from the seed, or null when the course has none', async () => {
    const res = await request(app).get('/api/learners/1/progress');
    const dueAtByCourse = Object.fromEntries(
      res.body.courses.map((c: { courseId: string; dueAt: string | null }) => [c.courseId, c.dueAt]),
    );
    const seedDueAt = (courseId: string) => enrollments.find((e) => e.courseId === courseId)?.dueAt;

    expect(dueAtByCourse['course-onboarding']).toBe(seedDueAt('course-onboarding'));
    expect(dueAtByCourse['course-compliance']).toBe(seedDueAt('course-compliance'));
    expect(dueAtByCourse['course-leadership']).toBeNull();
  });
});
