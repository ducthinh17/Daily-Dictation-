import { db } from '../db';
import { awardXP } from './xpEngine';
import { updateGoalProgress } from './questEngine';

export interface SRSCard {
  id: string; // word or sentence id
  word: string;
  nextReviewAt: number;
  repetitions: number;
  easinessFactor: number;
  interval: number; // in days
  lastReviewedAt: number;
}

// SM-2 Algorithm Implementation
export function calculateNextReview(
  quality: number, // 0-5 scale (0: blackout, 3: bare success, 5: perfect)
  repetitions: number,
  easinessFactor: number,
  interval: number
): { nextReviewAt: number; repetitions: number; easinessFactor: number; interval: number } {
  let nextEasinessFactor = easinessFactor;
  let nextInterval = interval;
  let nextRepetitions = repetitions;

  if (quality >= 3) {
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * easinessFactor);
    }
    nextRepetitions += 1;
  } else {
    nextRepetitions = 0;
    nextInterval = 1;
  }

  nextEasinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (nextEasinessFactor < 1.3) nextEasinessFactor = 1.3;

  const nextReviewAt = Date.now() + nextInterval * 24 * 60 * 60 * 1000;

  return { nextReviewAt, repetitions: nextRepetitions, easinessFactor: nextEasinessFactor, interval: nextInterval };
}

export async function processReview(word: string, quality: number) {
  return await db.transaction('rw', db.srsCards, async () => {
    let card = await db.srsCards.where('word').equals(word.toLowerCase()).first();
    
    if (!card) {
      card = {
        id: crypto.randomUUID(),
        word: word.toLowerCase(),
        nextReviewAt: 0,
        repetitions: 0,
        easinessFactor: 2.5,
        interval: 0,
        lastReviewedAt: Date.now()
      };
    }

    const nextState = calculateNextReview(quality, card.repetitions, card.easinessFactor, card.interval);
    
    card.nextReviewAt = nextState.nextReviewAt;
    card.repetitions = nextState.repetitions;
    card.easinessFactor = nextState.easinessFactor;
    card.interval = nextState.interval;
    card.lastReviewedAt = Date.now();

    await db.srsCards.put(card);

    // Gamification
    if (quality >= 3) {
      await awardXP({
        type: 'review_word',
        metadata: { accuracy: quality === 5 ? 100 : quality * 20 }
      });
      await updateGoalProgress('review_words', 1);
    }
    
    // Mastered logic (e.g. interval > 21 days is considered mastered)
    if (card.interval > 21) {
      await db.masteredWords.put({
        id: crypto.randomUUID(),
        word: card.word,
        masteredAt: Date.now()
      });
    }

    return card;
  });
}

export async function getDueCards(limit: number = 20) {
  const now = Date.now();
  return await db.srsCards
    .where('nextReviewAt')
    .belowOrEqual(now)
    .limit(limit)
    .toArray();
}

export async function getNewCards(words: string[]) {
    // Generate new cards for words that are not yet in srsCards
    const existingCards = await db.srsCards.where('word').anyOfIgnoreCase(words).toArray();
    const existingWords = new Set(existingCards.map(c => c.word.toLowerCase()));
    
    return words.filter(w => !existingWords.has(w.toLowerCase())).map(w => ({
        id: crypto.randomUUID(),
        word: w.toLowerCase(),
        nextReviewAt: Date.now(),
        repetitions: 0,
        easinessFactor: 2.5,
        interval: 0,
        lastReviewedAt: 0
    }));
}
