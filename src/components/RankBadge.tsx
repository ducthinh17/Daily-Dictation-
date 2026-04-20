import type { RankInfo } from '../utils/rankSystem';
import './RankBadge.css';

interface RankBadgeProps {
  rank: RankInfo;
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RankBadge({ rank, level, size = 'md', showLabel = true }: RankBadgeProps) {
  return (
    <div className={`rank-badge-container size-${size}`}>
      <div 
        className="rank-badge-shield"
        style={{ 
          background: rank.gradient,
          boxShadow: `0 4px 15px ${rank.color}40`,
          borderColor: rank.color
        }}
      >
        <span className="rank-badge-icon">{rank.icon}</span>
        <div className="rank-badge-level">{level}</div>
      </div>
      
      {showLabel && (
        <div className="rank-badge-info">
          <span className="rank-badge-title" style={{ color: rank.color }}>
            {rank.title}
          </span>
          <span className="rank-badge-tier">
            {rank.tier.charAt(0).toUpperCase() + rank.tier.slice(1)} Tier
          </span>
        </div>
      )}
    </div>
  );
}
