import { db } from './index';

export interface DailyStat {
  date: string; // YYYY-MM-DD
  count: number; // e.g. number of sessions
  accuracy: number;
}

// Get the top difficult words
export async function getDifficultWords(limit: number = 10) {
  const errors = await db.wordErrors.toArray();
  const wordCounts: Record<string, number> = {};
  
  errors.forEach(err => {
    const w = err.expectedWord.toLowerCase();
    wordCounts[w] = (wordCounts[w] || 0) + 1;
  });

  const sorted = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
    
  return sorted;
}

// Get the current streak of consecutive days practiced
export async function getCurrentStreak(): Promise<number> {
  const sessions = await db.sessions.orderBy('startedAt').reverse().toArray();
  if (sessions.length === 0) return 0;

  const uniqueDays = new Set<string>();
  sessions.forEach(s => {
    uniqueDays.add(new Date(s.startedAt).toISOString().split('T')[0]);
  });

  const sortedDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a)); // Descending YYYY-MM-DD
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
    return 0; // Streak broken
  }

  let streak = 1;
  let currentDate = new Date(sortedDays[0]);

  for (let i = 1; i < sortedDays.length; i++) {
    const prevDate = new Date(currentDate.getTime() - 86400000);
    const expectedStr = prevDate.toISOString().split('T')[0];
    
    if (sortedDays[i] === expectedStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

// Get daily stats for a heatmap (last N days)
export async function getDailyStats(days: number = 90): Promise<DailyStat[]> {
  const cutoff = Date.now() - (days * 86400000);
  const sessions = await db.sessions
    .where('startedAt')
    .aboveOrEqual(cutoff)
    .toArray();

  const dayMap: Record<string, { count: number, totalAcc: number, countAcc: number }> = {};
  
  sessions.forEach(s => {
    const date = new Date(s.startedAt).toISOString().split('T')[0];
    if (!dayMap[date]) {
      dayMap[date] = { count: 0, totalAcc: 0, countAcc: 0 };
    }
    dayMap[date].count += 1;
    if (s.accuracy > 0) {
      dayMap[date].totalAcc += s.accuracy;
      dayMap[date].countAcc += 1;
    }
  });

  const result: DailyStat[] = [];
  
  // Fill in the last N days even if empty
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (i * 86400000)).toISOString().split('T')[0];
    const stat = dayMap[d];
    result.push({
      date: d,
      count: stat ? stat.count : 0,
      accuracy: stat && stat.countAcc > 0 ? Math.round(stat.totalAcc / stat.countAcc) : 0
    });
  }

  return result.reverse(); // Chronological order
}

export async function getOverviewStats() {
  const sessions = await db.sessions.toArray();
  const totalPracticeTime = sessions.reduce((acc, s) => acc + (s.endedAt - s.startedAt), 0); // ms
  
  let validAccSessions = 0;
  const totalAcc = sessions.reduce((acc, s) => {
    if (s.accuracy >= 0) {
      validAccSessions++;
      return acc + s.accuracy;
    }
    return acc;
  }, 0);
  
  const avgAccuracy = validAccSessions > 0 ? Math.round(totalAcc / validAccSessions) : 0;
  const totalLessonsCompleted = new Set(sessions.map(s => s.lessonId)).size;

  return {
    totalTimeMs: totalPracticeTime,
    lessonsCompleted: totalLessonsCompleted,
    avgAccuracy,
    totalSessions: sessions.length
  };
}
