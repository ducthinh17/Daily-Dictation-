import JSZip from 'jszip';
import { db } from '../db';

const MANIFEST_VERSION = 1;

export async function exportCollection(collectionId: string): Promise<Blob> {
  const collection = await db.collections.get(collectionId);
  if (!collection) throw new Error('Collection not found');

  const lessons = await db.lessons.where('collectionId').equals(collectionId).toArray();
  const lessonIds = lessons.map(l => l.id);
  const segments = await db.segments.where('lessonId').anyOf(lessonIds).toArray();

  const zip = new JSZip();

  // Manifest
  zip.file('manifest.json', JSON.stringify({
    version: MANIFEST_VERSION,
    exportedAt: Date.now(),
    app: 'Dictination',
    collection: {
      id: collection.id,
      title: collection.title,
      description: collection.description,
      category: collection.category,
      difficulty: collection.difficulty,
      coverColor: collection.coverColor,
      tags: collection.tags,
    },
    lessonCount: lessons.length,
  }, null, 2));

  // Lessons + Segments
  const lessonsFolder = zip.folder('lessons')!;
  for (const lesson of lessons) {
    const lessonSegments = segments.filter(s => s.lessonId === lesson.id);
    lessonsFolder.file(`${lesson.id}.json`, JSON.stringify({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      language: lesson.language,
      mode: lesson.mode,
      originalScript: lesson.originalScript,
      createdAt: lesson.createdAt,
      segments: lessonSegments.map(s => ({
        index: s.index,
        text: s.text,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    }, null, 2));
  }

  // Audio blobs
  const audioFolder = zip.folder('audio')!;
  for (const lesson of lessons) {
    if (lesson.audioBlob) {
      audioFolder.file(`${lesson.id}.webm`, lesson.audioBlob);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

export async function exportLesson(lessonId: string): Promise<Blob> {
  const lesson = await db.lessons.get(lessonId);
  if (!lesson) throw new Error('Lesson not found');

  const segments = await db.segments.where('lessonId').equals(lessonId).toArray();

  const zip = new JSZip();

  zip.file('manifest.json', JSON.stringify({
    version: MANIFEST_VERSION,
    exportedAt: Date.now(),
    app: 'Dictination',
    type: 'single-lesson',
    lesson: {
      id: lesson.id,
      title: lesson.title,
      language: lesson.language,
      mode: lesson.mode,
    },
  }, null, 2));

  zip.file('lesson.json', JSON.stringify({
    ...lesson,
    audioBlob: undefined,
    segments: segments.map(s => ({
      index: s.index, text: s.text, startTime: s.startTime, endTime: s.endTime,
    })),
  }, null, 2));

  if (lesson.audioBlob) {
    zip.file('audio.webm', lesson.audioBlob);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
