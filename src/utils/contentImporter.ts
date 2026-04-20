import JSZip from 'jszip';
import { db } from '../db';
import type { Collection, Lesson, Segment } from '../types';

interface ImportResult {
  success: boolean;
  collectionTitle: string;
  lessonsImported: number;
  error?: string;
}

export async function importDictinationFile(file: File): Promise<ImportResult> {
  try {
    const zip = await JSZip.loadAsync(file);
    
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
      return { success: false, collectionTitle: '', lessonsImported: 0, error: 'Invalid .dictination file: missing manifest' };
    }

    const manifest = JSON.parse(await manifestFile.async('string'));
    
    if (manifest.app !== 'Dictination') {
      return { success: false, collectionTitle: '', lessonsImported: 0, error: 'This file was not created by Dictination' };
    }

    // Generate new IDs to avoid conflicts
    const newCollectionId = crypto.randomUUID();

    const collection: Collection = {
      id: newCollectionId,
      title: manifest.collection?.title || 'Imported Collection',
      description: manifest.collection?.description || 'Imported from .dictination file',
      category: manifest.collection?.category || 'custom',
      difficulty: manifest.collection?.difficulty || 'intermediate',
      coverColor: manifest.collection?.coverColor || 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      tags: [...(manifest.collection?.tags || []), 'imported'],
      lessonCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const lessonsFolder = zip.folder('lessons');
    const audioFolder = zip.folder('audio');
    
    const lessons: Lesson[] = [];
    const segments: Segment[] = [];

    if (lessonsFolder) {
      const lessonFiles = Object.keys(zip.files).filter(f => f.startsWith('lessons/') && f.endsWith('.json'));
      
      for (const filePath of lessonFiles) {
        const content = await zip.file(filePath)!.async('string');
        const data = JSON.parse(content);
        const oldId = data.id;
        const newLessonId = crypto.randomUUID();

        // Try to load audio
        let audioBlob: Blob = new Blob();
        if (audioFolder) {
          const audioFile = zip.file(`audio/${oldId}.webm`);
          if (audioFile) {
            const audioData = await audioFile.async('blob');
            audioBlob = new Blob([audioData], { type: 'audio/webm' });
          }
        }

        lessons.push({
          id: newLessonId,
          collectionId: newCollectionId,
          order: data.order || lessons.length,
          title: data.title || 'Imported Lesson',
          audioBlob,
          originalScript: data.originalScript || '',
          language: data.language || 'en',
          mode: data.mode || 'audio-script',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Segments
        if (data.segments && Array.isArray(data.segments)) {
          data.segments.forEach((seg: any) => {
            segments.push({
              id: crypto.randomUUID(),
              lessonId: newLessonId,
              index: seg.index,
              text: seg.text,
              startTime: seg.startTime,
              endTime: seg.endTime,
            });
          });
        }
      }
    }

    // Write to DB
    collection.lessonCount = lessons.length;
    await db.collections.add(collection);
    await db.lessons.bulkAdd(lessons);
    await db.segments.bulkAdd(segments);

    return {
      success: true,
      collectionTitle: collection.title,
      lessonsImported: lessons.length,
    };
  } catch (err: any) {
    return {
      success: false,
      collectionTitle: '',
      lessonsImported: 0,
      error: err.message || 'Failed to import file',
    };
  }
}
