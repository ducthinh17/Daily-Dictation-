import type { WhisperSegment } from './transcriber';

export interface SegmentWithTime {
  text: string;
  startTime: number;
  endTime: number;
}

/**
 * Original function: splits plain text script into segments (no timestamps).
 * Used for "Audio + Script" mode.
 */
export function splitScript(script: string): string[] {
  // 1. Split by newlines first to preserve paragraphs
  const paragraphs = script.split(/\n+/).filter(p => p.trim().length > 0);
  
  const segments: string[] = [];
  
  for (const paragraph of paragraphs) {
    // 2. Split by sentence-ending punctuation. 
    // Using a regex that captures the punctuation to keep it, but here we can just split 
    // and keep the punctuation attached to the preceding word if possible, or just split.
    // A simpler approach: split by (.!?) followed by space
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
      if (!sentence.trim()) continue;
      
      const words = sentence.trim().split(/\s+/);
      
      if (words.length <= 10) {
        segments.push(sentence.trim());
      } else {
        // 3. Split by comma/semicolon/colon first
        const clauses = sentence.split(/(?<=[,;:])\s+/);
        
        for (const clause of clauses) {
          if (!clause.trim()) continue;
          
          const clauseWords = clause.trim().split(/\s+/);
          if (clauseWords.length <= 10) {
            segments.push(clause.trim());
          } else {
            // 4. Chunk into <= 8 word pieces
            for (let i = 0; i < clauseWords.length; i += 8) {
              const chunk = clauseWords.slice(i, i + 8).join(' ');
              if (chunk.trim()) {
                segments.push(chunk.trim());
              }
            }
          }
        }
      }
    }
  }
  
  return segments;
}

/**
 * NEW: Splits Whisper transcript segments into practice segments WITH timestamps.
 * Used for "Audio Only" mode.
 * 
 * Whisper already provides natural sentence-level segments with accurate timestamps.
 * We only need to split further if a segment has > 10 words.
 * When splitting, we use word-level timestamps to maintain precise alignment.
 */
export function splitTranscript(whisperSegments: WhisperSegment[]): SegmentWithTime[] {
  const MAX_WORDS = 10;
  const TARGET_WORDS = 8;
  const result: SegmentWithTime[] = [];

  for (const seg of whisperSegments) {
    const trimmedText = seg.text.trim();
    if (!trimmedText) continue;

    const wordCount = trimmedText.split(/\s+/).length;

    // If segment is short enough, keep it as-is
    if (wordCount <= MAX_WORDS) {
      result.push({
        text: trimmedText,
        startTime: seg.start,
        endTime: seg.end,
      });
      continue;
    }

    // Segment too long — split using word-level timestamps if available
    if (seg.words && seg.words.length > 0) {
      // Split word array into chunks of TARGET_WORDS
      for (let i = 0; i < seg.words.length; i += TARGET_WORDS) {
        const chunkWords = seg.words.slice(i, i + TARGET_WORDS);
        if (chunkWords.length === 0) continue;

        const chunkText = chunkWords.map(w => w.word).join(' ').trim();
        const chunkStart = chunkWords[0].start;
        const chunkEnd = chunkWords[chunkWords.length - 1].end;

        if (chunkText) {
          result.push({
            text: chunkText,
            startTime: chunkStart,
            endTime: chunkEnd,
          });
        }
      }
    } else {
      // No word-level timestamps — split text only, estimate times proportionally
      const words = trimmedText.split(/\s+/);
      const segDuration = seg.end - seg.start;
      const timePerWord = segDuration / words.length;

      for (let i = 0; i < words.length; i += TARGET_WORDS) {
        const chunkWords = words.slice(i, i + TARGET_WORDS);
        const chunkText = chunkWords.join(' ').trim();
        const chunkStart = seg.start + i * timePerWord;
        const chunkEnd = seg.start + Math.min(i + TARGET_WORDS, words.length) * timePerWord;

        if (chunkText) {
          result.push({
            text: chunkText,
            startTime: chunkStart,
            endTime: chunkEnd,
          });
        }
      }
    }
  }

  return result;
}
