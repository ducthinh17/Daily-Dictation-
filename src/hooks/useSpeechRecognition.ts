import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionOptions {
  /** Auto-stop after this many ms of silence after speech is detected. Default: 0 (disabled). */
  autoStopMs?: number;
}

export function useSpeechRecognition(language: string = 'en-US', options?: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechDetected, setSpeechDetected] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartTimeRef = useRef<number>(0);

  const autoStopMs = options?.autoStopMs ?? 0;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      speechStartTimeRef.current = Date.now();
    };

    recognition.onspeechstart = () => {
      setSpeechDetected(true);
      // Clear any pending auto-stop
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };

    recognition.onspeechend = () => {
      // If auto-stop is enabled, start timer
      if (autoStopMs > 0) {
        autoStopTimerRef.current = setTimeout(() => {
          try { recognition.stop(); } catch (_) { /* ignore */ }
        }, autoStopMs);
      }
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let currentFinal = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const conf = result[0].confidence;
        if (conf > maxConfidence) maxConfidence = conf;
        
        if (result.isFinal) {
          currentFinal += result[0].transcript;
        } else {
          currentInterim += result[0].transcript;
        }
      }

      setInterimTranscript(currentInterim);
      if (currentFinal) {
        setFinalTranscript(prev => prev + ' ' + currentFinal);
      }
      if (maxConfidence > 0) {
        setConfidence(Math.round(maxConfidence * 100));
      }

      // Reset auto-stop timer on new result
      if (autoStopMs > 0 && autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = setTimeout(() => {
          try { recognition.stop(); } catch (_) { /* ignore */ }
        }, autoStopMs);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      }
    };
  }, [language, autoStopMs]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setInterimTranscript('');
      setFinalTranscript('');
      setConfidence(0);
      setError(null);
      setSpeechDetected(false);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start recognition", err);
        setError("Failed to start microphone. Please check permissions.");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (recognitionRef.current && isListening) {
      try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setSpeechDetected(false);
  }, []);

  const speechDuration = speechStartTimeRef.current > 0 && !isListening
    ? Date.now() - speechStartTimeRef.current
    : 0;

  return {
    isListening,
    interimTranscript,
    finalTranscript: finalTranscript.trim(),
    fullTranscript: (finalTranscript + ' ' + interimTranscript).trim(),
    confidence,
    speechDetected,
    speechDuration,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: !!recognitionRef.current
  };
}
