import type { SupportedLanguage } from '../types';

// --- Groq Whisper Response Types ---
export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words?: WhisperWord[];
}

export interface TranscriptResult {
  text: string;
  segments: WhisperSegment[];
  language: string;
  duration: number;
}

export interface TranscribeOptions {
  audioFile: File;
  language: SupportedLanguage;
  apiKey: string;
  onProgress?: (status: TranscribeStatus) => void;
}

export type TranscribeStatus =
  | { phase: 'preparing' }
  | { phase: 'splitting'; message: string }
  | { phase: 'uploading'; message?: string }
  | { phase: 'transcribing'; message?: string }
  | { phase: 'processing' }
  | { phase: 'done'; result: TranscriptResult }
  | { phase: 'error'; message: string };

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const WHISPER_MODEL = 'whisper-large-v3-turbo';
const AUTO_SPLIT_THRESHOLD = 20 * 1024 * 1024; // 20MB

/**
 * Transcribe audio — transparently handles large files by auto-splitting.
 * For files > 20MB: splits into 10-minute chunks, transcribes each, merges results.
 * For files <= 20MB: transcribes directly.
 */
export async function transcribeAudio(options: TranscribeOptions): Promise<TranscriptResult> {
  const { audioFile } = options;

  if (audioFile.size > AUTO_SPLIT_THRESHOLD) {
    return transcribeLargeAudio(options);
  }

  return transcribeSingleChunk(options);
}

/**
 * Large file handler: split → transcribe each chunk → merge with offset timestamps.
 */
async function transcribeLargeAudio(options: TranscribeOptions): Promise<TranscriptResult> {
  const { audioFile, language, apiKey, onProgress } = options;

  if (!apiKey.trim()) {
    throw new Error('No API key configured. Please add your Groq API key in Settings.');
  }

  // Phase: Splitting
  onProgress?.({ phase: 'splitting', message: 'Decoding audio for splitting...' });

  const { splitAudioFile } = await import('./audioSplitter');
  const chunks = await splitAudioFile(audioFile, 600); // 10-minute chunks

  onProgress?.({ phase: 'splitting', message: `Split into ${chunks.length} parts` });

  const allSegments: WhisperSegment[] = [];
  let fullText = '';
  let totalDuration = 0;
  let detectedLanguage = language as string;
  let timeOffset = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const partLabel = `Part ${i + 1}/${chunks.length}`;

    // Transcribe this chunk (no recursive onProgress — we control status here)
    onProgress?.({ phase: 'uploading', message: `Uploading ${partLabel}...` });

    const chunkResult = await transcribeSingleChunk({
      audioFile: chunk,
      language,
      apiKey,
      // No onProgress for individual chunks — we handle it above
    });

    onProgress?.({ phase: 'transcribing', message: `Transcribed ${partLabel}` });

    // Merge: offset all timestamps by the accumulated duration
    for (const seg of chunkResult.segments) {
      allSegments.push({
        ...seg,
        id: allSegments.length,
        start: seg.start + timeOffset,
        end: seg.end + timeOffset,
        words: seg.words?.map(w => ({
          ...w,
          start: w.start + timeOffset,
          end: w.end + timeOffset,
        })),
      });
    }

    fullText += (fullText ? ' ' : '') + chunkResult.text;
    detectedLanguage = chunkResult.language;
    timeOffset += chunkResult.duration;
    totalDuration += chunkResult.duration;
  }

  // Build merged result
  onProgress?.({ phase: 'processing' });

  const mergedResult: TranscriptResult = {
    text: fullText,
    segments: allSegments,
    language: detectedLanguage,
    duration: totalDuration,
  };

  onProgress?.({ phase: 'done', result: mergedResult });
  return mergedResult;
}

/**
 * Transcribe a single audio chunk using Groq's Whisper API.
 * No file-size guard — caller is responsible for chunking.
 */
async function transcribeSingleChunk(options: TranscribeOptions): Promise<TranscriptResult> {
  const { audioFile, language, apiKey, onProgress } = options;

  if (!apiKey.trim()) {
    throw new Error('No API key configured. Please add your Groq API key in Settings.');
  }

  // Phase 1: Preparing form data
  onProgress?.({ phase: 'preparing' });
  
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', WHISPER_MODEL);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('language', language);

  // Phase 2: Uploading & Transcribing
  onProgress?.({ phase: 'uploading' });

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: formData,
    });
  } catch (err) {
    throw new Error('Network error. Please check your internet connection and try again.');
  }

  onProgress?.({ phase: 'transcribing' });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Groq API key in Settings.');
    }
    if (response.status === 413) {
      throw new Error('File too large for Groq API. Maximum is 25MB.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit reached. Free tier allows 2,000 requests/day and 7,200 audio seconds/hour. Please wait a moment and try again.');
    }

    let errorMsg = `Groq API error (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed?.error?.message) errorMsg = parsed.error.message;
    } catch { /* ignore parse errors */ }
    
    throw new Error(errorMsg);
  }

  // Phase 3: Processing response
  onProgress?.({ phase: 'processing' });

  const data = await response.json();

  const result: TranscriptResult = {
    text: data.text || '',
    segments: (data.segments || []).map((seg: any, idx: number) => ({
      id: idx,
      text: (seg.text || '').trim(),
      start: seg.start ?? 0,
      end: seg.end ?? 0,
      words: (seg.words || data.words || [])
        .filter((w: any) => w.start >= (seg.start ?? 0) && w.start < (seg.end ?? Infinity))
        .map((w: any) => ({
          word: w.word || '',
          start: w.start ?? 0,
          end: w.end ?? 0,
        })),
    })),
    language: data.language || language,
    duration: data.duration ?? 0,
  };

  // If segments are empty but we have text, create a single segment
  if (result.segments.length === 0 && result.text) {
    result.segments = [{
      id: 0,
      text: result.text.trim(),
      start: 0,
      end: result.duration || 0,
    }];
  }

  onProgress?.({ phase: 'done', result });
  return result;
}
