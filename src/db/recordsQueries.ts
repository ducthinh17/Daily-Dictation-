import { db } from './index';

export interface PersonalRecords {
  bestAccuracy: { value: number; lessonTitle: string } | null;
  longestStreak: number;
  mostXPInDay: { value: number; date: string } | null;
  mostLessonsInDay: { value: number; date: string } | null;
  totalWordsTyped: number;
  totalSegmentsCompleted: number;
}

function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function getPersonalRecords(): Promise<PersonalRecords> {
  const sessions = await db.sessions.toArray();
  const lessons = await db.lessons.toArray();
  const xpLogs = await db.xpLog.toArray();
  const progress = await db.progress.toArray();

  // Best accuracy
  let bestAccuracy: PersonalRecords['bestAccuracy'] = null;
  sessions.forEach(s => {
    if (!bestAccuracy || s.accuracy > bestAccuracy.value) {
      const lesson = lessons.find(l => l.id === s.lessonId);
      bestAccuracy = { value: s.accuracy, lessonTitle: lesson?.title || 'Unknown' };
    }
  });

  // Most XP in a day
  const xpByDay = new Map<string, number>();
  xpLogs.forEach(x => {
    const k = dateKey(x.timestamp);
    xpByDay.set(k, (xpByDay.get(k) || 0) + x.amount);
  });
  let mostXP: PersonalRecords['mostXPInDay'] = null;
  xpByDay.forEach((value, date) => {
    if (!mostXP || value > mostXP.value) mostXP = { value, date };
  });

  // Most lessons in a day
  const lessonsByDay = new Map<string, number>();
  sessions.forEach(s => {
    const k = dateKey(s.startedAt);
    lessonsByDay.set(k, (lessonsByDay.get(k) || 0) + 1);
  });
  let mostLessons: PersonalRecords['mostLessonsInDay'] = null;
  lessonsByDay.forEach((value, date) => {
    if (!mostLessons || value > mostLessons.value) mostLessons = { value, date };
  });

  // Longest streak
  const sessionDays = new Set(sessions.map(s => dateKey(s.startedAt)));
  const sortedDays = Array.from(sessionDays).sort();
  let maxStreak = 0, currentStreak = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { currentStreak = 1; }
    else {
      const prev = new Date(sortedDays[i-1]);
      const curr = new Date(sortedDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      currentStreak = diff <= 1 ? currentStreak + 1 : 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  // Total segments completed
  const totalSegments = progress.reduce((sum, p) => sum + p.completedSegments.length, 0);

  // Total words typed (estimate: avg 10 words per segment)
  const totalWordsTyped = totalSegments * 10;

  return {
    bestAccuracy,
    longestStreak: maxStreak,
    mostXPInDay: mostXP,
    mostLessonsInDay: mostLessons,
    totalWordsTyped,
    totalSegmentsCompleted: totalSegments
  };
}
