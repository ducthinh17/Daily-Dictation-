import { useState } from 'react';
import { CheckCircle2, ArrowRight, Volume2, Eye, EyeOff, Target, AlertCircle, Pause } from 'lucide-react';
import './CompletedSegmentView.css';

interface CompletedSegmentViewProps {
  segmentIndex: number;
  totalSegments: number;
  segmentText: string;
  attempts: number;
  mistakes: number;
  isPlaying: boolean;
  onReplay: () => void;
  onResume: () => void;
}

export function CompletedSegmentView({
  segmentIndex,
  totalSegments,
  segmentText,
  attempts,
  mistakes,
  isPlaying,
  onReplay,
  onResume,
}: CompletedSegmentViewProps) {
  const [textRevealed, setTextRevealed] = useState(false);

  return (
    <div className="completed-segment-view">
      {/* Header: badge + stats */}
      <div className="csv-header">
        <div className="csv-completed-badge">
          <CheckCircle2 size={14} />
          Completed · Segment {segmentIndex + 1} of {totalSegments}
        </div>

        <div className="csv-stats">
          <span className="csv-stat-chip attempts">
            <Target size={12} />
            {attempts} attempt{attempts !== 1 ? 's' : ''}
          </span>
          {mistakes > 0 && (
            <span className="csv-stat-chip mistakes">
              <AlertCircle size={12} />
              {mistakes} mistake{mistakes !== 1 ? 's' : ''}
            </span>
          )}
          {mistakes === 0 && (
            <span className="csv-stat-chip" style={{ color: 'var(--color-success)', borderColor: 'rgba(34,197,94,0.3)' }}>
              <CheckCircle2 size={12} />
              Perfect!
            </span>
          )}
        </div>
      </div>

      {/* Audio replay + resume */}
      <div className="csv-audio-panel">
        <button
          className={`csv-replay-btn${isPlaying ? ' playing' : ''}`}
          onClick={onReplay}
          title="Replay audio for this segment"
        >
          {isPlaying ? <Pause size={18} /> : <Volume2 size={18} />}
          {isPlaying ? 'Playing…' : 'Replay Audio'}
        </button>

        <div className="csv-divider" />

        <button className="csv-resume-btn" onClick={onResume}>
          <ArrowRight size={16} />
          Resume Practice
        </button>
      </div>

      {/* Revealed text */}
      <div className="csv-text-panel">
        <div className="csv-text-label">
          <span>Transcript</span>
          <button
            className="csv-reveal-toggle"
            onClick={() => setTextRevealed(v => !v)}
          >
            {textRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
            {textRevealed ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className={`csv-segment-text${textRevealed ? '' : ' blurred'}`}>
          {segmentText}
        </p>
      </div>
    </div>
  );
}
