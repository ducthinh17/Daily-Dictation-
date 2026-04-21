import { useState, useEffect, useCallback, useRef } from 'react';
import { getGroqApiKey } from '../utils/settingsStore';

export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  /** Auto-stop after this many ms of silence. Not strictly implemented in this version to avoid complexity. */
  autoStopMs?: number;
}

export function useSpeechRecognition(language: string = 'en-US', _options?: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechDetected, setSpeechDetected] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechStartTimeRef = useRef<number>(0);

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const apiKey = await getGroqApiKey();
      
      if (!apiKey) {
        throw new Error('Missing Groq API Key. Please configure it in Settings.');
      }

      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-large-v3-turbo');
      
      if (language) {
        formData.append('language', language.split('-')[0]); 
      }
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      if (data.text) {
        setFinalTranscript(data.text);
        setConfidence(99); // Groq is highly accurate
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); // This triggers onstop event
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || isProcessing) return;

    setFinalTranscript('');
    setConfidence(0);
    setError(null);
    setSpeechDetected(true); // Assume speech for UI feedback immediately
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
      speechStartTimeRef.current = Date.now();
      
    } catch (err) {
      console.error("Failed to start recording", err);
      setError("Failed to start microphone. Please check permissions.");
    }
  }, [isListening, isProcessing]);

  const resetTranscript = useCallback(() => {
    setFinalTranscript('');
    setConfidence(0);
    setSpeechDetected(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const speechDuration = speechStartTimeRef.current > 0 && !isListening
    ? Date.now() - speechStartTimeRef.current
    : 0;

  return {
    isListening,
    isProcessing,
    interimTranscript: '', // Groq API doesn't do streaming interim results
    finalTranscript: finalTranscript.trim(),
    fullTranscript: finalTranscript.trim(), // Keep fullTranscript for compatibility
    confidence,
    speechDetected,
    speechDuration,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  };
}
