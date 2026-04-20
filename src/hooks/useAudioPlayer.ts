import { useState, useRef, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { setPlaybackRate as persistPlaybackRate, DEFAULT_SETTINGS } from '../utils/settingsStore';

interface UseAudioPlayerProps {
  audioBlob?: Blob;
}

export function useAudioPlayer({ audioBlob }: UseAudioPlayerProps) {
  const settings = useLiveQuery(() => db.settings.get('global'));
  const dbRate = settings?.playbackRate || DEFAULT_SETTINGS.playbackRate;

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(dbRate);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Sync local state when db setting changes
  useEffect(() => {
    if (settings) {
      setPlaybackRate(settings.playbackRate);
      if (audioRef.current) {
        audioRef.current.playbackRate = settings.playbackRate;
      }
    }
  }, [settings?.playbackRate]);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audio.playbackRate = playbackRate;
      audioRef.current = audio;

      const setAudioData = () => {
        setDuration(audio.duration);
      };
      
      const setAudioTime = () => {
        setCurrentTime(audio.currentTime);
        
        // Auto-stop at endTime if segment-based playback
        if (endTimeRef.current !== null && audio.currentTime >= endTimeRef.current) {
          audio.pause();
          endTimeRef.current = null;
        }
      };
      const onEnded = () => setIsPlaying(false);
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);

      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.pause();
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const replay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  };

  const changeSpeed = (newRate: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = newRate;
    }
    setPlaybackRate(newRate);
    persistPlaybackRate(newRate);
  };
  
  const seek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
  };

  /**
   * Play a specific segment of the audio from startTime to endTime.
   * The audio will automatically pause when it reaches endTime.
   */
  const playSegment = useCallback((startTime: number, endTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = startTime;
    endTimeRef.current = endTime;
    audio.play();
  }, []);

  /**
   * Replay the current segment (requires startTime and endTime).
   */
  const replaySegment = useCallback((startTime: number, endTime: number) => {
    playSegment(startTime, endTime);
  }, [playSegment]);

  return {
    isPlaying,
    duration,
    currentTime,
    playbackRate,
    togglePlayPause,
    replay,
    changeSpeed,
    seek,
    playSegment,
    replaySegment,
    audioRef
  };
}
