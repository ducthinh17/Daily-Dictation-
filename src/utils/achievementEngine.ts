import { db } from '../db';
import { awardXP } from './xpEngine';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  xpReward: number;
  category: 'lessons' | 'streaks' | 'accuracy' | 'shadowing' | 'xp' | 'time' | 'vocab' | 'quests' | 'bookmarks';
  tier: 1 | 2 | 3 | 4 | 5;
  reqAmount: number;
  isHidden?: boolean; // Secret achievements
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  // Lessons
  'lessons_1': { id: 'lessons_1', title: 'First Step', description: 'Complete your first lesson', icon: 'Target', color: 'primary', xpReward: 100, category: 'lessons', tier: 1, reqAmount: 1 },
  'lessons_10': { id: 'lessons_10', title: 'Getting Serious', description: 'Complete 10 lessons', icon: 'Star', color: 'primary', xpReward: 250, category: 'lessons', tier: 2, reqAmount: 10 },
  'lessons_50': { id: 'lessons_50', title: 'Iron Ear', description: 'Complete 50 lessons', icon: 'Award', color: 'primary', xpReward: 500, category: 'lessons', tier: 3, reqAmount: 50 },
  'lessons_100': { id: 'lessons_100', title: 'Dictation Master', description: 'Complete 100 lessons', icon: 'Crown', color: 'primary', xpReward: 1000, category: 'lessons', tier: 4, reqAmount: 100 },
  'lessons_500': { id: 'lessons_500', title: 'Legendary Listener', description: 'Complete 500 lessons', icon: 'Diamond', color: 'primary', xpReward: 5000, category: 'lessons', tier: 5, reqAmount: 500 },

  // Streaks
  'streak_3': { id: 'streak_3', title: 'Consistent', description: 'Achieve a 3-day practice streak', icon: 'Flame', color: 'warning', xpReward: 100, category: 'streaks', tier: 1, reqAmount: 3 },
  'streak_7': { id: 'streak_7', title: 'Relentless', description: 'Achieve a 7-day practice streak', icon: 'Flame', color: 'warning', xpReward: 300, category: 'streaks', tier: 2, reqAmount: 7 },
  'streak_14': { id: 'streak_14', title: 'Unstoppable', description: 'Achieve a 14-day practice streak', icon: 'Flame', color: 'warning', xpReward: 500, category: 'streaks', tier: 3, reqAmount: 14 },
  'streak_30': { id: 'streak_30', title: 'Habitual', description: 'Achieve a 30-day practice streak', icon: 'Flame', color: 'warning', xpReward: 1000, category: 'streaks', tier: 4, reqAmount: 30 },
  'streak_100': { id: 'streak_100', title: 'Century', description: 'Achieve a 100-day practice streak', icon: 'Flame', color: 'warning', xpReward: 5000, category: 'streaks', tier: 5, reqAmount: 100 },

  // Accuracy
  'acc_perfect_1': { id: 'acc_perfect_1', title: 'Perfectionist', description: 'Achieve 100% accuracy in a session', icon: 'CheckCircle', color: 'success', xpReward: 150, category: 'accuracy', tier: 1, reqAmount: 1 },
  'acc_perfect_10': { id: 'acc_perfect_10', title: 'Sharp Shooter', description: 'Achieve 100% accuracy in 10 sessions', icon: 'Crosshair', color: 'success', xpReward: 500, category: 'accuracy', tier: 2, reqAmount: 10 },
  'acc_perfect_50': { id: 'acc_perfect_50', title: 'Flawless', description: 'Achieve 100% accuracy in 50 sessions', icon: 'Zap', color: 'success', xpReward: 1500, category: 'accuracy', tier: 3, reqAmount: 50 },

  // Shadowing
  'shadow_1': { id: 'shadow_1', title: 'Echo', description: 'Complete a shadowing segment perfectly (100%)', icon: 'Mic', color: 'info', xpReward: 150, category: 'shadowing', tier: 1, reqAmount: 1 },
  'shadow_10': { id: 'shadow_10', title: 'Voice Actor', description: 'Complete 10 shadowing segments perfectly', icon: 'Mic2', color: 'info', xpReward: 400, category: 'shadowing', tier: 2, reqAmount: 10 },
  'shadow_50': { id: 'shadow_50', title: 'Native Speaker', description: 'Complete 50 shadowing segments perfectly', icon: 'Radio', color: 'info', xpReward: 1000, category: 'shadowing', tier: 3, reqAmount: 50 },

  // XP Gains
  'xp_1k': { id: 'xp_1k', title: 'XP Gatherer', description: 'Earn 1,000 XP', icon: 'Coins', color: 'secondary', xpReward: 100, category: 'xp', tier: 1, reqAmount: 1000 },
  'xp_10k': { id: 'xp_10k', title: 'XP Hoarder', description: 'Earn 10,000 XP', icon: 'Wallet', color: 'secondary', xpReward: 500, category: 'xp', tier: 2, reqAmount: 10000 },
  'xp_50k': { id: 'xp_50k', title: 'XP Millionaire', description: 'Earn 50,000 XP', icon: 'Banknote', color: 'secondary', xpReward: 1000, category: 'xp', tier: 3, reqAmount: 50000 },

  // Vocab Mastery
  'vocab_10': { id: 'vocab_10', title: 'Word Collector', description: 'Master 10 words in Review', icon: 'BookOpen', color: 'success', xpReward: 200, category: 'vocab', tier: 1, reqAmount: 10 },
  'vocab_50': { id: 'vocab_50', title: 'Vocab Master', description: 'Master 50 words in Review', icon: 'Library', color: 'success', xpReward: 500, category: 'vocab', tier: 2, reqAmount: 50 },
  'vocab_100': { id: 'vocab_100', title: 'Walking Dictionary', description: 'Master 100 words in Review', icon: 'BookA', color: 'success', xpReward: 1000, category: 'vocab', tier: 3, reqAmount: 100 },

  // Quests
  'quest_10': { id: 'quest_10', title: 'Quest Hunter', description: 'Complete 10 daily goals', icon: 'Swords', color: 'danger', xpReward: 300, category: 'quests', tier: 1, reqAmount: 10 },
  'quest_50': { id: 'quest_50', title: 'Quest Master', description: 'Complete 50 daily goals', icon: 'Shield', color: 'danger', xpReward: 800, category: 'quests', tier: 2, reqAmount: 50 },

  // Bookmarks
  'bookmark_10': { id: 'bookmark_10', title: 'Librarian', description: 'Bookmark 10 sentences', icon: 'Bookmark', color: 'info', xpReward: 100, category: 'bookmarks', tier: 1, reqAmount: 10 },
  'bookmark_50': { id: 'bookmark_50', title: 'Curator', description: 'Bookmark 50 sentences', icon: 'BookmarkPlus', color: 'info', xpReward: 300, category: 'bookmarks', tier: 2, reqAmount: 50 },
  
  // Time-based (Hidden initially, trigger dynamically)
  'time_night': { id: 'time_night', title: 'Night Owl', description: 'Practice between midnight and 4 AM', icon: 'Moon', color: 'secondary', xpReward: 200, category: 'time', tier: 1, reqAmount: 1, isHidden: true },
  'time_early': { id: 'time_early', title: 'Early Bird', description: 'Practice between 5 AM and 8 AM', icon: 'Sun', color: 'warning', xpReward: 200, category: 'time', tier: 1, reqAmount: 1, isHidden: true },
};

