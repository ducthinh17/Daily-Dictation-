import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, TrendingUp, Target, Award, Activity, Clock, BookOpen, BrainCircuit, Calendar } from 'lucide-react';
import { db } from '../db';
import { SVGLineChart } from '../components/SVGLineChart';
import {
  getAccuracyTrend, getSessionVolume, getVocabularyGrowth,
  getSessionDurationTrend, getHourlyPerformance,
  type TrendPoint
} from '../db/analyticsQueries';
import { Tabs } from '../components/ui/Tabs';
import './ProgressPage.css';

export function ProgressPage() {
  const [days, setDays] = useState(30);

  // ── Overview data (from ReportsPage) ──
  const xpLogs = useLiveQuery(() => db.xpLog.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const srsCards = useLiveQuery(() => db.srsCards.toArray());
  const masteredWords = useLiveQuery(() => db.masteredWords.toArray());

  const overviewStats = useMemo(() => {
    if (!xpLogs || !sessions || !srsCards || !masteredWords) return null;

    const now = Date.now();
    const rangeMs = days * 24 * 60 * 60 * 1000;
    const cutoff = now - rangeMs;

    const recentXP = xpLogs.filter(log => log.timestamp >= cutoff);
    const recentSessions = sessions.filter(s => s.startedAt >= cutoff);
    const totalXP = recentXP.reduce((sum, log) => sum + log.amount, 0);
    const totalTimeMs = recentSessions.reduce((sum, s) => {
      if (s.endedAt) return sum + (s.endedAt - s.startedAt);
      return sum;
    }, 0);
    const totalTimeMins = Math.round(totalTimeMs / 60000);
    const recentMastered = masteredWords.filter(w => w.masteredAt >= cutoff).length;

    let avgEasiness = 0;
    if (srsCards.length > 0) {
      avgEasiness = srsCards.reduce((sum, card) => sum + card.easinessFactor, 0) / srsCards.length;
    }
    const accuracy = avgEasiness > 0 ? Math.max(0, Math.min(100, Math.round(((avgEasiness - 1.3) / (2.5 - 1.3)) * 100))) : 0;

    // 7-day XP bar chart
    const barDays = 7;
    const activityData = Array.from({ length: barDays }).map((_, i) => {
      const date = new Date(now - (barDays - 1 - i) * 86400000);
      date.setHours(0, 0, 0, 0);
      const startOfDay = date.getTime();
      const endOfDay = startOfDay + 86400000;
      const dayXP = xpLogs
        .filter(log => log.timestamp >= startOfDay && log.timestamp < endOfDay)
        .reduce((sum, log) => sum + log.amount, 0);
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayXP
      };
    });
    const maxXP = Math.max(...activityData.map(d => d.value), 100);

    return { totalXP, totalTimeMins, recentMastered, accuracy, activityData, maxXP, totalWords: srsCards.length, totalMastered: masteredWords.length };
  }, [xpLogs, sessions, srsCards, masteredWords, days]);

  // ── Trends data (from AnalyticsPage) ──
  const [accuracy, setAccuracy] = useState<TrendPoint[]>([]);
  const [volume, setVolume] = useState<TrendPoint[]>([]);
  const [vocab, setVocab] = useState<TrendPoint[]>([]);
  const [duration, setDuration] = useState<TrendPoint[]>([]);
  const [hourly, setHourly] = useState<{ hour: number; avgAccuracy: number; count: number }[]>([]);

  useEffect(() => {
    getAccuracyTrend(days).then(setAccuracy);
    getSessionVolume(days).then(setVolume);
    getVocabularyGrowth().then(setVocab);
    getSessionDurationTrend(days).then(setDuration);
    getHourlyPerformance().then(setHourly);
  }, [days]);

  const activeHours = hourly.filter(h => h.count > 0);
  const bestHour = activeHours.length > 0
    ? activeHours.reduce((a, b) => a.avgAccuracy > b.avgAccuracy ? a : b)
    : null;

  if (!overviewStats) {
    return (
      <div className="progress-page page-container">
        <div className="progress-loading">
          <div className="progress-spinner" />
          <p>Analyzing your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page page-container">
      <header className="page-header">
        <div className="header-title">
          <BarChart3 className="header-icon" size={36} />
          <h1>Progress</h1>
        </div>
        <div className="progress-period-tabs">
          {[7, 14, 30, 90].map(d => (
            <button key={d} className={`progress-period-btn ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </header>

      {/* Stats summary row */}
      <div className="progress-stats-row">
        <div className="progress-stat-card">
          <div className="progress-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Activity size={22} />
          </div>
          <div className="progress-stat-info">
            <span className="progress-stat-label">Time Studied</span>
            <span className="progress-stat-value">{overviewStats.totalTimeMins}<span className="progress-stat-unit">mins</span></span>
          </div>
        </div>
        <div className="progress-stat-card">
          <div className="progress-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <TrendingUp size={22} />
          </div>
          <div className="progress-stat-info">
            <span className="progress-stat-label">XP Earned</span>
            <span className="progress-stat-value">{overviewStats.totalXP}<span className="progress-stat-unit">XP</span></span>
          </div>
        </div>
        <div className="progress-stat-card">
          <div className="progress-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Award size={22} />
          </div>
          <div className="progress-stat-info">
            <span className="progress-stat-label">Words Mastered</span>
            <span className="progress-stat-value">{overviewStats.recentMastered}</span>
          </div>
        </div>
        <div className="progress-stat-card">
          <div className="progress-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Target size={22} />
          </div>
          <div className="progress-stat-info">
            <span className="progress-stat-label">Retention</span>
            <span className="progress-stat-value">{overviewStats.accuracy}<span className="progress-stat-unit">%</span></span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview" icon={<Calendar size={16} />}>Overview</Tabs.Trigger>
          <Tabs.Trigger value="trends" icon={<TrendingUp size={16} />}>Trends</Tabs.Trigger>
          <Tabs.Trigger value="timing" icon={<Clock size={16} />}>Timing</Tabs.Trigger>
        </Tabs.List>

        {/* ─── Overview Tab ─── */}
        <Tabs.Content value="overview">
          <div className="progress-overview-grid">
            {/* XP bar chart */}
            <div className="progress-chart-card">
              <h3 className="progress-chart-title"><Calendar size={18} /> Activity (XP over 7 days)</h3>
              <div className="progress-bar-chart">
                {overviewStats.activityData.map((data, idx) => (
                  <div key={idx} className="progress-bar-col">
                    <div className="progress-bar-val">{data.value > 0 ? data.value : ''}</div>
                    <div className="progress-bar" style={{ height: `${(data.value / overviewStats.maxXP) * 100}%` }} />
                    <div className="progress-bar-label">{data.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention circle */}
            <div className="progress-chart-card">
              <h3 className="progress-chart-title"><BrainCircuit size={18} /> Vocabulary Retention</h3>
              <div className="progress-retention-info">
                <div className="progress-retention-circle">
                  <svg viewBox="0 0 36 36" className="progress-circular-chart">
                    <path className="progress-circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="progress-circle"
                      strokeDasharray={`${overviewStats.accuracy}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" className="progress-percentage">{overviewStats.accuracy}%</text>
                  </svg>
                </div>
                <div className="progress-retention-stats">
                  <div className="progress-retention-row">
                    <span className="progress-retention-dot" style={{ background: '#10b981' }} />
                    <span>Learning Words</span>
                    <strong>{overviewStats.totalWords}</strong>
                  </div>
                  <div className="progress-retention-row">
                    <span className="progress-retention-dot" style={{ background: '#3b82f6' }} />
                    <span>Mastered Words</span>
                    <strong>{overviewStats.totalMastered}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs.Content>

        {/* ─── Trends Tab ─── */}
        <Tabs.Content value="trends">
          <div className="progress-trends-grid">
            <div className="progress-trend-card">
              <div className="progress-trend-header">
                <TrendingUp size={18} style={{ color: '#10b981' }} />
                <h3>Accuracy Trend</h3>
              </div>
              <SVGLineChart data={accuracy} color="#10b981" label="" valueFormatter={v => `${v}%`} />
            </div>
            <div className="progress-trend-card">
              <div className="progress-trend-header">
                <Target size={18} style={{ color: '#3b82f6' }} />
                <h3>Practice Volume</h3>
              </div>
              <SVGLineChart data={volume} color="#3b82f6" valueFormatter={v => `${v}`} />
            </div>
            <div className="progress-trend-card">
              <div className="progress-trend-header">
                <BookOpen size={18} style={{ color: '#8b5cf6' }} />
                <h3>Vocabulary Growth</h3>
              </div>
              <SVGLineChart data={vocab} color="#8b5cf6" valueFormatter={v => `${v}`} />
            </div>
            <div className="progress-trend-card">
              <div className="progress-trend-header">
                <Clock size={18} style={{ color: '#f59e0b' }} />
                <h3>Avg Session Duration</h3>
              </div>
              <SVGLineChart data={duration} color="#f59e0b" valueFormatter={v => `${v}m`} />
            </div>
          </div>
        </Tabs.Content>

        {/* ─── Timing Tab ─── */}
        <Tabs.Content value="timing">
          <div className="progress-timing-card">
            <div className="progress-trend-header">
              <Clock size={18} style={{ color: '#06b6d4' }} />
              <h3>Best Practice Time</h3>
              {bestHour && (
                <span className="progress-best-badge">
                  Best at {bestHour.hour}:00 ({bestHour.avgAccuracy}% accuracy)
                </span>
              )}
            </div>
            <div className="progress-hourly-grid">
              {hourly.map((h, i) => {
                const intensity = h.count > 0 ? Math.min(h.avgAccuracy / 100, 1) : 0;
                return (
                  <div key={i} className="progress-hour-cell" title={`${i}:00 — ${h.count} sessions, ${h.avgAccuracy}% avg`}>
                    <div className="progress-hour-bar" style={{
                      height: `${Math.max(intensity * 100, 4)}%`,
                      background: h.count > 0
                        ? `color-mix(in srgb, #06b6d4 ${Math.round(intensity * 100)}%, var(--bg-hover))`
                        : 'var(--bg-hover)'
                    }} />
                    <span className="progress-hour-label">{i % 3 === 0 ? `${i}h` : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Tabs.Content>
      </Tabs>
    </div>
  );
}
