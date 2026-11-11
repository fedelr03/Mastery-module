import { describe, it, expect } from 'vitest';
import { sm2Update, isDue, masteryLevel } from '../src/srs.js';

const card = (o = {}) => ({ interval: 0, ease_factor: 2.5, repetitions: 0, ...o });

describe('sm2Update', () => {
  it('first good review schedules for tomorrow and starts learning', () => {
    const r = sm2Update(card(), 3);
    expect(r).toMatchObject({ interval: 1, repetitions: 1, status: 'learning' });
  });
  it('second good review jumps to 6 days and moves to review', () => {
    expect(sm2Update(card({ interval: 1, repetitions: 1 }), 3)).toMatchObject({ interval: 6, repetitions: 2, status: 'review' });
  });
  it('later good reviews multiply by the ease', () => {
    expect(sm2Update(card({ interval: 10, repetitions: 3 }), 3).interval).toBe(25);
  });
  it('"Good" keeps the ease and "Easy" raises it', () => {
    expect(sm2Update(card({ interval: 6, repetitions: 2 }), 3).ease_factor).toBe(2.5);
    expect(sm2Update(card({ interval: 6, repetitions: 2 }), 4).ease_factor).toBe(2.6);
  });
  it('"Hard" only stretches the gap a little and does not reset', () => {
    const r = sm2Update(card({ interval: 10, repetitions: 3 }), 2);
    expect(r.interval).toBe(12);
    expect(r.repetitions).toBe(4);
  });
  it('"Forgot" resets the streak to 1 day and never drops ease below 1.3', () => {
    const r = sm2Update(card({ interval: 30, repetitions: 5, ease_factor: 1.3 }), 1);
    expect(r).toMatchObject({ interval: 1, repetitions: 0, status: 'learning', ease_factor: 1.3 });
  });
  it('schedules next_review_at interval days ahead', () => {
    const r = sm2Update(card({ interval: 1, repetitions: 1 }), 3);
    const days = (new Date(r.next_review_at) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(5.99); expect(days).toBeLessThan(6.01);
  });
});

describe('isDue / masteryLevel', () => {
  const past = new Date(Date.now() - 1000).toISOString();
  const future = new Date(Date.now() + 86_400_000).toISOString();
  it('suspended cards are never due', () => {
    expect(isDue({ status: 'suspended', next_review_at: past })).toBe(false);
  });
  it('levels follow interval and ease', () => {
    expect(masteryLevel(null)).toBe('none');
    expect(masteryLevel({ next_review_at: past })).toBe('due');
    expect(masteryLevel({ next_review_at: future, interval: 3 })).toBe('learning');
    expect(masteryLevel({ next_review_at: future, interval: 8 })).toBe('reviewing');
    expect(masteryLevel({ next_review_at: future, interval: 25, ease_factor: 2.5 })).toBe('mastered');
  });
});
