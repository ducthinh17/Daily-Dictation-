import Dexie, { type Table } from 'dexie';
import type { Lesson, Segment, Progress, Collection, PracticeSession, WordError, UserProfile, Achievement } from '../types';

export class DictinationDB extends Dexie {
  collections!: Table<Collection, string>;
  lessons!: Table<Lesson, string>;
  segments!: Table<Segment, string>;
  progress!: Table<Progress, string>;
  sessions!: Table<PracticeSession, string>;
  wordErrors!: Table<WordError, string>;
  userProfile!: Table<UserProfile, string>;
  achievements!: Table<Achievement, string>;

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
    });
  }
}

export const db = new DictinationDB();
