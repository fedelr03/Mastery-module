import { describe, it, expect } from 'vitest';
import { sanitizeMCQuestion } from '../src/module/quizUtils.js';

const q = (explanation, correctIndex = 0) => ({ type: 'mc', question: '?', options: ['5', '6', '8', '11'], correctIndex, explanation });

describe('sanitizeMCQuestion', () => {
  it('leaves clean questions alone', () => {
    const out = sanitizeMCQuestion(q('p\'(1) = 8.', 2));
    expect(out.correctIndex).toBe(2);
    expect(out.explanation).toBe('p\'(1) = 8.');
  });
  it('strips the model thinking out loud', () => {
    const out = sanitizeMCQuestion(q('p\'(1) = 8. Espera, revisá: la respuesta correcta es 8.', 2));
    expect(out.explanation).not.toMatch(/espera/i);
  });
  it('fixes correctIndex when the explanation names another option', () => {
    expect(sanitizeMCQuestion(q('Es 8, que es index 2.', 0)).correctIndex).toBe(2);
  });
  it('ignores things that are not multiple choice', () => {
    const tf = { type: 'tf', statement: 'x', answer: true };
    expect(sanitizeMCQuestion(tf)).toBe(tf);
  });
});
