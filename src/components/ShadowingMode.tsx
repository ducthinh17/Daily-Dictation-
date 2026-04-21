import { useEffect } from 'react';
import { Mic, Square, RefreshCcw, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Button } from './ui/Button';
import './ShadowingMode.css';

interface ShadowingModeProps {
  expectedText: string;
  language: string;
  onComplete: (accuracy: number) => void;
  isComplete: boolean;
  score?: number | null;
}

export function ShadowingMode({ expectedText, language, onComplete, isComplete, score }: ShadowingModeProps) {
  // Map our language to SpeechRecognition format
  const recognitionLang = language === 'zh' ? 'zh-CN' : 'en-US';
  
  const {
    isListening,
    isProcessing,
    fullTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition(recognitionLang);

  useEffect(() => {
    // If it was complete and then reset
    if (!isComplete) {
      resetTranscript();
    }
  }, [isComplete, resetTranscript]);

  const handleStop = () => {
    stopListening();
  };

  // Calculate accuracy when processing finishes
  useEffect(() => {
    // We only want to calculate if we just finished listening and processing, and we have a transcript
    // But since `isComplete` will become true when `onComplete` is called, we check `!isComplete`
    if (!isListening && !isProcessing && fullTranscript && !isComplete) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
      const spokenWords = fullTranscript.trim().split(/\s+/).filter(Boolean);
      
      if (expectedWords.length === 0) {
        onComplete(0);
        return;
      }
      
      let matches = 0;
      const spokenWordsNormalized = spokenWords.map(normalize);
      
      expectedWords.forEach(word => {
        const normWord = normalize(word);
        const index = spokenWordsNormalized.indexOf(normWord);
        if (index !== -1) {
          matches++;
          spokenWordsNormalized.splice(index, 1);
        }
      });
      
      const accuracy = Math.round((matches / expectedWords.length) * 100);
      onComplete(Math.min(100, Math.max(0, accuracy)));
    }
  }, [isListening, isProcessing, fullTranscript, isComplete, expectedText, onComplete]);

  if (!isSupported) {
    return (
      <div className="shadowing-mode error">
        <AlertCircle size={24} color="var(--color-error)" />
        <p>Speech recognition is not supported in your browser. Please try Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="shadowing-mode">
      {!isComplete ? (
        <div className="shadowing-active">
          <div className="shadowing-expected">
            <h3>Listen and Repeat</h3>
            <p>"{expectedText}"</p>
          </div>
          
          <div className="shadowing-controls">
            {!isListening ? (
              <Button size="lg" onClick={startListening} className="mic-btn start" style={{ borderRadius: '50px', padding: '16px 32px' }}>
                <Mic size={24} style={{ marginRight: '8px' }} />
                Start Speaking
              </Button>
            ) : (
              <Button size="lg" onClick={handleStop} variant="danger" className="mic-btn stop" style={{ borderRadius: '50px', padding: '16px 32px' }}>
                <Square size={20} style={{ marginRight: '8px' }} fill="currentColor" />
                Stop Recording
              </Button>
            )}
          </div>
          
          <div className={`shadowing-transcript ${isListening ? 'listening' : ''}`}>
            {error ? (
              <span className="error-text">{error}</span>
            ) : isProcessing ? (
              <span className="placeholder processing">Processing audio...</span>
            ) : fullTranscript ? (
              <span className="transcript-text">{fullTranscript}</span>
            ) : isListening ? (
              <span className="placeholder">Listening...</span>
            ) : (
              <span className="placeholder">Click the microphone when ready to speak</span>
            )}
          </div>
        </div>
      ) : (
        <div className="shadowing-result">
          <div className="result-score">
            <div className="score-circle" style={{ 
              borderColor: score && score >= 90 ? 'var(--color-success)' : 
                           score && score >= 70 ? 'var(--color-warning)' : 'var(--color-error)',
              color: score && score >= 90 ? 'var(--color-success)' : 
                     score && score >= 70 ? 'var(--color-warning)' : 'var(--color-error)'
            }}>
              <span className="score-value">{score}%</span>
              <span className="score-label">Accuracy</span>
            </div>
          </div>
          
          <div className="result-actions">
            <Button variant="secondary" onClick={() => {
              resetTranscript();
              // Trigger a small delay so parent can reset state
              setTimeout(() => startListening(), 100);
            }}>
              <RefreshCcw size={16} /> Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
