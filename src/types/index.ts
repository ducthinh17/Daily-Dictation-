export type SupportedLanguage = 'en' | 'zh';
export type LessonMode = 'audio-script' | 'audio-only';

export type LessonCategory = 'ielts' | 'toefl' | 'business' | 'daily' | 'academic' | 'custom';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Collection {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  difficulty: DifficultyLevel;
  coverColor: string;
  tags: string[];
  lessonCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Lesson {
  id: string;
  collectionId: string;
  order: number;
  title: string;
  audioBlob: Blob;
  originalScript: string;
  language: SupportedLanguage;
  mode: LessonMode;
  createdAt: number;
  updatedAt: number;
}

export interface Segment {
  id: string;
  lessonId: string;
  index: number;
  text: string;
  startTime?: number;
  endTime?: number;
}

export interface Progress {
  lessonId: string;
  currentSegmentIndex: number;
  completedSegments: number[];
  attempts: Record<number, number>;
  mistakes: Record<number, number>;
  draftInput: string;
  startedAt: number;
  lastActiveAt: number;
  completedAt?: number;
}

export interface CheckResult {
  correct: boolean;
  totalWords: number;
  wrongCount: number;
  missingCount: number;
  extraCount: number;
  wrongPositions: number[];
}

export interface PracticeSession {
  id: string;
  lessonId: string;
  startedAt: number;
  endedAt: number;
  accuracy: number;
  mode: string; // 'dictation', 'fill-blank', etc.
}

export interface WordError {
  id: string;
  word: string; // the actual word that was expected
  expectedWord: string; // same as word, for clarity
  typedWord: string; // what the user typed incorrectly
  lessonId: string;
  timestamp: number;
}

// Phase 5: Gamification & Achievements
export interface UserProfile {
  id: string; // singleton, usually 'me'
  totalXP: number;
  currentLevel: number;
  title: string;
  createdAt: number;
  lastUpdated: number;
}

export interface Achievement {
  id: string; // e.g. 'first-lesson', '7-day-streak'
  badgeId: string;
  unlockedAt: number;
}

export interface SystemSettings {
  id: string;
  groqApiKey: string;
  defaultLanguage: SupportedLanguage;
  transcribeEngine: 'groq' | 'browser';
  playbackRate: number;
}
