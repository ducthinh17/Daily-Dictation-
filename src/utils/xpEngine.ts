import { db } from '../db';
import { calculateLevelFromXP, getRankForLevel } from './rankSystem';

export interface XPEvent {
  type: 
    | 'segment_complete' 
    | 'lesson_complete' 
    | 'shadowing' 
    | 'streak' 
    | 'review_word' 
    | 'daily_goal' 
    | 'weekly_quest' 
    | 'first_daily' 
    | 'bookmark_review';
  metadata?: {
    accuracy?: number;
    attempts?: number;
    streakDays?: number;
    perfect?: boolean;
    isFirstTry?: boolean;
  };
}

export function calculateXP(event: XPEvent): number {
  let baseXP = 0;
  let multiplier = 1;

  switch (event.type) {
    case 'segment_complete':
      baseXP = event.metadata?.isFirstTry ? 20 : 10;
      if (event.metadata?.perfect) multiplier = 1.5;
      break;
    
    case 'lesson_complete':
      baseXP = 50;
      if (event.metadata?.accuracy === 100) multiplier = 2.0;
      break;

    case 'shadowing':
      if (event.metadata?.accuracy && event.metadata.accuracy >= 90) {
        baseXP = 15;
      } else if (event.metadata?.accuracy && event.metadata.accuracy >= 70) {
        baseXP = 8;
      }
      break;

    case 'streak':
      baseXP = 25;
      const streakDays = event.metadata?.streakDays || 1;
      multiplier = Math.min(streakDays * 0.1 + 1, 3.0); // max 3x
      break;

    case 'review_word':
      baseXP = 5;
      break;

    case 'daily_goal':
      baseXP = 30;
      break;

    case 'weekly_quest':
      baseXP = 100;
      break;

    case 'first_daily':
      baseXP = 10;
      break;

    case 'bookmark_review':
      baseXP = 3;
      break;
  }

  return Math.round(baseXP * multiplier);
}

export async function awardXP(event: XPEvent): Promise<{ earnedXP: number, leveledUp: boolean, newLevel: number }> {
  const earnedXP = calculateXP(event);
  if (earnedXP === 0) {
    return { earnedXP: 0, leveledUp: false, newLevel: 0 };
  }

  // Use a transaction to ensure atomic updates
  return await db.transaction('rw', db.userProfile, db.xpLog || db.table('xpLog'), async () => {
    let profile = await db.userProfile.get('me');
    
    if (!profile) {
      profile = {
        id: 'me',
        totalXP: 0,
        currentLevel: 1,
        title: 'Novice Listener',
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
      await db.userProfile.add(profile);
    }

    const oldLevel = profile.currentLevel;
    const newTotalXP = profile.totalXP + earnedXP;
    const newLevel = calculateLevelFromXP(newTotalXP);
    
    const leveledUp = newLevel > oldLevel;
    
    let newTitle = profile.title;
    if (leveledUp) {
      const newRank = getRankForLevel(newLevel);
      newTitle = newRank.title;
    }

    await db.userProfile.update('me', {
      totalXP: newTotalXP,
      currentLevel: newLevel,
      title: newTitle,
      lastUpdated: Date.now()
    });

    // Log the event if xpLog exists (version 8)
    if (db.tables.some(t => t.name === 'xpLog')) {
      await db.table('xpLog').add({
        id: crypto.randomUUID(),
        type: event.type,
        amount: earnedXP,
        metadata: event.metadata,
        timestamp: Date.now()
      });
    }

    return { earnedXP, leveledUp, newLevel };
  });
}
