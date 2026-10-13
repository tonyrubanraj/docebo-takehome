import { computePace } from '../src/services/progressService';

// Fixed 100-day window (2026 is not a leap year): Jan 1 + 31 + 28 + 31 + 10 days = Apr 11.
const ENROLLED_AT = '2026-01-01T00:00:00.000Z';
const DUE_AT = '2026-04-11T00:00:00.000Z';
// Day 50 of the window: Jan 1 + 31 + 19 days = Feb 20.
const MIDPOINT = new Date('2026-02-20T00:00:00.000Z');

describe('computePace', () => {
  it('returns no_target when there is no dueAt', () => {
    // No window, so expected is undefined.
    expect(computePace(ENROLLED_AT, undefined, 50, MIDPOINT)).toBe('no_target');
  });

  it('returns no_target when dueAt equals enrolledAt', () => {
    // Window = 0 days, so expected would divide by zero. Checked before past-due:
    // now is after dueAt here, which would otherwise be behind.
    expect(computePace(ENROLLED_AT, ENROLLED_AT, 50, MIDPOINT)).toBe('no_target');
  });

  it('returns no_target when dueAt is before enrolledAt', () => {
    // Window = Dec 22 − Jan 1 = −10 days. Checked before past-due: now is after dueAt.
    expect(computePace(ENROLLED_AT, '2025-12-22T00:00:00.000Z', 50, MIDPOINT)).toBe('no_target');
  });

  it('returns behind when past due even at 90%', () => {
    // now = Apr 21 >= dueAt. Without this rule, expected = clamp(110 / 100) × 100 = 100,
    // and 90 >= 100 − 15 would be on_track.
    expect(computePace(ENROLLED_AT, DUE_AT, 90, new Date('2026-04-21T00:00:00.000Z'))).toBe(
      'behind',
    );
  });

  it('returns on_track at exactly expected − 15', () => {
    // expected = 50 / 100 × 100 = 50; 35 < 50 − 15 = 35 is false.
    expect(computePace(ENROLLED_AT, DUE_AT, 35, MIDPOINT)).toBe('on_track');
  });

  it('returns behind at expected − 16', () => {
    // expected = 50 / 100 × 100 = 50; 34 < 50 − 15 = 35.
    expect(computePace(ENROLLED_AT, DUE_AT, 34, MIDPOINT)).toBe('behind');
  });

  it('returns on_track at exactly expected + 15', () => {
    // expected = 50 / 100 × 100 = 50; 65 > 50 + 15 = 65 is false.
    expect(computePace(ENROLLED_AT, DUE_AT, 65, MIDPOINT)).toBe('on_track');
  });

  it('returns ahead at expected + 16', () => {
    // expected = 50 / 100 × 100 = 50; 66 > 50 + 15 = 65.
    expect(computePace(ENROLLED_AT, DUE_AT, 66, MIDPOINT)).toBe('ahead');
  });

  it('clamps expected to 0 when now is before enrolledAt', () => {
    // now = Dec 22 = day −10: expected = clamp(−10 / 100, 0, 1) × 100 = 0; 10 > 0 + 15 is false.
    // Unclamped, expected = −10 and 10 > −10 + 15 = 5 would be ahead.
    expect(computePace(ENROLLED_AT, DUE_AT, 10, new Date('2025-12-22T00:00:00.000Z'))).toBe(
      'on_track',
    );
  });

  it('returns on_track for a learner who enrolled today at 0%', () => {
    // now = enrolledAt = day 0: expected = 0 / 100 × 100 = 0; 0 is within 0 ± 15.
    expect(computePace(ENROLLED_AT, DUE_AT, 0, new Date(ENROLLED_AT))).toBe('on_track');
  });
});
