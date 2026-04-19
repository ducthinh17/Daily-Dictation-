import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Settings as SettingsIcon, Volume2, LayoutDashboard } from 'lucide-react';
import { db } from '../db';
import { useProgress } from '../hooks/useProgress';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { checkAnswer } from '../utils/answerChecker';
import type { CheckResult } from '../types';

import { ProgressBar } from '../components/ui/ProgressBar';
import { AudioControls } from '../components/AudioControls';
import { TypingArea } from '../components/TypingArea';
import { FeedbackDisplay } from '../components/FeedbackDisplay';
import { CompletionModal } from '../components/CompletionModal';
import { Settings } from '../components/Settings';
import { Button } from '../components/ui/Button';
import { CompletedSegmentView } from '../components/CompletedSegmentView';
import { SegmentNavBar } from '../components/SegmentNavBar';
import './PracticePage.css';

export default function PracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const lesson = useLiveQuery(() => lessonId ? db.lessons.get(lessonId) : undefined, [lessonId]);
  const segments = useLiveQuery(() =>
    lessonId ? db.segments.where('lessonId').equals(lessonId).sortBy('index') : [] as import('../types').Segment[],
  [lessonId]);

  const {
    progress,
    draftInput,
    updateDraft,
    recordAttempt,
    advanceSegment,
    completeLesson,
    resetProgress
  } = useProgress(lessonId);

  const {
    isPlaying,
    playbackRate,
    duration,
    togglePlayPause,
    replay,
    changeSpeed,
    seek,
    playSegment,
    replaySegment
  } = useAudioPlayer({ audioBlob: lesson?.audioBlob });

  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ── NEW: which completed segment are we previewing? null = active practice mode
  const [viewingCompletedIndex, setViewingCompletedIndex] = useState<number | null>(null);

  const currentIndex = progress?.currentSegmentIndex || 0;
  const totalSegments = segments?.length || 0;

  // The segment being DISPLAYED (preview OR active)
  const displayIndex = viewingCompletedIndex ?? currentIndex;
  const displaySegment = segments?.[displayIndex];

  // Active segment (the one user is actually practicing)
  const currentSegment = segments?.[currentIndex];

  const isViewingCompleted = viewingCompletedIndex !== null;

  const hasTimestamps = (seg?: typeof displaySegment) =>
    seg?.startTime !== undefined && seg?.endTime !== undefined;

  // ── Play a specific segment by index ──
  const playSegmentByIndex = useCallback((index: number) => {
    const seg = segments?.[index];
    if (!seg) return;
    if (hasTimestamps(seg) && seg.startTime !== undefined && seg.endTime !== undefined) {
      playSegment(seg.startTime, seg.endTime);
    } else if (duration > 0 && totalSegments > 0) {
      const segDuration = duration / totalSegments;
      seek(index * segDuration);
    }
  }, [segments, duration, totalSegments, playSegment, seek]);

  // ── Play the current ACTIVE practice segment ──
  const playCurrentSegment = useCallback(() => {
    playSegmentByIndex(currentIndex);
  }, [currentIndex, playSegmentByIndex]);

  // Auto-play when advancing to a new segment (active practice only)
  useEffect(() => {
    if (currentSegment && duration > 0 && !isViewingCompleted) {
      playCurrentSegment();
    }
  }, [currentIndex, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReplay = useCallback(() => {
    if (isViewingCompleted) {
      playSegmentByIndex(viewingCompletedIndex!);
      return;
    }
    const seg = currentSegment;
    if (hasTimestamps(seg) && seg?.startTime !== undefined && seg?.endTime !== undefined) {
      replaySegment(seg.startTime, seg.endTime);
    } else {
      replay();
    }
  }, [isViewingCompleted, viewingCompletedIndex, currentSegment, playSegmentByIndex, replaySegment, replay]);

  // ── PREV handler ──
  const handlePrev = useCallback(() => {
    const fromIndex = isViewingCompleted ? viewingCompletedIndex! : currentIndex;
    const prevIndex = fromIndex - 1;
    if (prevIndex < 0) return;

    const isCompleted = progress?.completedSegments.includes(prevIndex) ?? false;

    if (isCompleted) {
      // Preview mode — don't mutate DB progress
      setViewingCompletedIndex(prevIndex);
      setCheckResult(null);
      // slight delay so segment loads
      setTimeout(() => playSegmentByIndex(prevIndex), 50);
    } else {
      // Not completed — navigate back in active practice
      setViewingCompletedIndex(null);
      setCheckResult(null);
      advanceSegment(prevIndex);
    }
  }, [isViewingCompleted, viewingCompletedIndex, currentIndex, progress, advanceSegment, playSegmentByIndex]);

  // ── NEXT handler ──
  const handleNext = useCallback(() => {
    if (isViewingCompleted) {
      const nextIndex = viewingCompletedIndex! + 1;
      if (nextIndex > currentIndex) {
        // Back to active practice
        setViewingCompletedIndex(null);
        playCurrentSegment();
        return;
      }
      const isCompleted = progress?.completedSegments.includes(nextIndex) ?? false;
      if (isCompleted) {
        setViewingCompletedIndex(nextIndex);
        setCheckResult(null);
        setTimeout(() => playSegmentByIndex(nextIndex), 50);
      } else {
        // nextIndex === currentIndex → resume active
        setViewingCompletedIndex(null);
        playCurrentSegment();
      }
      return;
    }

    // Active practice: advance forward
    if (currentIndex < totalSegments - 1) {
      advanceSegment(currentIndex + 1);
      setCheckResult(null);
    } else {
      completeLesson();
      setShowCompletion(true);
    }
  }, [isViewingCompleted, viewingCompletedIndex, currentIndex, totalSegments, progress, advanceSegment, completeLesson, playCurrentSegment, playSegmentByIndex]);

  // ── SUBMIT (active practice only) ──
  const handleSubmit = async () => {
    if (!currentSegment || isViewingCompleted) return;

    const result = checkAnswer(draftInput, currentSegment.text);
    setCheckResult(result);

    await recordAttempt(currentIndex, result.correct);

    if (!result.correct && result.wrongPositions && result.wrongPositions.length > 0) {
      const expectedWords = currentSegment.text.trim().split(/\s+/);
      const inputWords = draftInput.trim().split(/\s+/);

      const errors = result.wrongPositions.map(pos => ({
        id: crypto.randomUUID(),
        word: expectedWords[pos] || '',
        expectedWord: expectedWords[pos] || '',
        typedWord: inputWords[pos] || '',
        lessonId: lessonId || '',
        timestamp: Date.now()
      })).filter(e => e.expectedWord.replace(/[^a-zA-Z0-9]/g, ''));

      if (errors.length > 0) {
        await db.wordErrors.bulkAdd(errors);
      }
    }

    if (result.correct) {
      setTimeout(async () => {
        if (currentIndex < totalSegments - 1) {
          await advanceSegment(currentIndex + 1);
          setCheckResult(null);
        } else {
          await completeLesson();

          if (progress && lessonId) {
            const attemptsCount = Object.values(progress.attempts).reduce((a, b) => a + b, 0) + 1;
            const accuracy = Math.round((totalSegments / attemptsCount) * 100);
            await db.sessions.add({
              id: crypto.randomUUID(),
              lessonId,
              startedAt: progress.startedAt,
              endedAt: Date.now(),
              accuracy: Math.min(100, Math.max(0, accuracy)),
              mode: 'dictation'
            });
          }

          setShowCompletion(true);
        }
      }, 1500);
    }
  };

  const handleHint = () => {
    if (!currentSegment || isViewingCompleted) return;

    const expectedWords = currentSegment.text.trim().split(/\s+/);
    const inputWords = draftInput.trim() === '' ? [] : draftInput.trim().split(/\s+/);

    let mismatchIndex = inputWords.length;
    for (let i = 0; i < inputWords.length; i++) {
      const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalize(inputWords[i]) !== normalize(expectedWords[i] || '')) {
        mismatchIndex = i;
        break;
      }
    }

    if (mismatchIndex < expectedWords.length) {
      const correctWord = expectedWords[mismatchIndex];
      const newWords = [...inputWords.slice(0, mismatchIndex), correctWord];
      updateDraft(newWords.join(' ') + ' ');

      setTimeout(() => {
        const textarea = document.querySelector('.typing-area-input') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }, 10);
    }
  };

  const handleHintLetter = () => {
    if (!currentSegment || isViewingCompleted) return;

    const expectedWords = currentSegment.text.trim().split(/\s+/);
    const inputWords = draftInput.trim() === '' ? [] : draftInput.trim().split(/\s+/);

    let mismatchIndex = inputWords.length;
    for (let i = 0; i < inputWords.length; i++) {
      const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalize(inputWords[i]) !== normalize(expectedWords[i] || '')) {
        mismatchIndex = i;
        break;
      }
    }

    if (mismatchIndex < expectedWords.length) {
      const correctWord = expectedWords[mismatchIndex];
      const inputWord = inputWords[mismatchIndex] || '';

      let prefixMatchLength = 0;
      for (let i = 0; i < Math.min(inputWord.length, correctWord.length); i++) {
        if (inputWord[i].toLowerCase() === correctWord[i].toLowerCase()) {
          prefixMatchLength++;
        } else {
          break;
        }
      }

      const newPartialWord = correctWord.substring(0, prefixMatchLength + 1);
      const newWords = [...inputWords.slice(0, mismatchIndex), newPartialWord];

      const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isFullWord = normalize(newPartialWord) === normalize(correctWord);

      updateDraft(newWords.join(' ') + (isFullWord ? ' ' : ''));

      setTimeout(() => {
        const textarea = document.querySelector('.typing-area-input') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }, 10);
    }
  };

  const handleRestart = async () => {
    await resetProgress();
    setViewingCompletedIndex(null);
    setShowCompletion(false);
    setCheckResult(null);
    handleReplay();
  };

  // Global Ctrl shortcut for replay
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        e.preventDefault();
        handleReplay();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleReplay]);

  if (!lesson || !segments || !progress) {
    return <div className="practice-page loading">Loading lesson...</div>;
  }

  const completionPercentage = (progress.completedSegments.length / totalSegments) * 100;
  const totalMistakes = Object.values(progress.mistakes).reduce((a, b) => a + b, 0);

  // Prev disabled: at segment 0 in active mode, or at first segment in review chain
  const prevDisabled = (isViewingCompleted ? viewingCompletedIndex! : currentIndex) <= 0;
  // Next disabled: in active practice at last segment (but not blocked)
  const nextDisabled = !isViewingCompleted && currentIndex >= totalSegments - 1 && progress.completedSegments.includes(totalSegments - 1);

  return (
    <div className={`practice-page${isViewingCompleted ? ' viewing-completed' : ''}`}>
      <header className="practice-header glass-panel">
        <div className="practice-nav">
          <button className="back-btn icon-btn" onClick={() => navigate('/')} title="Back to Library">
            <ArrowLeft size={20} />
          </button>

          <div className="practice-center-group">
            {isViewingCompleted ? (
              <div className="segment-indicator reviewing">
                <Volume2 size={16} />
                <span>Reviewing Segment {viewingCompletedIndex! + 1} of {totalSegments}</span>
              </div>
            ) : (
              <div className="segment-indicator">
                <Volume2 size={16} />
                <span>Segment {currentIndex + 1} of {totalSegments}</span>
              </div>
            )}
            <div className="practice-mode-badge">
              <LayoutDashboard size={12} />
              <span>{isViewingCompleted ? 'Review Mode' : 'Dictation Mode'}</span>
            </div>
          </div>

          <button className="settings-btn icon-btn" onClick={() => setShowSettings(true)} title="Settings">
            <SettingsIcon size={20} />
          </button>
        </div>

        {/* Segment NavBar */}
        <SegmentNavBar
          totalSegments={totalSegments}
          currentIndex={currentIndex}
          completedSegments={progress.completedSegments}
          onViewCompleted={(index) => {
            setViewingCompletedIndex(index);
            setCheckResult(null);
            setTimeout(() => playSegmentByIndex(index), 50);
          }}
          viewingIndex={viewingCompletedIndex}
        />

        <div className="practice-status-area">
          <div className="progress-info">
            <span className="progress-label">Overall Progress</span>
            <span className="progress-percentage">{Math.round(completionPercentage)}%</span>
          </div>
          <ProgressBar
            progress={completionPercentage}
            showPercentage={false}
            height={6}
            className="practice-progress-bar"
          />
        </div>
      </header>

      <main className="practice-main">
        <div className="audio-section">
          <AudioControls
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            onTogglePlayPause={togglePlayPause}
            onReplay={handleReplay}
            onChangeSpeed={changeSpeed}
          />
        </div>

        <div className="typing-section">
          {/* ── COMPLETED REVIEW MODE ── */}
          {isViewingCompleted ? (
            <CompletedSegmentView
              segmentIndex={viewingCompletedIndex!}
              totalSegments={totalSegments}
              segmentText={displaySegment?.text || ''}
              attempts={progress.attempts[viewingCompletedIndex!] || 0}
              mistakes={progress.mistakes[viewingCompletedIndex!] || 0}
              isPlaying={isPlaying}
              onReplay={() => playSegmentByIndex(viewingCompletedIndex!)}
              onResume={() => {
                setViewingCompletedIndex(null);
                setCheckResult(null);
                setTimeout(() => playCurrentSegment(), 50);
              }}
            />
          ) : (
            /* ── ACTIVE PRACTICE MODE ── */
            <>
              <TypingArea
                value={draftInput}
                expectedText={currentSegment?.text || ''}
                onChange={updateDraft}
                onSubmit={handleSubmit}
                disabled={checkResult?.correct}
              />

              <FeedbackDisplay
                result={checkResult}
                input={draftInput}
                expectedText={currentSegment?.text || ''}
              />
            </>
          )}

          {/* ── Navigation + Action buttons (always visible) ── */}
          <div className="practice-actions">
            <Button
              variant="secondary"
              onClick={handlePrev}
              disabled={prevDisabled}
            >
              ← Prev
            </Button>

            {!isViewingCompleted && (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={!draftInput.trim() || !!checkResult?.correct}
                  style={{ minWidth: '180px' }}
                >
                  Check Answer (Enter)
                </Button>

                <Button variant="secondary" onClick={handleHintLetter} title="Hint one letter">
                  💡 Letter
                </Button>
                <Button variant="secondary" onClick={handleHint} title="Hint full word">
                  💡 Word
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              onClick={handleNext}
              disabled={nextDisabled}
            >
              {isViewingCompleted
                ? viewingCompletedIndex! + 1 > currentIndex
                  ? 'Resume →'
                  : 'Next →'
                : 'Next →'}
            </Button>
          </div>
        </div>
      </main>

      <CompletionModal
        isOpen={showCompletion}
        totalSegments={totalSegments}
        totalMistakes={totalMistakes}
        onRestart={handleRestart}
      />

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
