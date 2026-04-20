import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Zap, BookOpen, RefreshCcw,
  Volume2, Check, X, ArrowRight, Sparkles
} from 'lucide-react';
import { db } from '../db';
import { dictionaryService } from '../utils/dictionaryService';
import type { DictionaryEntry } from '../utils/dictionaryService';
import { Button } from './ui/Button';
import './QuickPracticeWidget.css';

type WidgetMode = 'word-of-day' | 'quick-review';

interface QuickReviewState {
  words: { expected: string; typed: string; count: number }[];
  currentIdx: number;
  input: string;
  results: ('correct' | 'wrong' | null)[];
  done: boolean;
}

export function QuickPracticeWidget() {
  const [mode, setMode] = useState<WidgetMode>('word-of-day');

  // Word of the Day
  const [wotdWord, setWotdWord] = useState<string | null>(null);
  const [wotdEntry, setWotdEntry] = useState<DictionaryEntry | null>(null);
  const [wotdLoading, setWotdLoading] = useState(false);

  // Quick Review
  const [review, setReview] = useState<QuickReviewState | null>(null);

  const allErrors = useLiveQuery(() =>
    db.wordErrors.orderBy('timestamp').reverse().limit(200).toArray()
  );

  // ── Word of the Day ──
  const pickRandomWord = useCallback(async () => {
    if (!allErrors || allErrors.length === 0) return;
    setWotdLoading(true);

    // Pick a random error word
    const words = [...new Set(allErrors.map(e => e.expectedWord?.toLowerCase()).filter(Boolean))];
    if (words.length === 0) { setWotdLoading(false); return; }
    
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setWotdWord(randomWord);

    // Fetch definition
    const entry = await dictionaryService.fetchWord(randomWord);
    setWotdEntry(entry);
    setWotdLoading(false);
  }, [allErrors]);

  useEffect(() => {
    if (allErrors && allErrors.length > 0 && !wotdWord) {
      pickRandomWord();
    }
  }, [allErrors, wotdWord, pickRandomWord]);

  // ── Quick Review ──
  const startQuickReview = useCallback(() => {
    if (!allErrors || allErrors.length === 0) return;

    // Aggregate and pick top 5 most-missed words
    const errorMap = new Map<string, { expected: string; typed: string; count: number }>();
    allErrors.forEach(err => {
      const w = err.expectedWord?.toLowerCase();
      if (!w) return;
      if (!errorMap.has(w)) {
        errorMap.set(w, { expected: w, typed: err.typedWord || '', count: 0 });
      }
      errorMap.get(w)!.count++;
    });

    const sorted = Array.from(errorMap.values()).sort((a, b) => b.count - a.count);
    const selected = sorted.slice(0, 5);

    if (selected.length === 0) return;

    setReview({
      words: selected,
      currentIdx: 0,
      input: '',
      results: selected.map(() => null),
      done: false
    });
    setMode('quick-review');
  }, [allErrors]);

  const handleReviewInput = (value: string) => {
    if (!review) return;
    setReview({ ...review, input: value });
  };

  const checkReviewWord = () => {
    if (!review) return;
    const current = review.words[review.currentIdx];
    const isCorrect = review.input.trim().toLowerCase() === current.expected.toLowerCase();
    
    const newResults = [...review.results];
    newResults[review.currentIdx] = isCorrect ? 'correct' : 'wrong';

    const nextIdx = review.currentIdx + 1;
    const isDone = nextIdx >= review.words.length;

    setReview({
      ...review,
      input: isDone ? review.input : '',
      results: newResults,
      currentIdx: isDone ? review.currentIdx : nextIdx,
      done: isDone
    });
  };

  const hasErrors = allErrors && allErrors.length > 0;

  // ── Empty State ──
  if (!hasErrors) {
    return (
      <div className="qp-widget">
        <div className="qp-widget-header">
          <Sparkles size={20} className="qp-header-icon" />
          <h3 className="qp-widget-title">Quick Practice</h3>
        </div>
        <div className="qp-empty">
          <BookOpen size={32} className="qp-empty-icon" />
          <p>Complete a few dictation lessons first to unlock quick practice!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="qp-widget">
      <div className="qp-widget-header">
        <Sparkles size={20} className="qp-header-icon" />
        <h3 className="qp-widget-title">Quick Practice</h3>
        <div className="qp-mode-tabs">
          <button
            className={`qp-mode-tab ${mode === 'word-of-day' ? 'active' : ''}`}
            onClick={() => setMode('word-of-day')}
          >
            <BookOpen size={14} /> Word
          </button>
          <button
            className={`qp-mode-tab ${mode === 'quick-review' ? 'active' : ''}`}
            onClick={() => { setMode('quick-review'); if (!review) startQuickReview(); }}
          >
            <Zap size={14} /> Quick Review
          </button>
        </div>
      </div>

      {/* ── Word of the Day ── */}
      {mode === 'word-of-day' && (
        <div className="qp-card qp-wotd">
          {wotdLoading ? (
            <div className="qp-loading">
              <div className="qp-spinner" />
              <span>Finding a word...</span>
            </div>
          ) : wotdWord ? (
            <>
              <div className="qp-wotd-word-row">
                <h2 className="qp-wotd-word">{wotdWord}</h2>
                <button
                  className="qp-icon-btn"
                  onClick={() => dictionaryService.playAudio(undefined, wotdWord, 'US')}
                  title="Listen"
                >
                  <Volume2 size={18} />
                </button>
              </div>

              {wotdEntry ? (
                <div className="qp-wotd-details">
                  {wotdEntry.phonetics.length > 0 && wotdEntry.phonetics[0].text && (
                    <span className="qp-wotd-phonetic">{wotdEntry.phonetics[0].text}</span>
                  )}
                  {wotdEntry.meanings.slice(0, 2).map((m, i) => (
                    <div key={i} className="qp-wotd-meaning">
                      <span className="qp-wotd-pos">{m.partOfSpeech}</span>
                      <span className="qp-wotd-def">
                        {m.definitions[0]?.definition}
                      </span>
                      {m.definitions[0]?.example && (
                        <span className="qp-wotd-example">"{m.definitions[0].example}"</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="qp-wotd-no-def">Definition not available offline.</p>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="qp-refresh-btn"
                onClick={pickRandomWord}
              >
                <RefreshCcw size={14} /> New Word
              </Button>
            </>
          ) : null}
        </div>
      )}

      {/* ── Quick Review ── */}
      {mode === 'quick-review' && (
        <div className="qp-card qp-review">
          {!review ? (
            <div className="qp-review-start">
              <Zap size={32} className="qp-review-start-icon" />
              <p>Test yourself on your most-missed words.</p>
              <Button variant="primary" size="sm" onClick={startQuickReview}>
                Start Quick Review
              </Button>
            </div>
          ) : review.done ? (
            <div className="qp-review-done">
              <div className="qp-review-done-icon">🎉</div>
              <h4>Review Complete!</h4>
              <div className="qp-review-score">
                {review.results.filter(r => r === 'correct').length} / {review.words.length} correct
              </div>
              <div className="qp-review-results-row">
                {review.words.map((w, i) => (
                  <span
                    key={i}
                    className={`qp-review-dot ${review.results[i]}`}
                    title={w.expected}
                  >
                    {review.results[i] === 'correct' ? <Check size={12} /> : <X size={12} />}
                  </span>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setReview(null); startQuickReview(); }}
              >
                <RefreshCcw size={14} /> Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="qp-review-progress">
                {review.words.map((_, i) => (
                  <div
                    key={i}
                    className={`qp-review-pip ${
                      review.results[i] === 'correct'
                        ? 'correct'
                        : review.results[i] === 'wrong'
                        ? 'wrong'
                        : i === review.currentIdx
                        ? 'active'
                        : ''
                    }`}
                  />
                ))}
              </div>

              <div className="qp-review-prompt">
                <span className="qp-review-label">
                  You've typed <strong>"{review.words[review.currentIdx].typed}"</strong> — what's the correct word?
                </span>
                <span className="qp-review-hint">
                  Missed {review.words[review.currentIdx].count}x
                </span>
              </div>

              <div className="qp-review-input-row">
                <input
                  className="qp-review-input"
                  value={review.input}
                  onChange={e => handleReviewInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && checkReviewWord()}
                  placeholder="Type the correct word..."
                  autoFocus
                />
                <Button variant="primary" size="sm" onClick={checkReviewWord}>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
