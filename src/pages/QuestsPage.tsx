import { useEffect, useState } from 'react';
import { Target, Calendar, Award } from 'lucide-react';
import { getDailyGoals } from '../utils/questEngine';
import type { DailyGoal } from '../types';
import { DailyGoalRing } from '../components/DailyGoalRing';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import './QuestsPage.css';

export function QuestsPage() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGoals() {
      setIsLoading(true);
      const fetchedGoals = await getDailyGoals();
      setGoals(fetchedGoals);
      setIsLoading(false);
    }
    loadGoals();
  }, []);

  const totalXPReward = goals.reduce((acc, g) => acc + g.xpReward, 0);
  const earnedXP = goals.filter(g => g.isCompleted).reduce((acc, g) => acc + g.xpReward, 0);

  return (
    <div className="quests-container">
      <header className="quests-header">
        <div>
          <div className="header-title">
            <Target className="header-icon" size={36} />
            <h1 className="page-title">Quests & Goals</h1>
          </div>
          <p className="page-subtitle">Complete daily and weekly challenges to earn bonus XP and climb the ranks faster.</p>
        </div>
        
        <div className="quests-summary">
          <div className="quests-stat">
            <span className="stat-value">{goals.filter(g => g.isCompleted).length}/{goals.length}</span>
            <span className="stat-label">Daily Goals</span>
          </div>
          <div className="quests-stat xp-stat">
            <Award size={20} className="xp-icon" />
            <div>
              <span className="stat-value">+{earnedXP} <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>/ {totalXPReward}</span></span>
              <span className="stat-label">XP Earned Today</span>
            </div>
          </div>
        </div>
      </header>

      <section className="quests-section">
        <div className="section-header">
          <h2><Calendar size={20} /> Daily Goals</h2>
          <Badge variant="success">Resets at midnight</Badge>
        </div>

        {isLoading ? (
          <div className="loading-state">Loading goals...</div>
        ) : (
          <div className="goals-grid">
            {goals.map(goal => (
              <Card key={goal.id} variant={goal.isCompleted ? 'highlight' : 'default'} className="goal-card">
                <Card.Body className="goal-card-body">
                  <div className="goal-info">
                    <h3>{goal.title}</h3>
                    <div className="goal-reward">
                      <Award size={14} /> +{goal.xpReward} XP
                    </div>
                  </div>
                  <div className="goal-progress-wrapper">
                    <DailyGoalRing goal={goal} size={50} strokeWidth={5} />
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="quests-section locked-section">
        <div className="section-header">
          <h2><Target size={20} /> Weekly Quests</h2>
          <Badge variant="warning">Coming Soon</Badge>
        </div>
        <Card variant="glass" className="locked-card">
          <Card.Body className="locked-content">
            <Award size={48} className="locked-icon" />
            <h3>Epic Weekly Challenges</h3>
            <p>Master larger goals over the week for massive XP rewards and exclusive titles.</p>
          </Card.Body>
        </Card>
      </section>
    </div>
  );
}
