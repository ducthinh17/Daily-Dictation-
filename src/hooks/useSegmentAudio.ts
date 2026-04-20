import { useState, useRef, useCallback } from 'react';
import { db } from '../db';

/**
 * Hook to extract and play a specific audio segment from a lesson's audioBlob.
 * Uses Web Audio API to slice the buffer by startTime/endTime.
 * Falls back to full audio if times are not available.
 */
export function useSegmentAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setIsPlaying(false);
    setActiveId(null);
  }, []);

  const play = useCallback(async (
    bookmarkId: string,
    lessonId: string,
    startTime?: number,
    endTime?: number
  ) => {
    // If same bookmark is playing, stop it
    if (activeId === bookmarkId && isPlaying) {
      cleanup();
      return;
    }

    // Cleanup previous
    cleanup();

    try {
      const lesson = await db.lessons.get(lessonId);
      if (!lesson?.audioBlob) return;

      const url = URL.createObjectURL(lesson.audioBlob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      setActiveId(bookmarkId);

      // If we have time boundaries, use them
      if (startTime !== undefined && startTime >= 0) {
        audio.currentTime = startTime;
      }

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        setActiveId(null);
      };
      audio.onpause = () => setIsPlaying(false);

      // If we have an endTime, stop playback at that point
      if (endTime !== undefined && endTime > 0) {
        audio.ontimeupdate = () => {
          if (audio.currentTime >= endTime) {
            audio.pause();
            setIsPlaying(false);
            setActiveId(null);
          }
        };
      }

      await audio.play();
    } catch (err) {
      console.error('Failed to play segment audio:', err);
      cleanup();
    }
  }, [activeId, isPlaying, cleanup]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return { play, stop, isPlaying, activeId };
}
