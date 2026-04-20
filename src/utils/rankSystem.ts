export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | 'grandmaster' | 'legend';

export interface RankInfo {
  tier: Tier;
  title: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  gradient: string;
  icon: string; // lucide icon name or emoji
}

export const RANKS: RankInfo[] = [
  {
    tier: 'bronze',
    title: 'Novice Listener',
    minLevel: 1,
    maxLevel: 5,
    color: '#cd7f32',
    gradient: 'linear-gradient(135deg, #e3a678, #cd7f32, #a66526)',
    icon: '🥉'
  },
  {
    tier: 'silver',
    title: 'Keen Listener',
    minLevel: 6,
    maxLevel: 10,
    color: '#c0c0c0',
    gradient: 'linear-gradient(135deg, #e5e7eb, #9ca3af, #6b7280)',
    icon: '🥈'
  },
  {
    tier: 'gold',
    title: 'Sharp Ear',
    minLevel: 11,
    maxLevel: 20,
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #fef08a, #eab308, #a16207)',
    icon: '🥇'
  },
  {
    tier: 'diamond',
    title: 'Audio Ace',
    minLevel: 21,
    maxLevel: 35,
    color: '#00ffff',
    gradient: 'linear-gradient(135deg, #67e8f9, #06b6d4, #0891b2)',
    icon: '💎'
  },
  {
    tier: 'master',
    title: 'Dictation Master',
    minLevel: 36,
    maxLevel: 50,
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #d8b4fe, #a855f7, #7e22ce)',
    icon: '👑'
  },
  {
    tier: 'grandmaster',
    title: 'Sound Scholar',
    minLevel: 51,
    maxLevel: 75,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #fca5a5, #ef4444, #b91c1c)',
    icon: '🔥'
  },
  {
    tier: 'legend',
    title: 'Legendary Linguist',
    minLevel: 76,
    maxLevel: 100, // Or Infinity
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #fbcfe8, #ec4899, #be185d, #6d28d9)',
    icon: '⚡'
  }
];

export function getRankForLevel(level: number): RankInfo {
  for (const rank of RANKS) {
    if (level >= rank.minLevel && level <= rank.maxLevel) {
      return rank;
    }
  }
  // Fallback to legend if level > 100
  return RANKS[RANKS.length - 1];
}

// Level-up formula: XP_needed = level * 800 + (level^1.5 * 100)
// Returns total XP required from 0 to reach `level`
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let l = 1; l < level; l++) {
    totalXP += Math.floor(l * 800 + Math.pow(l, 1.5) * 100);
  }
  return totalXP;
}

export function getNextLevelProgress(currentXP: number, currentLevel: number): { xpRequired: number, xpProgress: number, percent: number } {
  const currentLevelBaseXP = getXPForLevel(currentLevel);
  const nextLevelBaseXP = getXPForLevel(currentLevel + 1);
  
  const xpRequiredForNextLevel = nextLevelBaseXP - currentLevelBaseXP;
  const xpProgressInCurrentLevel = currentXP - currentLevelBaseXP;
  const percent = Math.min(100, Math.max(0, (xpProgressInCurrentLevel / xpRequiredForNextLevel) * 100));
  
  return {
    xpRequired: xpRequiredForNextLevel,
    xpProgress: xpProgressInCurrentLevel,
    percent
  };
}

export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  while (getXPForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
}
