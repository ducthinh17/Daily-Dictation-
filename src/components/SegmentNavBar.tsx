import { useRef, useEffect } from 'react';
import './SegmentNavBar.css';

interface SegmentNavBarProps {
  totalSegments: number;
  currentIndex: number;
  completedSegments: number[];
  /** Called when user clicks a completed dot to jump to review it */
  onViewCompleted: (index: number) => void;
  /** The index currently being VIEWED (may differ from active practice index) */
  viewingIndex?: number | null;
}

type DotState = 'completed' | 'current' | 'pending';

function getDotState(
  index: number,
  currentIndex: number,
  completedSegments: number[]
): DotState {
  if (completedSegments.includes(index)) return 'completed';
  if (index === currentIndex) return 'current';
  return 'pending';
}

const COMPACT_THRESHOLD = 40;

export function SegmentNavBar({
  totalSegments,
  currentIndex,
  completedSegments,
  onViewCompleted,
  viewingIndex,
}: SegmentNavBarProps) {
  const dotContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep current dot visible
  useEffect(() => {
    if (totalSegments > COMPACT_THRESHOLD) return;
    const container = dotContainerRef.current;
    if (!container) return;
    const activeIndex = viewingIndex ?? currentIndex;
    const dot = container.children[activeIndex] as HTMLElement | undefined;
    dot?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentIndex, viewingIndex, totalSegments]);

  const completedCount = completedSegments.length;

  /* ── COMPACT MODE for large lessons ── */
  if (totalSegments > COMPACT_THRESHOLD) {
    const completedPct = (completedCount / totalSegments) * 100;
    const currentPct = ((viewingIndex ?? currentIndex) / totalSegments) * 100;

    return (
      <div className="segment-nav-bar">
        <div className="segment-nav-compact">
          <span className="compact-range">
            {completedCount} / {totalSegments} done
          </span>
          <div className="compact-bar">
            <div
              className="compact-bar-fill-completed"
              style={{ width: `${completedPct}%` }}
            />
            <div
              className="compact-bar-fill-current"
              style={{ left: `${currentPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ── DOT MODE for smaller lessons ── */
  return (
    <div className="segment-nav-bar">
      <div className="segment-nav-dots" ref={dotContainerRef}>
        {Array.from({ length: totalSegments }, (_, i) => {
          const state = getDotState(i, currentIndex, completedSegments);
          const isViewing = (viewingIndex ?? currentIndex) === i;

          return (
            <button
              key={i}
              className={`seg-dot ${state}${isViewing && viewingIndex != null ? ' viewing' : ''}`}
              style={isViewing && viewingIndex != null && state === 'completed'
                ? { outline: '2px solid #22c55e', outlineOffset: '2px' }
                : undefined
              }
              title={
                state === 'completed'
                  ? `Segment ${i + 1} — Completed (click to review)`
                  : state === 'current'
                  ? `Segment ${i + 1} — Current`
                  : `Segment ${i + 1} — Not started`
              }
              onClick={() => {
                if (state === 'completed') onViewCompleted(i);
              }}
              disabled={state !== 'completed'}
              aria-label={`Segment ${i + 1}: ${state}`}
            />
          );
        })}
      </div>

      {/* Legend — only show if not too many dots */}
      {totalSegments <= 20 && (
        <div className="segment-nav-legend">
          <span className="snl-item"><span className="snl-dot completed" />Done</span>
          <span className="snl-item"><span className="snl-dot current" />Current</span>
          <span className="snl-item"><span className="snl-dot pending" />Pending</span>
        </div>
      )}
    </div>
  );
}
