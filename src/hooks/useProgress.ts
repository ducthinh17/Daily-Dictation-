import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';


export function useProgress(lessonId: string | undefined) {
  const [draftInput, setDraftInput] = useState('');

  const progress = useLiveQuery(
    () => lessonId ? db.progress.get(lessonId) : undefined,
    [lessonId]
  );

  // Initialize or restore draft input
  useEffect(() => {
    if (progress && progress.draftInput !== draftInput) {
      setDraftInput(progress.draftInput);
    }
  }, [progress?.draftInput]); // only run when DB draft changes

  const updateDraft = async (input: string) => {
    setDraftInput(input);
    if (lessonId) {
      await db.progress.update(lessonId, { 
        draftInput: input,
        lastActiveAt: Date.now()
      });
    }
  };

  const recordAttempt = async (segmentIndex: number, isCorrect: boolean) => {
    if (!lessonId || !progress) return;

    const newAttempts = { ...progress.attempts };
    newAttempts[segmentIndex] = (newAttempts[segmentIndex] || 0) + 1;

    const newMistakes = { ...progress.mistakes };
    if (!isCorrect) {
      newMistakes[segmentIndex] = (newMistakes[segmentIndex] || 0) + 1;
    }

    const newCompletedSegments = [...progress.completedSegments];
    if (isCorrect && !newCompletedSegments.includes(segmentIndex)) {
      newCompletedSegments.push(segmentIndex);
    }

    await db.progress.update(lessonId, {
      attempts: newAttempts,
      mistakes: newMistakes,
      completedSegments: newCompletedSegments,
      lastActiveAt: Date.now()
    });
  };

  const advanceSegment = async (nextIndex: number) => {
    if (!lessonId) return;
    
    await db.progress.update(lessonId, {
      currentSegmentIndex: nextIndex,
      draftInput: '',
      lastActiveAt: Date.now()
    });
    setDraftInput('');
  };

  const completeLesson = async () => {
    if (!lessonId) return;
    
    await db.progress.update(lessonId, {
      completedAt: Date.now(),
      lastActiveAt: Date.now()
    });
  };

  const resetProgress = async () => {
    if (!lessonId) return;
    
    await db.progress.update(lessonId, {
      currentSegmentIndex: 0,
      completedSegments: [],
      attempts: {},
      mistakes: {},
      draftInput: '',
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      completedAt: undefined
    });
    setDraftInput('');
  };

  return {
    progress,
    draftInput,
    updateDraft,
    recordAttempt,
    advanceSegment,
    completeLesson,
    resetProgress
  };
}
