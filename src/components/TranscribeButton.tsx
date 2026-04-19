
import { Wand2, Loader2, AlertCircle } from 'lucide-react';
import type { TranscribeStatus } from '../utils/transcriber';
import './TranscribeButton.css';

interface TranscribeButtonProps {
  status: TranscribeStatus | null;
  onClick: () => void;
  disabled?: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  preparing: 'Preparing audio...',
  uploading: 'Uploading to Groq...',
  transcribing: 'Transcribing with Whisper...',
  processing: 'Building segments...',
  done: 'Transcription complete!',
};

export function TranscribeButton({ status, onClick, disabled }: TranscribeButtonProps) {
  const isProcessing = status !== null && status.phase !== 'done' && status.phase !== 'error';
  const isDone = status?.phase === 'done';
  const isError = status?.phase === 'error';

  return (
    <div className="transcribe-wrapper">
      <button
        className={`transcribe-btn ${isDone ? 'done' : ''} ${isError ? 'error' : ''}`}
        onClick={onClick}
        disabled={disabled || isProcessing}
        type="button"
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="spin" />
            <span>{status ? PHASE_LABELS[status.phase] || 'Processing...' : 'Processing...'}</span>
          </>
        ) : isDone ? (
          <>
            <Wand2 size={20} />
            <span>Re-Transcribe</span>
          </>
        ) : (
          <>
            <Wand2 size={20} />
            <span>Auto Transcribe</span>
          </>
        )}
      </button>

      {isProcessing && (
        <div className="transcribe-progress">
          <div className="progress-bar-animated" />
        </div>
      )}

      {isError && status.phase === 'error' && (
        <div className="transcribe-error">
          <AlertCircle size={14} />
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
