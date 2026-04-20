import { useState, useRef } from 'react';
import { Stethoscope, Volume2, ArrowRight, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  DIAGNOSTIC_SENTENCES, calculateAccuracy, generateReport,
  playDiagnosticSentence, saveDiagnosticResult,
  type DiagnosticReport
} from '../utils/diagnosticTest';
import './DiagnosticPage.css';

type Phase = 'intro' | 'test' | 'result';

export function DiagnosticPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<{ level: number; accuracy: number }[]>([]);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = DIAGNOSTIC_SENTENCES[currentIdx];

  const handleStart = () => {
    setPhase('test');
    setCurrentIdx(0);
    setResults([]);
    setInput('');
    setShowAnswer(false);
    // Preload voices
    window.speechSynthesis?.getVoices();
    setTimeout(() => playDiagnosticSentence(DIAGNOSTIC_SENTENCES[0].text), 500);
  };

  const handleSubmit = () => {
    const accuracy = calculateAccuracy(current.text, input);
    const newResults = [...results, { level: current.level, accuracy }];
    setResults(newResults);
    setShowAnswer(true);
  };

  const handleNext = () => {
    setShowAnswer(false);
    setInput('');
    if (currentIdx < DIAGNOSTIC_SENTENCES.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setTimeout(() => {
        playDiagnosticSentence(DIAGNOSTIC_SENTENCES[nextIdx].text);
        inputRef.current?.focus();
      }, 300);
    } else {
      const r = generateReport(results);
      setReport(r);
      saveDiagnosticResult(r, results);
      setPhase('result');
    }
  };

  if (phase === 'intro') {
    return (
      <div className="diag-page page-container">
        <div className="diag-intro">
          <div className="diag-intro-icon"><Stethoscope size={56} /></div>
          <h1>Listening Diagnostic Test</h1>
          <p>Assess your listening comprehension level with 10 progressively harder sentences.</p>
          <div className="diag-intro-info">
            <div className="diag-info-item"><span>📝</span> 10 sentences</div>
            <div className="diag-info-item"><span>⏱️</span> ~5 minutes</div>
            <div className="diag-info-item"><span>🔊</span> Browser TTS</div>
            <div className="diag-info-item"><span>📊</span> Detailed report</div>
          </div>
          <Button variant="primary" onClick={handleStart} className="diag-start-btn">
            Start Test <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'result' && report) {
    return (
      <div className="diag-page page-container">
        <div className="diag-result">
          <h1>Your Results</h1>
          
          <div className="diag-score-ring">
            <svg viewBox="0 0 120 120" className="diag-score-svg">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={report.overallScore >= 70 ? '#10b981' : report.overallScore >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeDasharray={`${report.overallScore * 3.14} 314`}
                strokeLinecap="round" transform="rotate(-90 60 60)" className="diag-score-arc" />
            </svg>
            <div className="diag-score-text">
              <span className="diag-score-num">{report.overallScore}</span>
              <span className="diag-score-label">Score</span>
            </div>
          </div>

          <div className="diag-level-badge">
            Estimated Level: <strong>{report.estimatedLevel}</strong> / 10
          </div>

          <div className="diag-breakdown">
            <h3>Breakdown</h3>
            {report.breakdown.map((b, i) => (
              <div key={i} className="diag-bd-row">
                <span className="diag-bd-level">Lvl {b.level}</span>
                <span className="diag-bd-cat">{b.category}</span>
                <div className="diag-bd-bar-wrap">
                  <div className="diag-bd-bar" style={{ width: `${b.accuracy}%`, background: b.accuracy >= 70 ? '#10b981' : b.accuracy >= 40 ? '#f59e0b' : '#ef4444' }} />
                </div>
                <span className="diag-bd-pct">{b.accuracy}%</span>
              </div>
            ))}
          </div>

          {report.strengths.length > 0 && (
            <div className="diag-section diag-strengths">
              <h3><CheckCircle size={16} /> Strengths</h3>
              <div className="diag-tags">{report.strengths.map((s, i) => <span key={i} className="diag-tag green">{s}</span>)}</div>
            </div>
          )}
          {report.weaknesses.length > 0 && (
            <div className="diag-section diag-weaknesses">
              <h3><XCircle size={16} /> Needs Work</h3>
              <div className="diag-tags">{report.weaknesses.map((w, i) => <span key={i} className="diag-tag red">{w}</span>)}</div>
            </div>
          )}

          <Button variant="secondary" onClick={handleStart} className="diag-retake-btn">
            <RotateCcw size={16} /> Take Again
          </Button>
        </div>
      </div>
    );
  }

  // Test phase
  const progress = ((currentIdx + (showAnswer ? 1 : 0)) / DIAGNOSTIC_SENTENCES.length) * 100;
  const lastResult = showAnswer ? results[results.length - 1] : null;

  return (
    <div className="diag-page page-container">
      <div className="diag-test">
        <div className="diag-progress-bar">
          <div className="diag-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="diag-test-header">
          <span className="diag-q-num">Question {currentIdx + 1} / {DIAGNOSTIC_SENTENCES.length}</span>
          <span className="diag-q-level">Level {current.level} — {current.category}</span>
        </div>

        <button className="diag-play-btn" onClick={() => playDiagnosticSentence(current.text)}>
          <Volume2 size={32} />
          <span>Play Audio</span>
        </button>

        {!showAnswer ? (
          <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="diag-input-form">
            <input
              ref={inputRef}
              type="text"
              className="diag-input"
              placeholder="Type what you hear..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
            />
            <Button variant="primary" type="submit" disabled={!input.trim()}>
              Check
            </Button>
          </form>
        ) : (
          <div className="diag-answer-section">
            <div className={`diag-accuracy-badge ${lastResult && lastResult.accuracy >= 70 ? 'good' : lastResult && lastResult.accuracy >= 40 ? 'mid' : 'bad'}`}>
              {lastResult?.accuracy}% Accuracy
            </div>
            <div className="diag-answer-compare">
              <div className="diag-expected"><label>Expected:</label><p>{current.text}</p></div>
              <div className="diag-typed"><label>You typed:</label><p>{input || '(empty)'}</p></div>
            </div>
            <Button variant="primary" onClick={handleNext}>
              {currentIdx < DIAGNOSTIC_SENTENCES.length - 1 ? 'Next' : 'See Results'} <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
