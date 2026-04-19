
import { Play, RotateCcw, Trash2 } from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import './LessonCard.css';

interface LessonCardProps {
  id: string;
  title: string;
  totalSegments: number;
  completedSegments: number;
  createdAt: number;
  onPractice: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LessonCard({
  id,
  title,
  totalSegments,
  completedSegments,
  createdAt,
  onPractice,
  onDelete
}: LessonCardProps) {
  const progress = totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0;
  const isCompleted = completedSegments === totalSegments && totalSegments > 0;
  const dateStr = new Date(createdAt).toLocaleDateString();

  return (
    <div className="lesson-card glass-panel">
      <div className="card-content">
        <div className="card-header">
          <h3 className="lesson-title">{title}</h3>
        </div>
        
        <div className="lesson-meta">
          <span>Created: {dateStr}</span>
          <span className="dot-separator">•</span>
          <span>{totalSegments} segments</span>
        </div>
        
        <div className="card-progress">
          <ProgressBar progress={progress} />
        </div>
      </div>
      
      <div className="card-actions">
        <button 
          className="action-btn primary"
          onClick={() => onPractice(id)}
        >
          {isCompleted ? (
            <>
              <RotateCcw size={16} />
              <span>Practice Again</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>{progress > 0 ? 'Resume' : 'Start'}</span>
            </>
          )}
        </button>
        
        <button 
          className="action-btn danger icon-only"
          onClick={() => onDelete(id)}
          aria-label="Delete lesson"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
