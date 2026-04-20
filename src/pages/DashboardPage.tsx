
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Flame, 
  Clock, 
  CheckCircle, 
  Target, 
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  LayoutDashboard
} from 'lucide-react';
import { 
  getOverviewStats, 
  getCurrentStreak, 
  getDailyStats, 
  getDifficultWords
} from '../db/statsQueries';
import type { DailyStat } from '../db/statsQueries';
import styles from './DashboardPage.module.css';
import { Button } from '../components/ui/Button';
import { RankBadge } from '../components/RankBadge';
import { getRankForLevel, getNextLevelProgress } from '../utils/rankSystem';
import { QuickPracticeWidget } from '../components/QuickPracticeWidget';
import { ErrorInsightsCard } from '../components/ErrorInsightsCard';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  const stats = useLiveQuery(() => getOverviewStats()) || {
    totalTimeMs: 0,
    lessonsCompleted: 0,
    avgAccuracy: 0,
    totalSessions: 0
  };
  const streak = useLiveQuery(() => getCurrentStreak()) || 0;
  const dailyStats = useLiveQuery(() => getDailyStats(90)) || [];
  const difficultWords = useLiveQuery(() => getDifficultWords(10)) || [];
  
  const profile = useLiveQuery(() => db.userProfile.get('me')) || {
    id: 'me',
    totalXP: 0,
    currentLevel: 1,
    title: 'Novice Listener',
    createdAt: Date.now(),
    lastUpdated: Date.now()
  };

  const rankInfo = getRankForLevel(profile.currentLevel);
  const { xpRequired, xpProgress, percent } = getNextLevelProgress(profile.totalXP, profile.currentLevel);

  // Get the most recently active lesson
  const recentProgress = useLiveQuery(() => 
    db.progress.orderBy('lastActiveAt').reverse().first()
  );

  const recentLesson = useLiveQuery(() => 
    recentProgress ? db.lessons.get(recentProgress.lessonId) : undefined,
    [recentProgress]
  );
  
  const recentCollection = useLiveQuery(() => 
    recentLesson?.collectionId ? db.collections.get(recentLesson.collectionId) : undefined,
    [recentLesson]
  );

  const recentSegmentsCount = useLiveQuery(() => 
    recentLesson ? db.segments.where('lessonId').equals(recentLesson.id).count() : 0,
    [recentLesson]
  );

  const formatTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Helper to render heatmap cells
  const renderHeatmap = () => {
    if (dailyStats.length === 0) return null;
    
    // Split into weeks (cols)
    const weeks: DailyStat[][] = [];
    let currentWeek: DailyStat[] = [];
    
    dailyStats.forEach(stat => {
      currentWeek.push(stat);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return (
      <div className={styles.heatmapGrid}>
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className={styles.heatmapColumn}>
            {week.map((day, dIdx) => {
              let intensityClass = styles.heat0;
              if (day.count > 0) {
                if (day.count >= 5) intensityClass = styles.heat4;
                else if (day.count >= 3) intensityClass = styles.heat3;
                else if (day.count >= 2) intensityClass = styles.heat2;
                else intensityClass = styles.heat1;
              }
              
              return (
                <div 
                  key={dIdx} 
                  className={`${styles.heatmapCell} ${intensityClass}`}
                  title={`${day.date}: ${day.count} sessions, ${day.accuracy}% accuracy`}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Welcome & Streak */}
      <header className={styles.header}>
        <div>
          <div className="header-title">
            <LayoutDashboard className="header-icon" size={36} />
            <h1 className={styles.title}>Dashboard</h1>
          </div>
          <p className={styles.subtitle}>Track your dictation mastery progress.</p>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.rankContainer}>
            <RankBadge rank={rankInfo} level={profile.currentLevel} size="sm" />
            <div className={styles.xpProgressContainer}>
              <div className={styles.xpText}>
                <span>{xpProgress} / {xpRequired} XP</span>
              </div>
              <div className={styles.xpBarBg}>
                <div className={styles.xpBarFill} style={{ width: `${percent}%`, background: rankInfo.gradient }} />
              </div>
            </div>
          </div>

          <div className={styles.streakBadge}>
            <Flame className={streak > 0 ? styles.flameActive : styles.flameInactive} />
            <span className={styles.streakCount}>{streak}</span>
            <span className={styles.streakLabel}>Day Streak</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Practice Time</span>
            <span className={styles.statValue}>{formatTime(stats.totalTimeMs)}</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Lessons Done</span>
            <span className={styles.statValue}>{stats.lessonsCompleted}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Target size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Avg Accuracy</span>
            <span className={styles.statValue}>{stats.avgAccuracy}%</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <BookOpen size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Sessions</span>
            <span className={styles.statValue}>{stats.totalSessions}</span>
          </div>
        </div>
      </section>

      <div className={styles.twoColumnGrid}>
        {/* Main Column */}
        <div className={styles.mainColumn}>
          {/* Continue Learning Widget */}
          {recentLesson && recentCollection && (
            <div className={styles.continueWidget}>
              <div className={styles.continueContent}>
                <span className={styles.widgetBadge}>Continue Learning</span>
                <h3 className={styles.continueTitle}>{recentLesson.title}</h3>
                <p className={styles.continueSubtitle}>From: {recentCollection.title}</p>
                <div className={styles.continueProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${Math.min(100, ((recentProgress?.completedSegments?.length || 0) / Math.max(1, recentSegmentsCount || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <Button 
                className={styles.continueBtn}
                onClick={() => navigate(`/practice/${recentLesson.id}`)}
              >
                Resume <ArrowRight size={18} />
              </Button>
            </div>
          )}

          {/* Quick Practice Widget */}
          <QuickPracticeWidget />

          {/* Activity Heatmap */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <TrendingUp size={20} className={styles.widgetIcon} />
              <h2 className={styles.widgetTitle}>Activity History (90 Days)</h2>
            </div>
            <div className={styles.heatmapContainer}>
              {renderHeatmap()}
              <div className={styles.heatmapLegend}>
                <span>Less</span>
                <div className={`${styles.heatmapCell} ${styles.heat0}`} />
                <div className={`${styles.heatmapCell} ${styles.heat1}`} />
                <div className={`${styles.heatmapCell} ${styles.heat2}`} />
                <div className={`${styles.heatmapCell} ${styles.heat3}`} />
                <div className={`${styles.heatmapCell} ${styles.heat4}`} />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Column */}
        <div className={styles.sideColumn}>
          {/* Error Insights */}
          <ErrorInsightsCard compact />

          {/* Top Difficult Words */}
          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <AlertTriangle size={20} className={styles.widgetIcon} style={{ color: '#ef4444' }} />
              <h2 className={styles.widgetTitle}>Top Words to Review</h2>
            </div>
            
            {difficultWords.length > 0 ? (
              <ul className={styles.wordList}>
                {difficultWords.map((item, idx) => (
                  <li key={idx} className={styles.wordItem}>
                    <span className={styles.wordText}>{item.word}</span>
                    <span className={styles.wordCountBadge}>{item.count} misses</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <CheckCircle size={32} className={styles.emptyIcon} />
                <p>No mistakes yet! Keep practicing to see your difficult words here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
