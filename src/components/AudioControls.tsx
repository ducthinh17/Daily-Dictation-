import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import './AudioControls.css';

interface AudioControlsProps {
  isPlaying: boolean;
  playbackRate: number;
  onTogglePlayPause: () => void;
  onReplay: () => void;
  onChangeSpeed: (rate: number) => void;
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export function AudioControls({
  isPlaying,
  playbackRate,
  onTogglePlayPause,
  onReplay,
  onChangeSpeed
}: AudioControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="audio-controls glass-panel">
      <button 
        className="control-btn" 
        onClick={onReplay}
        title="Replay from start (Ctrl)"
      >
        <RotateCcw size={20} />
      </button>
      
      <button 
        className="control-btn play-btn" 
        onClick={onTogglePlayPause}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
      </button>
      
      <div className="speed-control-wrapper" ref={menuRef}>
        <button 
          className={`control-btn ${playbackRate !== 1 ? 'active' : ''}`} 
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          title="Playback speed"
        >
          <Volume2 size={20} />
          <span className="speed-badge">{playbackRate}x</span>
        </button>
        
        {showSpeedMenu && (
          <div className="speed-popover glass-panel">
            {SPEEDS.map(rate => (
              <button
                key={rate}
                className={`speed-option ${playbackRate === rate ? 'selected' : ''}`}
                onClick={() => {
                  onChangeSpeed(rate);
                  setShowSpeedMenu(false);
                }}
              >
                {rate.toFixed(2)}x
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
