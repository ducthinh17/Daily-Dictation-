import { useEffect, useState } from 'react';
import { Target, Award } from 'lucide-react';
import { getDailyGoals } from '../utils/questEngine';
import type { DailyGoal } from '../types';
import { DailyGoalRing } from './DailyGoalRing';

export function DailyGoalsWidget() {
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

  const completedCount = goals.filter(g => g.isCompleted).length;
  const earnedXP = goals.filter(g => g.isCompleted).reduce((acc, g) => acc + g.xpReward, 0);

  if (isLoading) {
    return (
      <div className="daily-goals-widget" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading daily goals...
      </div>
    );
  }

  return (
    <div className="daily-goals-widget">
      <div className="dgw-header">
        <div className="dgw-title-row">
          <Target size={20} style={{ color: '#8b5cf6' }} />
          <h3 className="dgw-title">Daily Goals</h3>
        </div>
        <div className="dgw-summary">
          <span className="dgw-completed">{completedCount}/{goals.length}</span>
          {earnedXP > 0 && (
            <span className="dgw-xp"><Award size={12} /> +{earnedXP} XP</span>
          )}
        </div>
      </div>
      <div className="dgw-goals-list">
        {goals.map(goal => (
          <div key={goal.id} className={`dgw-goal-item ${goal.isCompleted ? 'completed' : ''}`}>
            <DailyGoalRing goal={goal} size={36} strokeWidth={4} />
            <div className="dgw-goal-info">
              <span className="dgw-goal-name">{goal.title}</span>
              <span className="dgw-goal-reward"><Award size={10} /> +{goal.xpReward} XP</span>
            </div>
            {goal.isCompleted && <span className="dgw-checkmark">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
