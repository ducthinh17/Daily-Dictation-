import Dexie, { type Table } from 'dexie';
import type { Lesson, Segment, Progress, Collection, PracticeSession, WordError, UserProfile, Achievement, SystemSettings, XPLog, DailyGoal, WeeklyQuest, SRSCard, MasteredWord, BankedSentence, DiagnosticResult } from '../types';

export class DictinationDB extends Dexie {
  collections!: Table<Collection, string>;
  lessons!: Table<Lesson, string>;
  segments!: Table<Segment, string>;
  progress!: Table<Progress, string>;
  sessions!: Table<PracticeSession, string>;
  wordErrors!: Table<WordError, string>;
  userProfile!: Table<UserProfile, string>;
  achievements!: Table<Achievement, string>;
  settings!: Table<SystemSettings, string>;
  dictionaryCache!: Table<{word: string, cachedAt: number, data: any}, string>;
  translationCache!: Table<{key: string, text: string, translation: string, langPair: string, cachedAt: number}, string>;
  audioBookmarks!: Table<import('../types').AudioBookmark, string>;
  bookmarkTopics!: Table<import('../types').BookmarkTopic, string>;
  
  // Phase 3 & 4
  xpLog!: Table<XPLog, string>;
  dailyGoals!: Table<DailyGoal, string>;
  weeklyQuests!: Table<WeeklyQuest, string>;
  srsCards!: Table<SRSCard, string>;
  masteredWords!: Table<MasteredWord, string>;

  // Sprint 2+3
  sentenceBank!: Table<BankedSentence, string>;
  diagnosticResults!: Table<DiagnosticResult, string>;

