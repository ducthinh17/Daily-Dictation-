import { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, BookOpen, Target, Hash } from 'lucide-react';
import { getPersonalRecords, type PersonalRecords as RecordsType } from '../db/recordsQueries';
import './PersonalRecords.css';

export function PersonalRecords() {
  const [records, setRecords] = useState<RecordsType | null>(null);

  useEffect(() => {
    getPersonalRecords().then(setRecords);
  }, []);

  if (!records) return <div className="pr-loading">Loading records...</div>;

  const cards = [
    {
      icon: <Trophy size={24} />,
      label: 'Best Accuracy',
      value: records.bestAccuracy ? `${records.bestAccuracy.value}%` : '—',
      detail: records.bestAccuracy ? `on "${records.bestAccuracy.lessonTitle}"` : 'Complete a lesson',
      color: '#f59e0b',
    },
    {
      icon: <Flame size={24} />,
      label: 'Longest Streak',
      value: `${records.longestStreak} days`,
      detail: records.longestStreak > 0 ? 'Keep it going!' : 'Start practicing daily',
      color: '#ef4444',
    },
    {
      icon: <Zap size={24} />,
      label: 'Most XP in a Day',
      value: records.mostXPInDay ? `${records.mostXPInDay.value} XP` : '—',
      detail: records.mostXPInDay ? records.mostXPInDay.date : 'Earn your first XP',
      color: '#8b5cf6',
    },
    {
      icon: <BookOpen size={24} />,
      label: 'Most Lessons in a Day',
      value: records.mostLessonsInDay ? String(records.mostLessonsInDay.value) : '—',
      detail: records.mostLessonsInDay ? records.mostLessonsInDay.date : 'Complete a lesson',
      color: '#3b82f6',
    },
    {
      icon: <Target size={24} />,
      label: 'Segments Completed',
      value: String(records.totalSegmentsCompleted),
      detail: 'Total lifetime',
      color: '#10b981',
    },
    {
      icon: <Hash size={24} />,
      label: 'Words Typed',
      value: records.totalWordsTyped.toLocaleString(),
      detail: 'Estimated total',
      color: '#06b6d4',
    },
  ];

  return (
    <div className="pr-grid">
      {cards.map((card, i) => (
        <div key={i} className="pr-card" style={{ '--pr-color': card.color } as any}>
          <div className="pr-icon-wrap">{card.icon}</div>
          <div className="pr-info">
            <span className="pr-label">{card.label}</span>
            <span className="pr-value">{card.value}</span>
            <span className="pr-detail">{card.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
