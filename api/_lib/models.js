// Single place that decides which Claude model and settings each request uses.
// The browser only says WHAT it is asking for (_meta.mode / _meta.module);
// the server picks the model. Next model upgrade = change MODELS below.
//
// Files under api/_lib are not exposed as Vercel endpoints.

const MODELS = {
  smart: 'claude-sonnet-5-5', // explanations, exams, "No entendí"
  fast: 'claude-haiku-5-5', // classifier, quiz/tips, Lite mode, review questions, grading
};

// Previous models, used only if the new ones are rejected (e.g. not enabled on the account).
const LEGACY = {
  'claude-sonnet-5-5': 'claude-sonnet-4-6',
  'claude-haiku-5-5': 'claude-haiku-4-5-20251001',
};

// USD per million tokens. Haiku 5.5 doubles-up above 100k prompt tokens.
const PRICES = {
  'claude-sonnet-5-5': { in: 2, out: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  'claude-haiku-5-5': { in: 0.1, out: 0.5, cacheRead: 0.01, cacheWrite: 0.125, longIn: 0.5, longOut: 2.5, longFrom: 100000 },
  'claude-sonnet-4-6': { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

// Small JSON tasks get a schema so the answer always parses.
const SCHEMAS = {
  classifier: {
    type: 'object',
    properties: {
      module: { type: 'string', enum: ['math', 'stats', 'econ', 'finance'] },
      type: { type: 'string', enum: ['concept', 'problem'] },
    },
    required: ['module', 'type'],
    additionalProperties: false,
  },
  recall: {
    type: 'object',
    properties: { question: { type: 'string' }, modelAnswer: { type: 'string' } },
    required: ['question', 'modelAnswer'],
    additionalProperties: false,
  },
  feynman: {
    type: 'object',
    properties: {
      score: { type: 'integer' },
      nailed: { type: 'array', items: { type: 'string' } },
      missed: { type: 'array', items: { type: 'string' } },
      tip: { type: 'string' },
      verdict: { type: 'string' },
    },
    required: ['score', 'nailed', 'missed', 'tip', 'verdict'],
    additionalProperties: false,
  },
};

/*
 * Per task: which model tier, how hard it thinks (effort), whether it may think at all
 * (Sonnet 5.5 accepts "between_tools" = no extended thinking when there are no tools),
 * and the minimum room it needs to answer. New models count ~30% more tokens for the
 * same text, and thinking tokens come out of max_tokens, so limits are raised here.
 */
function taskProfile(meta) {
  const mode = String(meta.mode || '');
  const module = String(meta.module || '');
  if (module === 'classifier' || mode === 'classify') return { tier: 'fast', effort: 'low', floor: 1024, schema: 'classifier' };
  if (module === 'recall' || mode === 'recall') return { tier: 'fast', effort: 'low', floor: 2048, schema: 'recall' };
  if (module === 'feynman' || mode === 'feynman') return { tier: 'fast', effort: 'low', floor: 3000, schema: 'feynman' };
  if (mode === 'lite') return { tier: 'fast', effort: 'low', floor: 9000 };
  if (mode.endsWith('_haiku')) return { tier: 'fast', effort: 'low', floor: 6000 };
  if (mode === 'think') return { tier: 'smart', effort: 'medium', thinking: 'adaptive', floor: 24000 };
  if (mode === 'fast') return { tier: 'smart', effort: 'low', thinking: 'between_tools', floor: 12000 };
  if (mode === 'simplify') return { tier: 'smart', effort: 'low', thinking: 'between_tools', floor: 6000 };
  return null; // unknown: keep what the client asked for, just upgrade the model
}

function tierFromClientModel(model) {
  const m = String(model || '');
  if (m === 'fast' || m.includes('haiku')) return 'fast';
  return 'smart';
}

/**
 * Returns { body, model, fallbackBody } ready to send to the Messages API.
 * fallbackBody is the same request on the previous model without the new-only fields.
 */
function buildRequest(clientBody, meta) {
  const body = { ...clientBody };
  delete body._meta;
  // Not supported (or must be default) on the 5.5 models; the app never needed them.
  delete body.temperature; delete body.top_p; delete body.top_k;
  delete body.thinking; delete body.output_config; delete body.tools; delete body.tool_choice;

  const prof = taskProfile(meta);
  const tier = prof ? prof.tier : tierFromClientModel(body.model);
  const model = MODELS[tier];
  const requested = Number(body.max_tokens) || 4096;

  const fallbackBody = { ...body, model: LEGACY[model], max_tokens: Math.min(Math.max(requested, 1), 16000) };

  body.model = model;
  body.max_tokens = Math.min(Math.max(Math.ceil(requested * 1.35), prof ? prof.floor : 2048), 32000);
  const output_config = { effort: prof ? prof.effort : 'medium' };
  if (prof && prof.schema) output_config.format = { type: 'json_schema', schema: SCHEMAS[prof.schema] };
  body.output_config = output_config;
  if (prof && prof.thinking && model.includes('sonnet')) body.thinking = { type: prof.thinking };

  return { body, model, fallbackBody };
}

function estimateCost(model, usage) {
  const p = PRICES[model] || PRICES['claude-sonnet-5-5'];
  const inTok = usage.input_tokens || 0;
  const outTok = usage.output_tokens || 0;
  const cRead = usage.cache_read_input_tokens || 0;
  const cWrite = usage.cache_creation_input_tokens || 0;
  const long = p.longFrom && inTok + cRead + cWrite > p.longFrom;
  const inP = long ? p.longIn : p.in;
  const outP = long ? p.longOut : p.out;
  return (inTok * inP + outTok * outP + cRead * (p.cacheRead || 0) + cWrite * (p.cacheWrite || 0)) / 1_000_000;
}

/* Keep only text blocks (thinking blocks are empty by default and the app doesn't use them). */
function cleanResponse(data) {
  if (!data || !Array.isArray(data.content)) return data;
  return { ...data, content: data.content.filter((b) => b && b.type === 'text') };
}

module.exports = { MODELS, LEGACY, PRICES, SCHEMAS, taskProfile, buildRequest, estimateCost, cleanResponse };