/**
 * Event-driven check for achievements
 */
export async function checkAchievements(event: 'lesson_complete' | 'shadowing_perfect' | 'xp_gained' | 'word_mastered' | 'quest_completed' | 'bookmark_added') {
  const profile = await db.userProfile.get('me');
  if (!profile) return;

  const unlockedBadges = await db.achievements.toArray();
  const unlockedIds = new Set(unlockedBadges.map(b => b.badgeId));

  const checkAndUnlock = async (achIds: string[], currentVal: number) => {
    for (const id of achIds) {
      const ach = ACHIEVEMENTS[id];
      if (!ach) continue;
      
      if (!unlockedIds.has(id) && currentVal >= ach.reqAmount) {
        await unlockAchievement(id, ach);
      }
    }
  };

  try {
    if (event === 'lesson_complete' || event === 'xp_gained') {
      const sessionsCount = await db.sessions.count();
      await checkAndUnlock(['lessons_1', 'lessons_10', 'lessons_50', 'lessons_100', 'lessons_500'], sessionsCount);
      
      const perfectSessions = await db.sessions.where('accuracy').equals(100).count();
      await checkAndUnlock(['acc_perfect_1', 'acc_perfect_10', 'acc_perfect_50'], perfectSessions);

      await checkAndUnlock(['xp_1k', 'xp_10k', 'xp_50k'], profile.totalXP);

      // Check time-based
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 4) {
        await checkAndUnlock(['time_night'], 1);
      } else if (hour >= 5 && hour < 8) {
        await checkAndUnlock(['time_early'], 1);
      }
    }

    if (event === 'word_mastered') {
      const masteredCount = await db.masteredWords.count();
      await checkAndUnlock(['vocab_10', 'vocab_50', 'vocab_100'], masteredCount);
    }

    if (event === 'quest_completed') {
      // For now we don't have a history of completed quests, 
      // but assuming we'll add it or we can count from xpLogs
      const completedGoals = await db.dailyGoals.where('isCompleted').equals(1).count();
      await checkAndUnlock(['quest_10', 'quest_50'], completedGoals);
    }

    if (event === 'bookmark_added') {
      const bookmarkCount = await db.audioBookmarks.count();
      await checkAndUnlock(['bookmark_10', 'bookmark_50'], bookmarkCount);
    }

    // Streaks would ideally be calculated based on daily logins
    // We can calculate current streak by looking at distinct days in xpLog
    const logs = await db.xpLog.orderBy('timestamp').reverse().toArray();
    let currentStreak = calculateStreak(logs);
    await checkAndUnlock(['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_100'], currentStreak);

  } catch (error) {
    console.error('Failed to check achievements:', error);
  }
}