  constructor() {
    super('DictinationDB');
    
    // Version 1: Original schema
    this.version(1).stores({
      lessons: 'id, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt'
    });

    // Version 2: Add language and mode fields to lessons
    this.version(2).stores({
      lessons: 'id, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt'
    }).upgrade(tx => {
      // Migrate existing lessons to have default language and mode
      return tx.table('lessons').toCollection().modify(lesson => {
        if (!lesson.language) lesson.language = 'en';
        if (!lesson.mode) lesson.mode = 'audio-script';
      });
    });

    // Version 3: Add collections
    this.version(3).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt'
    }).upgrade(async tx => {
      // Create a default collection for existing lessons
      const defaultCollectionId = 'default-collection';
      await tx.table('collections').add({
        id: defaultCollectionId,
        title: 'Uncategorized Lessons',
        description: 'Lessons created before the collection update',
        category: 'custom',
        difficulty: 'intermediate',
        coverColor: 'linear-gradient(135deg, #475569, #1e293b)',
        tags: ['legacy'],
        lessonCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Migrate existing lessons to the default collection
      let count = 0;
      await tx.table('lessons').toCollection().modify(lesson => {
        if (!lesson.collectionId) {
          lesson.collectionId = defaultCollectionId;
          lesson.order = count++;
        }
      });
      
      // Update lesson count
      await tx.table('collections').update(defaultCollectionId, { lessonCount: count });
    });

    // Version 4: Analytics
    this.version(4).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt',
      sessions: 'id, lessonId, startedAt',
      wordErrors: 'id, word, lessonId, timestamp'
    });

    // Version 5: Gamification & Achievements
    this.version(5).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt',
      sessions: 'id, lessonId, startedAt',
      wordErrors: 'id, word, lessonId, timestamp',
      userProfile: 'id',
      achievements: 'id, badgeId, unlockedAt'
    }).upgrade(async tx => {
      // Initialize a default user profile
      await tx.table('userProfile').add({
        id: 'me',
        totalXP: 0,
        currentLevel: 1,
        title: 'Novice Listener',
        createdAt: Date.now(),
        lastUpdated: Date.now()
      }).catch(e => console.log('Profile already exists', e));
    });

    // Version 6: Settings
    this.version(6).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt',
      sessions: 'id, lessonId, startedAt',
      wordErrors: 'id, word, lessonId, timestamp',
      userProfile: 'id',
      achievements: 'id, badgeId, unlockedAt',
      settings: 'id'
    }).upgrade(async tx => {
      // Initialize default settings, migrating from localStorage if exists
      const oldApiKey = localStorage.getItem('dictination_groq_api_key') || '';
      const oldLang = localStorage.getItem('dictination_default_language') === 'zh' ? 'zh' : 'en';
      const oldEngine = localStorage.getItem('dictination_transcribe_engine') === 'browser' ? 'browser' : 'groq';
      const oldRate = parseFloat(localStorage.getItem('dictination_playback_rate') || '1');

      await tx.table('settings').add({
        id: 'global',
        groqApiKey: oldApiKey,
        defaultLanguage: oldLang,
        transcribeEngine: oldEngine,
        playbackRate: oldRate
      }).catch(e => console.log('Settings already exists', e));
    });

    // Version 7: Dictionary Cache and Bookmarks
    this.version(7).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt',
      sessions: 'id, lessonId, startedAt',
      wordErrors: 'id, word, lessonId, timestamp',
      userProfile: 'id',
      achievements: 'id, badgeId, unlockedAt',
      settings: 'id',
      dictionaryCache: 'word, cachedAt',
      audioBookmarks: 'id, lessonId, segmentIndex, createdAt, *topicTags',
      bookmarkTopics: 'id, name, createdAt'
    }).upgrade(async tx => {
      // Initialize default topics
      await tx.table('bookmarkTopics').bulkAdd([
        { id: 'topic-ielts', name: 'IELTS', color: '#3b82f6', bookmarkCount: 0, createdAt: Date.now() },
        { id: 'topic-business', name: 'Business', color: '#10b981', bookmarkCount: 0, createdAt: Date.now() },
        { id: 'topic-daily', name: 'Daily Life', color: '#f59e0b', bookmarkCount: 0, createdAt: Date.now() },
        { id: 'topic-custom', name: 'Custom', color: '#8b5cf6', bookmarkCount: 0, createdAt: Date.now() }
      ]).catch(e => console.log('Default topics already exist', e));
    });

    // Version 8: Full Pro Features (Phase 3 and 4)
    this.version(8).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt',
      sessions: 'id, lessonId, startedAt, mode', // Added mode index
      wordErrors: 'id, word, lessonId, timestamp',
      userProfile: 'id',
      achievements: 'id, badgeId, unlockedAt',
      settings: 'id',
      dictionaryCache: 'word, cachedAt',
      audioBookmarks: 'id, lessonId, segmentIndex, createdAt, *topicTags',
      bookmarkTopics: 'id, name, createdAt',
      
      // NEW Phase 3
      xpLog: 'id, type, amount, timestamp',
      dailyGoals: 'id, date',
      weeklyQuests: 'id, weekStart',
      
      // NEW Phase 4  
      srsCards: 'id, word, nextReviewAt, repetitions',
      masteredWords: 'id, word, masteredAt'
    });

    // Version 9: Sentence Bank + Diagnostic
    this.version(9).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt',
      sessions: 'id, lessonId, startedAt, mode',
      wordErrors: 'id, word, lessonId, timestamp',
      userProfile: 'id',
      achievements: 'id, badgeId, unlockedAt',
      settings: 'id',
      dictionaryCache: 'word, cachedAt',
      audioBookmarks: 'id, lessonId, segmentIndex, createdAt, *topicTags',
      bookmarkTopics: 'id, name, createdAt',
      xpLog: 'id, type, amount, timestamp',
      dailyGoals: 'id, date',
      weeklyQuests: 'id, weekStart',
      srsCards: 'id, word, nextReviewAt, repetitions',
      masteredWords: 'id, word, masteredAt',
      sentenceBank: 'id, word, lessonId, createdAt',
      diagnosticResults: 'id, takenAt'
    });

    // Version 10: Translation Cache
    this.version(10).stores({
      collections: 'id, category, createdAt',
      lessons: 'id, collectionId, order, createdAt',
      segments: 'id, lessonId, index',
      progress: 'lessonId, lastActiveAt',
      sessions: 'id, lessonId, startedAt, mode',
      wordErrors: 'id, word, lessonId, timestamp',
      userProfile: 'id',
      achievements: 'id, badgeId, unlockedAt',
      settings: 'id',
      dictionaryCache: 'word, cachedAt',
      translationCache: 'key, cachedAt',
      audioBookmarks: 'id, lessonId, segmentIndex, createdAt, *topicTags',
      bookmarkTopics: 'id, name, createdAt',
      xpLog: 'id, type, amount, timestamp',
      dailyGoals: 'id, date',
      weeklyQuests: 'id, weekStart',
      srsCards: 'id, word, nextReviewAt, repetitions',
      masteredWords: 'id, word, masteredAt',
      sentenceBank: 'id, word, lessonId, createdAt',
      diagnosticResults: 'id, takenAt'
    });

    // Handle fresh install population
    this.on('populate', async () => {
      await this.userProfile.add({
        id: 'me',
        totalXP: 0,
        currentLevel: 1,
        title: 'Novice Listener',
        createdAt: Date.now(),
        lastUpdated: Date.now()
      });
      await this.settings.add({
        id: 'global',
        groqApiKey: '',
        defaultLanguage: 'en',
        transcribeEngine: 'groq',
        playbackRate: 1
      });
    });
  }
}


export const db = new DictinationDB();

// Global error handler
db.on('versionchange', () => {
  console.log('Database version change detected, closing connection...');
  db.close();
  window.location.reload();
});

db.on('blocked', () => {
  console.log('Database connection blocked. Please close other tabs of this app.');
});

db.open().catch(err => {
  console.error("CRITICAL: Failed to open db:", err);
});
