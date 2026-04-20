import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, BookOpen, Clock, Target } from 'lucide-react';
import { SVGLineChart } from '../components/SVGLineChart';
import {
  getAccuracyTrend, getSessionVolume, getVocabularyGrowth,
  getSessionDurationTrend, getHourlyPerformance,
  type TrendPoint
} from '../db/analyticsQueries';
import './AnalyticsPage.css';

export function AnalyticsPage() {
  const [accuracy, setAccuracy] = useState<TrendPoint[]>([]);
  const [volume, setVolume] = useState<TrendPoint[]>([]);
  const [vocab, setVocab] = useState<TrendPoint[]>([]);
  const [duration, setDuration] = useState<TrendPoint[]>([]);
  const [hourly, setHourly] = useState<{ hour: number; avgAccuracy: number; count: number }[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    getAccuracyTrend(days).then(setAccuracy);
    getSessionVolume(days).then(setVolume);
    getVocabularyGrowth().then(setVocab);
    getSessionDurationTrend(days).then(setDuration);
    getHourlyPerformance().then(setHourly);
  }, [days]);

  const activeHours = hourly.filter(h => h.count > 0);
  const bestHour = activeHours.length > 0
    ? activeHours.reduce((a, b) => a.avgAccuracy > b.avgAccuracy ? a : b)
    : null;

  return (
    <div className="analytics-page page-container">
      <header className="page-header">
        <div className="header-title">
          <BarChart3 className="header-icon" size={36} />
          <h1>Analytics</h1>
        </div>
        <div className="ana-period-tabs">
          {[7, 14, 30, 90].map(d => (
            <button key={d} className={`ana-period-btn ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </header>

      <div className="ana-grid">
        <div className="ana-card">
          <div className="ana-card-header">
            <TrendingUp size={18} className="ana-card-icon" style={{ color: '#10b981' }} />
            <h3>Accuracy Trend</h3>
          </div>
          <SVGLineChart data={accuracy} color="#10b981" label="" valueFormatter={v => `${v}%`} />
        </div>

        <div className="ana-card">
          <div className="ana-card-header">
            <Target size={18} className="ana-card-icon" style={{ color: '#3b82f6' }} />
            <h3>Practice Volume</h3>
          </div>
          <SVGLineChart data={volume} color="#3b82f6" valueFormatter={v => `${v}`} />
        </div>

        <div className="ana-card">
          <div className="ana-card-header">
            <BookOpen size={18} className="ana-card-icon" style={{ color: '#8b5cf6' }} />
            <h3>Vocabulary Growth</h3>
          </div>
          <SVGLineChart data={vocab} color="#8b5cf6" valueFormatter={v => `${v}`} />
        </div>

        <div className="ana-card">
          <div className="ana-card-header">
            <Clock size={18} className="ana-card-icon" style={{ color: '#f59e0b' }} />
            <h3>Avg Session Duration</h3>
          </div>
          <SVGLineChart data={duration} color="#f59e0b" valueFormatter={v => `${v}m`} />
        </div>

        {/* Best Practice Time */}
        <div className="ana-card ana-card-wide">
          <div className="ana-card-header">
            <Clock size={18} className="ana-card-icon" style={{ color: '#06b6d4' }} />
            <h3>Best Practice Time</h3>
            {bestHour && (
              <span className="ana-best-badge">
                Best at {bestHour.hour}:00 ({bestHour.avgAccuracy}% accuracy)
              </span>
            )}
          </div>
          <div className="ana-hourly-grid">
            {hourly.map((h, i) => {
              const intensity = h.count > 0 ? Math.min(h.avgAccuracy / 100, 1) : 0;
              return (
                <div key={i} className="ana-hour-cell" title={`${i}:00 — ${h.count} sessions, ${h.avgAccuracy}% avg`}>
                  <div
                    className="ana-hour-bar"
                    style={{
                      height: `${Math.max(intensity * 100, 4)}%`,
                      background: h.count > 0
                        ? `color-mix(in srgb, #06b6d4 ${Math.round(intensity * 100)}%, var(--bg-hover))`
                        : 'var(--bg-hover)'
                    }}
                  />
                  <span className="ana-hour-label">{i % 3 === 0 ? `${i}h` : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
