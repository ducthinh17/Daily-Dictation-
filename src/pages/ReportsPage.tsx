import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Calendar, TrendingUp, Target, Award, BrainCircuit, Activity } from 'lucide-react';
import { db } from '../db';
import styles from './ReportsPage.module.css';

export function ReportsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const xpLogs = useLiveQuery(() => db.xpLog.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const srsCards = useLiveQuery(() => db.srsCards.toArray());
  const masteredWords = useLiveQuery(() => db.masteredWords.toArray());

  // Aggregate Data
  const stats = useMemo(() => {
    if (!xpLogs || !sessions || !srsCards || !masteredWords) return null;

    const now = Date.now();
    const rangeMs = timeRange === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const cutoff = now - rangeMs;

    // Filter by time range
    const recentXP = xpLogs.filter(log => log.timestamp >= cutoff);
    const recentSessions = sessions.filter(s => s.startedAt >= cutoff);
    
    // Total XP in range
    const totalXP = recentXP.reduce((sum, log) => sum + log.amount, 0);

    // Total Time (minutes)
    const totalTimeMs = recentSessions.reduce((sum, s) => {
      if (s.endedAt) return sum + (s.endedAt - s.startedAt);
      return sum;
    }, 0);
    const totalTimeMins = Math.round(totalTimeMs / 60000);

    // Mastered Words in range
    const recentMastered = masteredWords.filter(w => w.masteredAt >= cutoff).length;

    // SRS Retention Proxy (based on Easiness Factor)
    let avgEasiness = 0;
    if (srsCards.length > 0) {
      avgEasiness = srsCards.reduce((sum, card) => sum + card.easinessFactor, 0) / srsCards.length;
    }
    // SM-2 Easiness ranges typically 1.3 to 2.5+. We map 1.3 -> 0% and 2.5 -> 100%
    const accuracy = avgEasiness > 0 ? Math.max(0, Math.min(100, Math.round(((avgEasiness - 1.3) / (2.5 - 1.3)) * 100))) : 0;

    // Activity Chart Data (last 7 days)
    const days = 7;
    const activityData = Array.from({ length: days }).map((_, i) => {
      const date = new Date(now - (days - 1 - i) * 86400000);
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

    return {
      totalXP,
      totalTimeMins,
      recentMastered,
      accuracy,
      activityData,
      maxXP,
      totalWords: srsCards.length
    };
  }, [xpLogs, sessions, srsCards, masteredWords, timeRange]);

  if (!stats) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Analyzing your progress...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Learning Reports</h1>
          <p className={styles.subtitle}>Track your progress and identify areas for improvement</p>
        </div>
        <div className={styles.rangeSelector}>
          <button 
            className={`${styles.rangeBtn} ${timeRange === 'week' ? styles.active : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Last 7 Days
          </button>
          <button 
            className={`${styles.rangeBtn} ${timeRange === 'month' ? styles.active : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Last 30 Days
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Activity size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Time Studied</span>
            <span className={styles.statValue}>{stats.totalTimeMins} <span className={styles.statUnit}>mins</span></span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>XP Earned</span>
            <span className={styles.statValue}>{stats.totalXP} <span className={styles.statUnit}>XP</span></span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Award size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Words Mastered</span>
            <span className={styles.statValue}>{stats.recentMastered}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Target size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Review Accuracy</span>
            <span className={styles.statValue}>{stats.accuracy}%</span>
          </div>
        </div>
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}><Calendar size={18} /> Activity (XP over 7 days)</h2>
          <div className={styles.barChart}>
            {stats.activityData.map((data, idx) => (
              <div key={idx} className={styles.barColumn}>
                <div className={styles.barValue}>{data.value > 0 ? data.value : ''}</div>
                <div 
                  className={styles.bar} 
                  style={{ height: `${(data.value / stats.maxXP) * 100}%` }}
                ></div>
                <div className={styles.barLabel}>{data.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}><BrainCircuit size={18} /> Vocabulary Retention</h2>
          <div className={styles.retentionInfo}>
            <div className={styles.retentionCircle}>
              <svg viewBox="0 0 36 36" className={styles.circularChart}>
                <path
                  className={styles.circleBg}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={styles.circle}
                  strokeDasharray={`${stats.accuracy}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className={styles.percentage}>{stats.accuracy}%</text>
              </svg>
            </div>
            <div className={styles.retentionStats}>
              <div className={styles.retentionRow}>
                <span className={styles.retentionDot} style={{ background: '#10b981' }}></span>
                <span>Learning Words</span>
                <strong>{stats.totalWords}</strong>
              </div>
              <div className={styles.retentionRow}>
                <span className={styles.retentionDot} style={{ background: '#3b82f6' }}></span>
                <span>Mastered Words</span>
                <strong>{masteredWords?.length || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
