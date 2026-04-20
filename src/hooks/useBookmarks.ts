import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { AudioBookmark } from '../types';

export function useBookmarks(lessonId?: string) {
  const topics = useLiveQuery(() => db.bookmarkTopics.toArray()) || [];
  
  // Only query bookmarks for specific lesson if ID is provided
  const lessonBookmarks = useLiveQuery(
    () => lessonId ? db.audioBookmarks.where('lessonId').equals(lessonId).toArray() : [], 
    [lessonId]
  ) || [];

  const addBookmark = async (bookmark: Omit<AudioBookmark, 'id' | 'createdAt' | 'reviewCount'>) => {
    const id = crypto.randomUUID();
    const newBookmark: AudioBookmark = {
      ...bookmark,
      id,
      createdAt: Date.now(),
      reviewCount: 0
    };
    
    await db.transaction('rw', db.audioBookmarks, db.bookmarkTopics, async () => {
      await db.audioBookmarks.add(newBookmark);
      // Increment count for topics
      for (const topicId of bookmark.topicTags) {
        const topic = await db.bookmarkTopics.get(topicId);
        if (topic) {
          await db.bookmarkTopics.update(topicId, { bookmarkCount: topic.bookmarkCount + 1 });
        }
      }
    });
    return id;
  };

  const removeBookmark = async (id: string) => {
    const bookmark = await db.audioBookmarks.get(id);
    if (!bookmark) return;

    await db.transaction('rw', db.audioBookmarks, db.bookmarkTopics, async () => {
      await db.audioBookmarks.delete(id);
      // Decrement count
      for (const topicId of bookmark.topicTags) {
        const topic = await db.bookmarkTopics.get(topicId);
        if (topic && topic.bookmarkCount > 0) {
          await db.bookmarkTopics.update(topicId, { bookmarkCount: topic.bookmarkCount - 1 });
        }
      }
    });
  };

  const createTopic = async (name: string, color: string) => {
    const id = `topic-${crypto.randomUUID()}`;
    await db.bookmarkTopics.add({
      id,
      name,
      color,
      bookmarkCount: 0,
      createdAt: Date.now()
    });
    return id;
  };

  const isBookmarked = (segmentIndex: number) => {
    return lessonBookmarks.some(b => b.segmentIndex === segmentIndex);
  };
  
  const getBookmarkBySegment = (segmentIndex: number) => {
    return lessonBookmarks.find(b => b.segmentIndex === segmentIndex);
  };

  return {
    topics,
    lessonBookmarks,
    addBookmark,
    removeBookmark,
    createTopic,
    isBookmarked,
    getBookmarkBySegment
  };
}
