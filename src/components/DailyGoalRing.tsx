import type { DailyGoal } from '../types';
import { Check } from 'lucide-react';
import './DailyGoalRing.css';

interface DailyGoalRingProps {
  goal: DailyGoal;
  size?: number;
  strokeWidth?: number;
}

export function DailyGoalRing({ goal, size = 60, strokeWidth = 6 }: DailyGoalRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(100, Math.max(0, (goal.progress / goal.target) * 100));
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="goal-ring-container" style={{ width: size, height: size }}>
      <svg
        className="goal-ring-svg"
        width={size}
        height={size}
      >
        <circle
          className="goal-ring-bg"
          stroke="var(--bg-hover)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`goal-ring-progress ${goal.isCompleted ? 'completed' : ''}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="goal-ring-content">
        {goal.isCompleted ? (
          <Check size={size * 0.4} className="goal-ring-check" />
        ) : (
          <span className="goal-ring-text" style={{ fontSize: size * 0.25 }}>
            {goal.progress}/{goal.target}
          </span>
        )}
      </div>
    </div>
  );
}
