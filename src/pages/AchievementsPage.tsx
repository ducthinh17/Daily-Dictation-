import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trophy, Target, Award, Zap } from 'lucide-react';
import { db } from '../db';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import styles from './AchievementsPage.module.css';

import { ACHIEVEMENTS } from '../utils/achievementEngine';

export function AchievementsPage() {

  const profile = useLiveQuery(() => db.userProfile.get('me'));
  const unlockedBadges = useLiveQuery(() => db.achievements.toArray());
  const sessions = useLiveQuery(() => db.sessions.toArray());

  // Diagnostic logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Achievements Debug:", { 
        profile: profile === undefined ? 'loading' : (profile === null ? 'null' : 'ready'),
        unlockedBadges: unlockedBadges === undefined ? 'loading' : 'ready',
        sessions: sessions === undefined ? 'loading' : 'ready'
      });
    }
  }, [profile, unlockedBadges, sessions]);

  // Handle initialization if profile is missing
  useEffect(() => {
    if (profile === null) {
      if (import.meta.env.DEV) console.log("Profile missing, creating 'me' record...");
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

  const [isTakingTooLong, setIsTakingTooLong] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (profile === undefined) setIsTakingTooLong(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [profile]);

  if (profile === undefined || unlockedBadges === undefined || sessions === undefined) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading achievements...</p>
        
        {(import.meta.env.DEV || isTakingTooLong) && (
          <div className={styles.debugInfo}>
            <span>Status: Profile: {profile === undefined ? '⏳' : '✅'} | Badges: {unlockedBadges === undefined ? '⏳' : '✅'} | Sessions: {sessions === undefined ? '⏳' : '✅'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => window.location.reload()} 
            className={styles.reloadBtn}
          >
            Reload Page
          </button>
          
          {(import.meta.env.DEV || isTakingTooLong) && (
            <button 
              onClick={async () => {
                if(confirm("The system will clear local data to fix initialization errors. Are you sure you want to proceed?")) {
                  await db.delete();
                  window.location.reload();
                }
              }} 
              className={styles.resetBtn}
            >
              {isTakingTooLong ? "Reset & Fix System" : "Nuke Database (Nuclear Fix)"}
            </button>
          )}
        </div>
        
        {isTakingTooLong && (
          <p className={styles.hint}>
            The first initialization might take a moment. If it stays stuck, please try the "Reset & Fix System" button.
          </p>
        )}
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

  const ALL_BADGES = Object.values(ACHIEVEMENTS).filter(ach => !ach.isHidden || unlockedBadgeIds.has(ach.id));

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
              
              // We could calculate actual progress here, but for now we'll mock it if not unlocked
              let progress = isUnlocked ? badge.reqAmount : 0;
              // Add specific progress logic if needed later
              const percent = (progress / badge.reqAmount) * 100;

              return (
                <Card 
                  key={badge.id} 
                  variant="default" 
                  className={`${styles.badgeCard} ${isUnlocked ? styles.unlocked : styles.locked}`}
                >
                  <Card.Body className={styles.badgeContent}>
                    <div className={`${styles.badgeIconWrapper} ${styles[`badge-${badge.color}`]}`}>
                      <Trophy />
                    </div>
                    <h3 className={styles.badgeTitle}>{badge.title}</h3>
                    <p className={styles.badgeDesc}>{badge.description}</p>
                    
                    {!isUnlocked && (
                      <div className={styles.badgeProgressContainer}>
                        <div className={styles.badgeProgressText}>
                          <span>{progress}</span>
                          <span>{badge.reqAmount}</span>
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
