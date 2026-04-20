import { db } from './index';

export interface TrendPoint { date: string; value: number; }

function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function getAccuracyTrend(days = 30): Promise<TrendPoint[]> {
  const since = Date.now() - days * 86400000;
  const sessions = await db.sessions.where('startedAt').above(since).toArray();
  const map = new Map<string, { sum: number; count: number }>();
  sessions.forEach(s => {
    const k = dateKey(s.startedAt);
    const e = map.get(k) || { sum: 0, count: 0 };
    e.sum += s.accuracy; e.count++;
    map.set(k, e);
  });
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, value: Math.round(v.sum / v.count) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getSessionVolume(days = 30): Promise<TrendPoint[]> {
  const since = Date.now() - days * 86400000;
  const sessions = await db.sessions.where('startedAt').above(since).toArray();
  const map = new Map<string, number>();
  sessions.forEach(s => {
    const k = dateKey(s.startedAt);
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getVocabularyGrowth(): Promise<TrendPoint[]> {
  const errors = await db.wordErrors.orderBy('timestamp').toArray();
  const seen = new Set<string>();
  const map = new Map<string, number>();
  errors.forEach(e => {
    const k = dateKey(e.timestamp);
    seen.add(e.expectedWord?.toLowerCase() || e.word?.toLowerCase());
    map.set(k, seen.size);
  });
  return Array.from(map.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getHourlyPerformance(): Promise<{ hour: number; avgAccuracy: number; count: number }[]> {
  const sessions = await db.sessions.toArray();
  const hours = new Array(24).fill(null).map(() => ({ sum: 0, count: 0 }));
  sessions.forEach(s => {
    const h = new Date(s.startedAt).getHours();
    hours[h].sum += s.accuracy;
    hours[h].count++;
  });
  return hours.map((h, i) => ({
    hour: i,
    avgAccuracy: h.count > 0 ? Math.round(h.sum / h.count) : 0,
    count: h.count
  }));
}

export async function getSessionDurationTrend(days = 30): Promise<TrendPoint[]> {
  const since = Date.now() - days * 86400000;
  const sessions = await db.sessions.where('startedAt').above(since).toArray();
  const map = new Map<string, { sum: number; count: number }>();
  sessions.forEach(s => {
    const k = dateKey(s.startedAt);
    const dur = (s.endedAt - s.startedAt) / 60000; // minutes
    const e = map.get(k) || { sum: 0, count: 0 };
    e.sum += dur; e.count++;
    map.set(k, e);
  });
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, value: Math.round(v.sum / v.count * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
