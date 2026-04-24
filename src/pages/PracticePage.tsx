import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Settings as SettingsIcon, Volume2, LayoutDashboard } from 'lucide-react';
import { db } from '../db';
import { useProgress } from '../hooks/useProgress';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { checkAnswer, tokenize, normalize } from '../utils/answerChecker';
import { awardXP } from '../utils/xpEngine';
import { updateGoalProgress } from '../utils/questEngine';
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
import { ShadowingMode } from '../components/ShadowingMode';
import { SentenceScramble } from '../components/SentenceScramble';
import { SpeakBackMode } from '../components/SpeakBackMode';
import { GrammarTipPopup } from '../components/GrammarTipPopup';
import { findTipForError } from '../utils/grammarTips';
import type { GrammarTip } from '../utils/grammarTips';
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

  // Shadowing & Scramble Mode State
  const [practiceMode, setPracticeMode] = useState<'dictation' | 'shadowing' | 'scramble' | 'speak-back'>('dictation');
  const [shadowingScore, setShadowingScore] = useState<number | null>(null);
  const [isShadowingComplete, setIsShadowingComplete] = useState(false);

  // Grammar Tip State
  const [grammarTip, setGrammarTip] = useState<GrammarTip | null>(null);

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
      setShadowingScore(null);
      setIsShadowingComplete(false);
      // slight delay so segment loads
      setTimeout(() => playSegmentByIndex(prevIndex), 50);
    } else {
      // Not completed — navigate back in active practice
      setViewingCompletedIndex(null);
      setCheckResult(null);
      setShadowingScore(null);
      setIsShadowingComplete(false);
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
        setShadowingScore(null);
        setIsShadowingComplete(false);
        playCurrentSegment();
        return;
      }
      const isCompleted = progress?.completedSegments.includes(nextIndex) ?? false;
      if (isCompleted) {
        setViewingCompletedIndex(nextIndex);
        setCheckResult(null);
        setShadowingScore(null);
        setIsShadowingComplete(false);
        setTimeout(() => playSegmentByIndex(nextIndex), 50);
      } else {
        // nextIndex === currentIndex → resume active
        setViewingCompletedIndex(null);
        setShadowingScore(null);
        setIsShadowingComplete(false);
        playCurrentSegment();
      }
      return;
    }

    // Active practice: advance forward
    if (currentIndex < totalSegments - 1) {
      advanceSegment(currentIndex + 1);
      setCheckResult(null);
      setShadowingScore(null);
      setIsShadowingComplete(false);
    } else {
      completeLesson();
      setShowCompletion(true);
    }
  }, [isViewingCompleted, viewingCompletedIndex, currentIndex, totalSegments, progress, advanceSegment, completeLesson, playCurrentSegment, playSegmentByIndex]);

  // ── SUBMIT (active practice only) ──
  const handleSubmit = async () => {
    if (!currentSegment || isViewingCompleted) return;

    const result = checkAnswer(draftInput, currentSegment.text, lesson?.language);
    setCheckResult(result);

    const isFirstTry = progress && !progress.attempts[currentIndex];
    
    await recordAttempt(currentIndex, result.correct);

    if (result.correct) {
      // Award XP for dictation segment
      await awardXP({
        type: 'segment_complete',
        metadata: {
          isFirstTry,
          perfect: result.wrongPositions && result.wrongPositions.length === 0
        }
      });
      
      // Update daily goal
      await updateGoalProgress('complete_segments', 1);
    }

    if (!result.correct && result.wrongPositions && result.wrongPositions.length > 0) {
      const expectedWords = tokenize(currentSegment.text, lesson?.language);
      const inputWords = tokenize(draftInput, lesson?.language);

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

        // Show grammar tip for the first error
        const firstErr = errors[0];
        if (firstErr) {
          const tip = findTipForError(firstErr.expectedWord, firstErr.typedWord);
          if (tip) setGrammarTip(tip);
        }

        // Auto-save to Sentence Bank for context-rich review
        const sentenceText = currentSegment.text;
        for (const err of errors) {
          const existing = await db.sentenceBank
            .where('word').equals(err.expectedWord.toLowerCase())
            .filter(s => s.lessonId === (lessonId || '') && s.segmentIndex === currentIndex)
            .first();
          if (!existing) {
            await db.sentenceBank.add({
              id: crypto.randomUUID(),
              word: err.expectedWord.toLowerCase(),
              sentence: sentenceText,
              lessonId: lessonId || '',
              segmentIndex: currentIndex,
              createdAt: Date.now(),
              reviewCount: 0,
            });
          }
        }
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
            
            await awardXP({
              type: 'lesson_complete',
              metadata: { accuracy }
            });
            
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

    const expectedWords = tokenize(currentSegment.text, lesson?.language);
    const inputWords = draftInput.trim() === '' ? [] : tokenize(draftInput, lesson?.language);

    let mismatchIndex = inputWords.length;
    for (let i = 0; i < inputWords.length; i++) {
      if (normalize(inputWords[i]) !== normalize(expectedWords[i] || '')) {
        mismatchIndex = i;
        break;
      }
    }

    if (mismatchIndex < expectedWords.length) {
      const correctWord = expectedWords[mismatchIndex];
      const newWords = [...inputWords.slice(0, mismatchIndex), correctWord];
      const isCJK = lesson?.language === 'ja' || lesson?.language === 'zh';
      const separator = isCJK ? '' : ' ';
      updateDraft(newWords.join(separator) + separator);

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

    const expectedWords = tokenize(currentSegment.text, lesson?.language);
    const inputWords = draftInput.trim() === '' ? [] : tokenize(draftInput, lesson?.language);

    let mismatchIndex = inputWords.length;
    for (let i = 0; i < inputWords.length; i++) {
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

      const isFullWord = normalize(newPartialWord) === normalize(correctWord);
      
      const isCJK = lesson?.language === 'ja' || lesson?.language === 'zh';
      const separator = isCJK ? '' : ' ';

      updateDraft(newWords.join(separator) + (isFullWord ? separator : ''));

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
    setPracticeMode('dictation');
    setShadowingScore(null);
    setIsShadowingComplete(false);
    handleReplay();
  };

  // Global shortcuts (Replay, Esc, Toggle Mode)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Allow Control (Replay) to work everywhere, even while typing
      if (e.key === 'Control') {
        e.preventDefault();
        handleReplay();
        return;
      }

      // Allow Escape to work everywhere, even while typing
      if (e.key === 'Escape' || e.key === 'Esc') {
        setShowSettings(false);
        setGrammarTip(null);
        return;
      }

      // Ignore other shortcuts if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        if (!isViewingCompleted) {
          setPracticeMode(prev => prev === 'dictation' ? 'shadowing' : prev === 'shadowing' ? 'scramble' : prev === 'scramble' ? 'speak-back' : 'dictation');
          setShadowingScore(null);
          setIsShadowingComplete(false);
        }
      }
    };
    
    // Use capture phase to ensure this runs before any inputs can stop propagation
    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true });
  }, [handleReplay, isViewingCompleted]);

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
              <div 
                className="practice-mode-badge" 
                onClick={() => {
                  if (!isViewingCompleted) {
                    setPracticeMode(prev => prev === 'dictation' ? 'shadowing' : prev === 'shadowing' ? 'scramble' : prev === 'scramble' ? 'speak-back' : 'dictation');
                    setShadowingScore(null);
                    setIsShadowingComplete(false);
                  }
                }}
                style={{ cursor: isViewingCompleted ? 'default' : 'pointer' }}
                title={!isViewingCompleted ? 'Click to toggle mode' : ''}
              >
                <LayoutDashboard size={12} />
                <span>{isViewingCompleted ? 'Review Mode' : practiceMode === 'dictation' ? 'Dictation Mode' : practiceMode === 'shadowing' ? 'Shadowing Mode' : practiceMode === 'scramble' ? 'Scramble Mode' : '🎤 Speak Back'}</span>
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
              lessonId={lessonId!}
              segmentIndex={viewingCompletedIndex!}
              totalSegments={totalSegments}
              segmentText={displaySegment?.text || ''}
              startTime={displaySegment?.startTime}
              endTime={displaySegment?.endTime}
              attempts={progress.attempts[viewingCompletedIndex!] || 0}
              mistakes={progress.mistakes[viewingCompletedIndex!] || 0}
              isPlaying={isPlaying}
              language={lesson?.language || 'en'}
              onReplay={() => playSegmentByIndex(viewingCompletedIndex!)}
              onResume={() => {
                setViewingCompletedIndex(null);
                setCheckResult(null);
                setTimeout(() => playCurrentSegment(), 50);
              }}
            />
          ) : practiceMode === 'shadowing' ? (
            <ShadowingMode
              expectedText={currentSegment?.text || ''}
              language={lesson?.language || 'en'}
              isComplete={isShadowingComplete}
              score={shadowingScore}
              onTryAgain={() => {
                setShadowingScore(null);
                setIsShadowingComplete(false);
              }}
              onComplete={async (accuracy) => {
                setShadowingScore(accuracy);
                setIsShadowingComplete(true);
                
                await awardXP({
                  type: 'shadowing',
                  metadata: { accuracy }
                });

                // Update daily goal
                await updateGoalProgress('shadowing', 1);

                // Optionally auto-complete if accuracy is very high
                if (accuracy >= 80) {
                  await recordAttempt(currentIndex, true);
                }
              }}
            />
          ) : practiceMode === 'scramble' ? (
            <SentenceScramble
              text={currentSegment?.text || ''}
              onComplete={async (correct) => {
                if (correct) {
                  await recordAttempt(currentIndex, true);
                  
                  await awardXP({
                    type: 'sentence_scramble',
                    metadata: { segmentId: currentSegment?.id }
                  });
                }
              }}
              onSkip={() => {
                // If they skip, mark as incorrect
                recordAttempt(currentIndex, false);
                advanceSegment(currentIndex + 1);
              }}
            />
          ) : practiceMode === 'speak-back' ? (
            <SpeakBackMode
              expectedText={currentSegment?.text || ''}
              language={lesson?.language || 'en'}
              onReplayAudio={() => {
                if (currentSegment?.startTime != null && currentSegment?.endTime != null) {
                  replaySegment(currentSegment.startTime, currentSegment.endTime);
                } else {
                  replay();
                }
              }}
              onComplete={async (accuracy) => {
                setShadowingScore(accuracy);
                setIsShadowingComplete(true);
                
                await awardXP({
                  type: 'speak_back',
                  metadata: { accuracy }
                });

                await updateGoalProgress('shadowing', 1);

                if (accuracy >= 70) {
                  await recordAttempt(currentIndex, true);
                }
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
                onHintWord={handleHint}
                onHintLetter={handleHintLetter}
                disabled={checkResult?.correct}
              />

              <FeedbackDisplay
                result={checkResult}
                input={draftInput}
                expectedText={currentSegment?.text || ''}
                lessonLanguage={lesson?.language}
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

            {!isViewingCompleted && practiceMode === 'dictation' && (
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

      {grammarTip && (
        <GrammarTipPopup tip={grammarTip} onClose={() => setGrammarTip(null)} />
      )}
    </div>
  );
}
