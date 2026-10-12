import request from 'supertest';
import { createApp } from '../src/app';

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
