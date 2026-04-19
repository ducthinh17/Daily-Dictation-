import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trophy, Star, Target, Flame, Zap, Award, CheckCircle } from 'lucide-react';
import { db } from '../db';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import styles from './AchievementsPage.module.css';

const ALL_BADGES = [
  { id: 'first-lesson', title: 'First Step', description: 'Complete your first lesson.', icon: <Target />, color: 'primary', req: 1 },
  { id: '10-lessons', title: 'Getting Serious', description: 'Complete 10 lessons.', icon: <Star />, color: 'secondary', req: 10 },
  { id: '50-lessons', title: 'Iron Ear', description: 'Complete 50 lessons.', icon: <Award />, color: 'success', req: 50 },
  { id: '3-day-streak', title: 'Consistent', description: 'Achieve a 3-day practice streak.', icon: <Flame />, color: 'warning', req: 3 },
  { id: '7-day-streak', title: 'Relentless', description: 'Achieve a 7-day practice streak.', icon: <Flame />, color: 'danger', req: 7 },
  { id: '100-accuracy', title: 'Perfectionist', description: 'Achieve 100% accuracy in a session.', icon: <CheckCircle />, color: 'success', req: 1 },
];

export function AchievementsPage() {

  const profile = useLiveQuery(() => db.userProfile.get('me'));
  const unlockedBadges = useLiveQuery(() => db.achievements.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());

  // Handle initialization if profile is missing
  useEffect(() => {
    if (profile === null) {
      db.userProfile.add({
        id: 'me',
        totalXP: 0,
        currentLevel: 1,
        title: 'Novice Listener',
        createdAt: Date.now(),
        lastUpdated: Date.now()
      }).catch(err => console.error("Failed to initialize profile:", err));
    }
  }, [profile]);

  if (profile === undefined || unlockedBadges === undefined || sessions === undefined) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading achievements...</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Reload if stuck
        </button>
      </div>
    );
  }

  // Final fallback for missing profile after loading
  const currentProfile = profile || {
    id: 'me',
    currentLevel: 1,
    totalXP: 0,
    title: 'Novice Listener'
  };

  // Calculate XP progress to next level
  const xpForNextLevel = currentProfile.currentLevel * 1000;
  const progressPercentage = Math.min((currentProfile.totalXP / xpForNextLevel) * 100, 100);

  const unlockedBadgeIds = new Set(unlockedBadges.map(b => b.badgeId));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className="header-title">
            <Award className="header-icon" size={36} />
            <h1 className="page-title">Achievements</h1>
          </div>
          <p className="page-subtitle">Track your progress, earn XP, and collect badges.</p>
        </div>
        <div className={styles.levelBadge}>
          <div className={styles.levelRing}>
            <span>{currentProfile.currentLevel}</span>
          </div>
          <div className={styles.levelInfo}>
            <span className={styles.levelLabel}>Level {currentProfile.currentLevel}</span>
            <span className={styles.levelTitle}>{currentProfile.title}</span>
          </div>
        </div>
      </header>

      <Card variant="glass" className={styles.xpCard}>
        <Card.Body>
          <div className={styles.xpHeader}>
            <div className={styles.xpText}>
              <Zap size={20} className={styles.xpIcon} />
              <span className={styles.xpValue}>{currentProfile.totalXP} XP</span>
              <span className={styles.xpTotal}>/ {xpForNextLevel} XP to Level {currentProfile.currentLevel + 1}</span>
            </div>
            <Badge variant="primary" size="sm">+50 XP per lesson</Badge>
          </div>
          <ProgressBar progress={progressPercentage} height={12} className={styles.xpBar} />
        </Card.Body>
      </Card>

      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview" icon={<Trophy size={16} />}>My Badges</Tabs.Trigger>
          <Tabs.Trigger value="stats" icon={<Target size={16} />}>Statistics</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <div className={styles.badgesGrid}>
            {ALL_BADGES.map(badge => {
              const isUnlocked = unlockedBadgeIds.has(badge.id);
              
              // Mocking progress for demonstration, in reality it should query DB
              let progress = 0;
              if (badge.id === 'first-lesson') progress = sessions.length >= 1 ? 1 : 0;
              else if (badge.id === '10-lessons') progress = Math.min(sessions.length, 10);
              else if (badge.id === '50-lessons') progress = Math.min(sessions.length, 50);
              else progress = isUnlocked ? badge.req : 0; // fallback

              const percent = (progress / badge.req) * 100;

              return (
                <Card 
                  key={badge.id} 
                  variant="default" 
                  className={`${styles.badgeCard} ${isUnlocked ? styles.unlocked : styles.locked}`}
                >
                  <Card.Body className={styles.badgeContent}>
                    <div className={`${styles.badgeIconWrapper} ${styles[`badge-${badge.color}`]}`}>
                      {badge.icon}
                    </div>
                    <h3 className={styles.badgeTitle}>{badge.title}</h3>
                    <p className={styles.badgeDesc}>{badge.description}</p>
                    
                    {!isUnlocked && (
                      <div className={styles.badgeProgressContainer}>
                        <div className={styles.badgeProgressText}>
                          <span>{progress}</span>
                          <span>{badge.req}</span>
                        </div>
                        <ProgressBar progress={percent} height={6} showPercentage={false} />
                      </div>
                    )}
                    
                    {isUnlocked && (
                      <div className={styles.unlockedStamp}>
                        Unlocked
                      </div>
                    )}
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </Tabs.Content>

        <Tabs.Content value="stats">
          <Card variant="glass">
            <Card.Body>
              <div className={styles.emptyStats}>
                <Target size={48} className={styles.emptyIcon} />
                <h3>Detailed Statistics Coming Soon</h3>
                <p>We are building a comprehensive view of your listening habits.</p>
              </div>
            </Card.Body>
          </Card>
        </Tabs.Content>
      </Tabs>
    </div>
  );
}