function calculateStreak(logs: { timestamp: number }[]): number {
  if (logs.length === 0) return 0;
  
  const uniqueDays = new Set(logs.map(log => new Date(log.timestamp).setHours(0,0,0,0)));
  const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a); // descending
  
  let streak = 0;
  let currentDate = new Date().setHours(0,0,0,0);
  
  for (let i = 0; i < sortedDays.length; i++) {
    const logDay = sortedDays[i];
    
    // Allow today or yesterday as the start of the streak
    if (i === 0 && logDay < currentDate - 86400000) {
      break; // The last activity was more than a day ago
    }

    if (i === 0) {
      streak = 1;
      currentDate = logDay;
    } else {
      if (logDay === currentDate - 86400000) {
        streak++;
        currentDate = logDay;
      } else {
        break; // Gap in days
      }
    }
  }
  
  return streak;
}

async function unlockAchievement(id: string, ach: AchievementDef) {
  // Add to unlocked
  await db.achievements.add({
    id: crypto.randomUUID(),
    badgeId: id,
    unlockedAt: Date.now()
  });

  // Gamification (Reward XP for unlocking an achievement)
  await awardXP({
    type: 'achievement_unlocked',
    metadata: {
      overrideAmount: ach.xpReward,
      achievementId: id,
      achievementTitle: ach.title
    }
  });

  // Fire global event to show toast notification
  window.dispatchEvent(new CustomEvent('achievement_unlocked', { detail: ach }));
}
