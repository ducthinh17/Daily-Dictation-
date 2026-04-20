import { db } from '../db';
import { awardXP } from './xpEngine';
import type { DailyGoal } from '../types';

const GOAL_TEMPLATES = [
  { type: 'practice_time', target: 15, xpReward: 50, title: 'Practice for 15 minutes' },
  { type: 'practice_time', target: 30, xpReward: 100, title: 'Practice for 30 minutes' },
  { type: 'complete_segments', target: 20, xpReward: 40, title: 'Complete 20 segments' },
  { type: 'complete_segments', target: 50, xpReward: 100, title: 'Complete 50 segments' },
  { type: 'shadowing', target: 10, xpReward: 60, title: 'Shadow 10 segments' },
  { type: 'review_words', target: 5, xpReward: 30, title: 'Master 5 difficult words' },
];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export async function getDailyGoals(): Promise<DailyGoal[]> {
  const today = getTodayString();
  let goals = await db.dailyGoals.where('date').equals(today).toArray();
  
  if (goals.length === 0) {
    // Generate 3 random goals
    const shuffled = [...GOAL_TEMPLATES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    goals = selected.map(template => ({
      id: crypto.randomUUID(),
      date: today,
      type: template.type as DailyGoal['type'],
      target: template.target,
      progress: 0,
      xpReward: template.xpReward,
      isCompleted: false,
      title: template.title
    }));
    
    await db.dailyGoals.bulkAdd(goals);
  }
  
  return goals;
}

export async function updateGoalProgress(type: DailyGoal['type'], amount: number = 1): Promise<void> {
  const today = getTodayString();
  const goals = await db.dailyGoals.where('date').equals(today).toArray();
  
  const relevantGoals = goals.filter(g => g.type === type && !g.isCompleted);
  
  if (relevantGoals.length === 0) return;

  const updates = [];
  
  for (const goal of relevantGoals) {
    const newProgress = Math.min(goal.target, goal.progress + amount);
    const isCompleted = newProgress >= goal.target;
    
    updates.push(
      db.dailyGoals.update(goal.id, {
        progress: newProgress,
        isCompleted
      })
    );

    if (isCompleted) {
      await awardXP({
        type: 'daily_goal',
        metadata: { overrideAmount: goal.xpReward }
      });
    }
  }

  await Promise.all(updates);
}
