import './ProgressBar.css';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  className?: string;
}

export function ProgressBar({ progress, label, showPercentage = true, height = 6, className = '' }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`progress-container ${className}`}>
      {(label || showPercentage) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showPercentage && <span className="progress-percentage">{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="progress-track" style={{ height: `${height}px` }}>
        <div 
          className="progress-fill" 
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
