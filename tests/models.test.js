import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
const { buildRequest, estimateCost, cleanResponse, MODELS, PRICES } = createRequire(import.meta.url)('../api/_lib/models.js');

const msg = { messages: [{ role: 'user', content: 'hi' }], max_tokens: 1000, temperature: 0.7, model: 'whatever' };

describe('buildRequest', () => {
  it('the server picks the model by task, not the client', () => {
    expect(buildRequest(msg, { module: 'classifier' }).model).toBe(MODELS.fast);
    expect(buildRequest(msg, { mode: 'think' }).model).toBe(MODELS.smart);
  });
  it('removes fields the client should not control', () => {
    const { body } = buildRequest({ ...msg, _meta: { x: 1 }, tools: [] }, { mode: 'fast' });
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('_meta');
    expect(body).not.toHaveProperty('tools');
  });
  it('keeps max_tokens between the task floor and 32000', () => {
    expect(buildRequest(msg, { mode: 'think' }).body.max_tokens).toBe(24000);
    expect(buildRequest({ ...msg, max_tokens: 999999 }, { mode: 'fast' }).body.max_tokens).toBe(32000);
  });
  it('always has a fallback on the previous model', () => {
    expect(buildRequest(msg, { mode: 'fast' }).fallbackBody.model).toBeTruthy();
  });
});

describe('estimateCost', () => {
  it('prices input and output per million tokens', () => {
    const m = MODELS.fast; const p = PRICES[m];
    expect(estimateCost(m, { input_tokens: 50_000, output_tokens: 0 })).toBeCloseTo(p.in * 0.05, 8);
    expect(estimateCost(m, { input_tokens: 0, output_tokens: 50_000 })).toBeCloseTo(p.out * 0.05, 8);
  });
  it('uses long-context prices above the threshold', () => {
    const m = MODELS.fast; const p = PRICES[m];
    if (!p.longFrom) return;
    expect(estimateCost(m, { input_tokens: p.longFrom + 1, output_tokens: 0 })).toBeCloseTo((p.longFrom + 1) * p.longIn / 1e6, 8);
  });
  it('is zero for no usage', () => { expect(estimateCost(MODELS.smart, {})).toBe(0); });
});

it('cleanResponse keeps only text blocks', () => {
  const out = cleanResponse({ content: [{ type: 'thinking' }, { type: 'text', text: 'a' }] });
  expect(out.content).toEqual([{ type: 'text', text: 'a' }]);
});
