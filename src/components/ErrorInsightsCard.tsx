import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PieChart, ChevronRight } from 'lucide-react';
import { db } from '../db';
import { getErrorInsights } from '../utils/errorAnalyzer';
import './ErrorInsightsCard.css';

interface Props { compact?: boolean; }

export function ErrorInsightsCard({ compact = false }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const allErrors = useLiveQuery(() => db.wordErrors.toArray());

  if (!allErrors || allErrors.length === 0) return null;
  const insights = getErrorInsights(allErrors);
  if (insights.length === 0) return null;

  const topInsight = insights[0];
  const total = allErrors.length;

  const renderDonut = () => {
    const size = compact ? 80 : 100;
    const sw = compact ? 10 : 12;
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;
    const cx = size / 2, cy = size / 2;
    let offset = 0;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ei-donut">
        {insights.map((ins, i) => {
          const pct = ins.count / total;
          const dash = pct * circ;
          const rot = (offset / total) * 360 - 90;
          offset += ins.count;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={ins.color} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ - dash}`}
              transform={`rotate(${rot} ${cx} ${cy})`}
              className="ei-donut-seg" style={{ animationDelay: `${i * 0.1}s` }} />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="ei-donut-total">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="ei-donut-label">errors</text>
      </svg>
    );
  };

  return (
    <div className={`ei-card ${compact ? 'ei-compact' : ''}`}>
      <div className="ei-header">
        <PieChart size={20} className="ei-header-icon" />
        <h3 className="ei-title">Error Insights</h3>
      </div>
      <div className="ei-top-section">
        {renderDonut()}
        <div className="ei-top-message">
          <span className="ei-highlight" style={{ color: topInsight.color }}>
            {topInsight.icon} {topInsight.label}
          </span>
          <span className="ei-desc">
            are your most common errors ({topInsight.percentage}%)
          </span>
        </div>
      </div>
      <div className="ei-categories">
        {insights.slice(0, compact ? 3 : undefined).map(ins => (
          <div key={ins.category} className="ei-category">
            <button className="ei-cat-btn"
              onClick={() => setExpanded(expanded === ins.category ? null : ins.category)}>
              <div className="ei-cat-left">
                <span className="ei-cat-dot" style={{ background: ins.color }} />
                <span>{ins.icon}</span>
                <span className="ei-cat-label">{ins.label}</span>
              </div>
              <div className="ei-cat-right">
                <span className="ei-cat-count">{ins.count}</span>
                <span className="ei-cat-pct">{ins.percentage}%</span>
                <ChevronRight size={14}
                  className={`ei-chevron ${expanded === ins.category ? 'open' : ''}`} />
              </div>
            </button>
            {expanded === ins.category && ins.examples.length > 0 && (
              <div className="ei-examples">
                {ins.examples.map((ex, i) => (
                  <span key={i} className="ei-example-tag">{ex}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
