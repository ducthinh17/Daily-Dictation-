import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, RefreshCcw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { scorePronunciation, type PronunciationResult, type WordScore } from '../utils/pronunciationScorer';
import { Button } from './ui/Button';
import './ShadowingMode.css';

interface ShadowingModeProps {
  expectedText: string;
  language: string;
  onComplete: (accuracy: number) => void;
  onTryAgain: () => void;
  isComplete: boolean;
  score?: number | null;
}

export function ShadowingMode({ expectedText, language, onComplete, onTryAgain, isComplete, score }: ShadowingModeProps) {
  const recognitionLang = language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';
  
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

  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [showExpected, setShowExpected] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard: requires user to explicitly record in this cycle before scoring can fire.
  // This prevents the race condition where resetting isComplete→false causes the
  // scoring effect to fire with stale fullTranscript before resetTranscript() takes effect.
  const userDidRecordRef = useRef(false);

  // Recording timer + track that user started recording
  useEffect(() => {
    if (isListening) {
      userDidRecordRef.current = true;
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  // Reset all local state when parent resets isComplete (e.g. Next segment, Try Again)
  useEffect(() => {
    if (!isComplete) {
      userDidRecordRef.current = false;
      setResult(null);
      setShowExpected(false);
      resetTranscript();
    }
  }, [isComplete, resetTranscript]);

  // Calculate accuracy when processing finishes — ONLY after user recorded in this cycle
  useEffect(() => {
    if (!isListening && !isProcessing && fullTranscript && !isComplete && userDidRecordRef.current) {
      // Use the same pronunciation scorer as SpeakBackMode for word-by-word diff
      const scoreResult = scorePronunciation(expectedText, fullTranscript);
      setResult(scoreResult);
      
      // Prevent double-fire: clear the flag after scoring
      userDidRecordRef.current = false;
      onComplete(scoreResult.overallScore);
    }
  }, [isListening, isProcessing, fullTranscript, isComplete, expectedText, onComplete]);

  const handleStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleTryAgain = useCallback(() => {
    // Reset local state
    resetTranscript();
    setResult(null);
    setShowExpected(false);
    setRecordingSeconds(0);
    userDidRecordRef.current = false;
    // Tell parent to reset isComplete and score
    onTryAgain();
  }, [resetTranscript, onTryAgain]);

  const handleStartAfterReset = useCallback(() => {
    startListening();
  }, [startListening]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
            {!isListening && !isProcessing ? (
              <Button size="lg" onClick={handleStartAfterReset} className="mic-btn start" style={{ borderRadius: '50px', padding: '16px 32px' }}>
                <Mic size={24} style={{ marginRight: '8px' }} />
                Start Speaking
              </Button>
            ) : isListening ? (
              <div className="shadowing-recording-group">
                <div className="recording-timer">
                  <span className="recording-dot" />
                  <span className="recording-time">{formatTime(recordingSeconds)}</span>
                </div>
                <Button size="lg" onClick={handleStop} variant="danger" className="mic-btn stop" style={{ borderRadius: '50px', padding: '16px 32px' }}>
                  <Square size={20} style={{ marginRight: '8px' }} fill="currentColor" />
                  Stop Recording
                </Button>
              </div>
            ) : (
              /* isProcessing */
              <div className="shadowing-processing">
                <div className="processing-spinner" />
                <span>Analyzing your speech...</span>
              </div>
            )}
          </div>
          
          <div className={`shadowing-transcript ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}>
            {error ? (
              <span className="error-text">{error}</span>
            ) : isListening ? (
              <div className="listening-indicator">
                <div className="sound-wave">
                  <span /><span /><span /><span /><span />
                </div>
                <span className="placeholder">Listening... speak now</span>
              </div>
            ) : (
              <span className="placeholder">Click the microphone when ready to speak</span>
            )}
          </div>
        </div>
      ) : (
        <div className="shadowing-result">
          {/* Score circle */}
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
            <div className="score-feedback">
              {score && score >= 90 ? 'Excellent! 🎉' :
               score && score >= 70 ? 'Good job! 👍' :
               score && score >= 50 ? 'Keep practicing 💪' : 'Try again 🔄'}
            </div>
            {result && (
              <div className="score-detail">
                {result.wordsCorrect}/{result.wordsTotal} words matched
              </div>
            )}
          </div>

          {/* Word-by-word comparison */}
          {result && result.wordScores.length > 0 && (
            <div className="shadowing-word-diff">
              <div className="diff-header">
                <span>Word-by-Word Comparison</span>
                <button className="toggle-expected-btn" onClick={() => setShowExpected(!showExpected)}>
                  {showExpected ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showExpected ? 'Hide' : 'Show'} Expected
                </button>
              </div>
              <div className="diff-words">
                {result.wordScores.map((ws, i) => (
                  <ShadowWordChip key={i} score={ws} showExpected={showExpected} />
                ))}
              </div>
            </div>
          )}

          {/* Your transcript */}
          {fullTranscript && (
            <div className="your-transcript">
              <span className="transcript-label">You said:</span>
              <span className="transcript-value">"{fullTranscript}"</span>
            </div>
          )}
          
          <div className="result-actions">
            <Button variant="secondary" onClick={handleTryAgain}>
              <RefreshCcw size={16} /> Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShadowWordChip({ score, showExpected }: { score: WordScore, showExpected: boolean }) {
  const getStatusClass = () => {
    switch (score.status) {
      case 'correct': return 'sw-correct';
      case 'close': return 'sw-close';
      case 'wrong': return 'sw-wrong';
      case 'missing': return 'sw-missing';
      case 'extra': return 'sw-extra';
    }
  };

  const getIcon = () => {
    switch (score.status) {
      case 'correct': return '✅';
      case 'close': return '⚠️';
      case 'wrong': return '❌';
      case 'missing': return '⬜';
      case 'extra': return '➕';
    }
  };

  return (
    <div className={`sw-word-chip ${getStatusClass()}`}>
      <span className="sw-word-icon">{getIcon()}</span>
      <span className="sw-word-text">
        {score.status === 'missing' ? score.expected : 
         score.status === 'extra' ? score.spoken : 
         score.spoken || score.expected}
      </span>
      {showExpected && score.status !== 'correct' && score.status !== 'extra' && score.expected && (
        <span className="sw-word-expected">→ {score.expected}</span>
      )}
    </div>
  );
}
