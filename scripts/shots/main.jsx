/* Screenshot harness: the real app, signed in as an example account, with Supabase and the AI replaced by fixtures. */
import { REVIEW_QA } from './fixtures';

const params = new URLSearchParams(location.search);
localStorage.setItem('mm_lang', params.get('lang') || 'es');
localStorage.setItem('mm_dark', params.get('theme') === 'dark' ? 'true' : 'false');
localStorage.setItem('mm_interest', params.get('lang') === 'en' ? 'football' : 'fútbol');
localStorage.setItem('mm_mode', 'fast');

const realFetch = window.fetch.bind(window);
window.fetch = async (url, init) => {
  if (String(url).includes('/api/claude')) {
    const text = JSON.stringify({ question: REVIEW_QA.question, modelAnswer: REVIEW_QA.modelAnswer });
    return new Response(JSON.stringify({ content: [{ type: 'text', text }] }), { headers: { 'Content-Type': 'application/json' } });
  }
  return realFetch(url, init);
};

await import('../../src/main.jsx');
