import { BookOpen } from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import './CollectionCard.css';

interface CollectionCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  coverColor: string;
  lessonCount: number;
  completedLessons: number;
  onClick: (id: string) => void;
}

export function CollectionCard({
  id,
  title,
  description,
  difficulty,
  category,
  coverColor,
  lessonCount,
  completedLessons,
  onClick
}: CollectionCardProps) {
  const progress = lessonCount > 0 ? (completedLessons / lessonCount) * 100 : 0;
  
  const difficultyColors = {
    beginner: '#22c55e',
    intermediate: '#f59e0b',
    advanced: '#ef4444'
  };

  return (
    <div className="collection-card glass-panel" onClick={() => onClick(id)}>
      <div 
        className="collection-cover"
        style={{ background: coverColor }}
      >
        <div className="collection-badges">
          <span className="badge category-badge">{category}</span>
          <span className="badge difficulty-badge" style={{ color: difficultyColors[difficulty] }}>
            <span className="dot" style={{ backgroundColor: difficultyColors[difficulty] }}></span>
            {difficulty}
          </span>
        </div>
      </div>
      
      <div className="collection-content">
        <h3 className="collection-title">{title}</h3>
        <p className="collection-desc">{description || 'No description provided.'}</p>
        
        <div className="collection-stats">
          <div className="stat">
            <BookOpen size={14} />
            <span>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
          </div>
        </div>
        
        <div className="collection-progress">
          <div className="progress-labels">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <ProgressBar progress={progress} showPercentage={false} />
        </div>
      </div>
    </div>
  );
}
