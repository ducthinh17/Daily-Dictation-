import { db } from '../db';
import type { SupportedLanguage, LessonMode } from '../types';

export function useLesson() {
  const createLesson = async (
    title: string,
    audioBlob: Blob,
    originalScript: string,
    language: SupportedLanguage = 'en',
    mode: LessonMode = 'audio-script',
    collectionId: string = 'default-collection'
  ) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    
    // Determine the next order for this collection
    const existingLessons = await db.lessons.where('collectionId').equals(collectionId).toArray();
    const nextOrder = existingLessons.length > 0 
      ? Math.max(...existingLessons.map(l => l.order || 0)) + 1 
      : 0;
    
    await db.lessons.add({
      id,
      collectionId,
      order: nextOrder,
      title,
      audioBlob,
      originalScript,
      language,
      mode,
      createdAt: now,
      updatedAt: now
    });
    
    // Update the lessonCount in the collection
    const collection = await db.collections.get(collectionId);
    if (collection) {
      await db.collections.update(collectionId, { 
        lessonCount: (collection.lessonCount || 0) + 1,
        updatedAt: now
      });
    }
    
    return id;
  };
  
  const deleteLesson = async (id: string) => {
    await db.transaction('rw', db.lessons, db.segments, db.progress, async () => {
      await db.lessons.delete(id);
      await db.segments.where('lessonId').equals(id).delete();
      await db.progress.delete(id);
    });
  };

  const updateLesson = async (id: string, updates: Partial<import('../types').Lesson>) => {
    const now = Date.now();
    await db.lessons.update(id, {
      ...updates,
      updatedAt: now
    });
  };

  return { createLesson, updateLesson, deleteLesson };
}
