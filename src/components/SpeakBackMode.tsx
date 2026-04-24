import { useState, useEffect, useCallback } from 'react';
import { Mic, Square, RefreshCcw, AlertCircle, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { scorePronunciation, type PronunciationResult, type WordScore } from '../utils/pronunciationScorer';
import { Button } from './ui/Button';
import './SpeakBackMode.css';

interface SpeakBackModeProps {
  expectedText: string;
  language: string;
  onComplete: (accuracy: number) => void;
  onReplayAudio?: () => void;
}

type Phase = 'listen' | 'speak' | 'result';

export function SpeakBackMode({ expectedText, language, onComplete, onReplayAudio }: SpeakBackModeProps) {
  const recognitionLang = language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';
  
  const {
    isListening,
    isProcessing,
    fullTranscript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition(recognitionLang, { autoStopMs: 2500 });

  const [phase, setPhase] = useState<Phase>('listen');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [showExpected, setShowExpected] = useState(false);

  // When listening and processing stops and we have transcript, auto-score
  useEffect(() => {
    if (!isListening && !isProcessing && fullTranscript && phase === 'speak') {
      const scoreResult = scorePronunciation(expectedText, fullTranscript);
      setResult(scoreResult);
      setPhase('result');
      onComplete(scoreResult.overallScore);
    }
  }, [isListening, isProcessing, fullTranscript, phase, expectedText, onComplete]);

  const handleStartSpeaking = useCallback(() => {
    setPhase('speak');
    startListening();
  }, [startListening]);

  const handleStopSpeaking = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const handleTryAgain = useCallback(() => {
    resetTranscript();
    setResult(null);
    setPhase('listen');
    setShowExpected(false);
  }, [resetTranscript]);

  if (!isSupported) {
    return (
      <div className="speakback-mode error">
        <AlertCircle size={24} color="var(--color-error)" />
        <p>Speech recognition is not supported in your browser. Please try Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="speakback-mode">
      {/* Phase: Listen */}
      {phase === 'listen' && (
        <div className="sb-phase sb-listen">
          <div className="sb-phase-icon">🎧</div>
          <h3>Step 1: Listen to the sentence</h3>
          <p className="sb-hint">Play the audio above, then speak it back.</p>
          
          {onReplayAudio && (
            <Button size="md" variant="secondary" onClick={onReplayAudio} className="sb-replay-btn">
              <Volume2 size={18} /> Replay Audio
            </Button>
          )}

          <div className="sb-divider" />

          <Button size="lg" onClick={handleStartSpeaking} className="sb-start-btn">
            <Mic size={22} /> Start Speaking
          </Button>
        </div>
      )}

      {/* Phase: Speaking */}
      {phase === 'speak' && (
        <div className="sb-phase sb-speaking">
          <div className="sb-mic-ring">
            <div className="sb-mic-dot" />
          </div>
          
          {isListening ? (
            <>
              <p className="sb-listening-text">
                {fullTranscript || 'Listening... speak now'}
              </p>
              <Button size="lg" variant="danger" onClick={handleStopSpeaking} className="sb-stop-btn">
                <Square size={18} fill="currentColor" /> Done
              </Button>
            </>
          ) : (
            <p className="sb-processing">Processing...</p>
          )}

          {error && <p className="sb-error">{error}</p>}
        </div>
      )}

      {/* Phase: Result */}
      {phase === 'result' && result && (
        <div className="sb-phase sb-result">
          {/* Score circle */}
          <div className="sb-score-display">
            <div className={`sb-score-circle ${
              result.overallScore >= 90 ? 'excellent' :
              result.overallScore >= 70 ? 'good' :
              result.overallScore >= 50 ? 'fair' : 'poor'
            }`}>
              <span className="sb-score-value">{result.overallScore}</span>
              <span className="sb-score-percent">%</span>
            </div>
            <div className="sb-score-label">
              {result.overallScore >= 90 ? 'Excellent! 🎉' :
               result.overallScore >= 70 ? 'Good! 👍' :
               result.overallScore >= 50 ? 'Keep practicing' : 'Try again'}
            </div>
            <div className="sb-score-detail">
              {result.wordsCorrect}/{result.wordsTotal} words
              {confidence > 0 && <span> · {confidence}% confidence</span>}
            </div>
          </div>

          {/* Word-by-word diff */}
          <div className="sb-word-diff">
            <div className="sb-diff-header">
              <span>Word-by-Word Comparison</span>
              <button className="sb-toggle-expected" onClick={() => setShowExpected(!showExpected)}>
                {showExpected ? 'Hide' : 'Show'} Expected
              </button>
            </div>
            <div className="sb-diff-words">
              {result.wordScores.map((ws, i) => (
                <WordDiffChip key={i} score={ws} showExpected={showExpected} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="sb-result-actions">
            <Button variant="secondary" onClick={handleTryAgain}>
              <RefreshCcw size={16} /> Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WordDiffChip({ score, showExpected }: { score: WordScore, showExpected: boolean }) {
  const getStatusClass = () => {
    switch (score.status) {
      case 'correct': return 'ws-correct';
      case 'close': return 'ws-close';
      case 'wrong': return 'ws-wrong';
      case 'missing': return 'ws-missing';
      case 'extra': return 'ws-extra';
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
    <div className={`sb-word-chip ${getStatusClass()}`}>
      <span className="sb-word-icon">{getIcon()}</span>
      <span className="sb-word-text">
        {score.status === 'missing' ? score.expected : 
         score.status === 'extra' ? score.spoken : 
         score.spoken || score.expected}
      </span>
      {showExpected && score.status !== 'correct' && score.status !== 'extra' && score.expected && (
        <span className="sb-word-expected">→ {score.expected}</span>
      )}
    </div>
  );
}
