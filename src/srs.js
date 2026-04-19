/* ═══════════════════════════════════════════════════
   srs.js  —  SM-2 Spaced Repetition for Mastery Module
   ═══════════════════════════════════════════════════
   Import anywhere:
     import { sm2Update, isDue, getDueCount } from './srs';
*/

/**
 * sm2Update — applies the SM-2 algorithm to a card after a review session.
 *
 * @param {object} card    - current card row from review_cards
 * @param {number} rating  - 1=Blackout, 2=Hard, 3=Good, 4=Easy
 * @returns {object}       - fields to PATCH back to Supabase
 */
export function sm2Update(card, rating) {
  let { interval, ease_factor, repetitions } = card;

  if (rating < 3) {
    // Failed — reset streak, short retry interval
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0)      interval = 1;
    else if (repetitions === 1) interval = 6;
    else                        interval = Math.round(interval * ease_factor);

    repetitions += 1;
  }

  // Ease factor update — clamped to minimum 1.3
  ease_factor = Math.max(
    1.3,
    ease_factor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)
  );

  const status = repetitions >= 2 ? 'review' : 'learning';
  const next_review_at = new Date(Date.now() + interval * 86_400_000).toISOString();
  const last_reviewed_at = new Date().toISOString();

  return {
    interval,
    ease_factor: parseFloat(ease_factor.toFixed(2)),
    repetitions,
    status,
    next_review_at,
    last_reviewed_at,
  };
}

/**
 * isDue — returns true if a card is due for review right now.
 *
 * @param {object} card - review_cards row
 * @returns {boolean}
 */
export function isDue(card) {
  if (card.status === 'suspended') return false;
  return new Date(card.next_review_at) <= new Date();
}

/**
 * getDueCount — how many cards in an array are due today.
 *
 * @param {Array} cards - array of review_cards rows
 * @returns {number}
 */
export function getDueCount(cards) {
  return cards.filter(isDue).length;
}

/**
 * addCard — inserts a new review card into Supabase.
 * Returns the inserted row or null on error.
 *
 * @param {object} supabase         - supabase client
 * @param {object} param1
 *   @param {string} userId
 *   @param {string} topic
 *   @param {string} module
 *   @param {string} lang
 *   @param {string} level
 *   @param {string|null} studyHistoryId
 * @returns {object|null}
 */
export async function addCard(supabase, { userId, topic, module, lang, level, studyHistoryId = null }) {
  // Guard: don't add duplicates
  const { data: existing } = await supabase
    .from('review_cards')
    .select('id')
    .eq('user_id', userId)
    .ilike('topic', topic.trim())
    .neq('status', 'suspended')
    .maybeSingle();

  if (existing) return { alreadyExists: true, card: existing };

  const { data, error } = await supabase
    .from('review_cards')
    .insert({
      user_id:          userId,
      topic:            topic.trim(),
      module:           module || 'general',
      lang:             lang   || 'es',
      level:            level  || 'intermediate',
      study_history_id: studyHistoryId,
    })
    .select()
    .single();

  if (error) { console.error('addCard error:', error); return null; }
  return { alreadyExists: false, card: data };
}

/**
 * reviewCard — patches a card in Supabase after an SM-2 review.
 *
 * @param {object} supabase - supabase client
 * @param {string} cardId   - review_cards.id
 * @param {number} rating   - 1–4
 * @param {object} card     - current card fields (interval, ease_factor, repetitions)
 * @returns {object|null}   - updated card row
 */
export async function reviewCard(supabase, cardId, rating, card) {
  const updates = sm2Update(card, rating);

  const { data, error } = await supabase
    .from('review_cards')
    .update(updates)
    .eq('id', cardId)
    .select()
    .single();

  if (error) { console.error('reviewCard error:', error); return null; }
  return data;
}
