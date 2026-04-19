
import type { SegmentWithTime } from '../utils/segmentSplitter';
import './SegmentPreview.css';

interface SegmentPreviewProps {
  segments: string[];
  timedSegments?: SegmentWithTime[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SegmentPreview({ segments, timedSegments }: SegmentPreviewProps) {
  // Use timed segments if available, otherwise plain text segments
  const items = timedSegments || segments.map(text => ({ text, startTime: undefined, endTime: undefined }));
  
  if (items.length === 0) return null;

  return (
    <div className="segment-preview">
      <div className="preview-header">
        <h4>Segment Preview</h4>
        <span className="badge">{items.length} segments</span>
      </div>
      
      <div className="preview-list">
        {items.map((item, index) => (
          <div key={index} className="preview-item glass-panel">
            <span className="item-number">{index + 1}</span>
            <p className="item-text">{typeof item === 'string' ? item : item.text}</p>
            {typeof item !== 'string' && item.startTime !== undefined && item.endTime !== undefined && (
              <span className="item-time">
                {formatTime(item.startTime)} → {formatTime(item.endTime)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
