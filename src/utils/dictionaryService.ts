import { db } from '../db';

export interface DictionaryEntry {
  word: string;
  phonetics: { text?: string; audio?: string; accent?: 'US' | 'UK' | 'unknown' }[];
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string; synonyms: string[]; antonyms: string[] }[];
  }[];
  sourceUrls?: string[];
  cachedAt: number;
}

const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export const dictionaryService = {
  async fetchWord(word: string): Promise<DictionaryEntry | null> {
    const cleanWord = word.trim().toLowerCase().replace(/[^a-z0-9-']/g, '');
    if (!cleanWord) return null;

    // 1. Check Cache
    try {
      const cached = await db.dictionaryCache.get(cleanWord);
      if (cached && (Date.now() - cached.cachedAt < CACHE_TTL)) {
        return cached.data as DictionaryEntry;
      }
    } catch (e) {
      console.warn("Dictionary cache read failed", e);
    }

    // 2. Fetch from Free Dictionary API
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
      
      if (!response.ok) {
        if (response.status === 404) return null; // Word not found
        throw new Error(`Dictionary API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Free Dictionary API returns an array of results. We merge them.
      if (!Array.isArray(data) || data.length === 0) return null;

      const entry = this.normalizeApiData(cleanWord, data);

      // 3. Save to Cache
      try {
        await db.dictionaryCache.put({
          word: cleanWord,
          cachedAt: Date.now(),
          data: entry
        });
      } catch (e) {
        console.warn("Dictionary cache write failed", e);
      }

      return entry;

    } catch (error) {
      console.error("Dictionary service error:", error);
      return null;
    }
  },

  normalizeApiData(word: string, apiData: any[]): DictionaryEntry {
    const phonetics: DictionaryEntry['phonetics'] = [];
    const meaningsMap = new Map<string, any>();
    let sourceUrls: string[] = [];

    apiData.forEach(entry => {
      // Collect phonetics
      if (entry.phonetics && Array.isArray(entry.phonetics)) {
        entry.phonetics.forEach((p: any) => {
          if (p.text || p.audio) {
            let accent: 'US' | 'UK' | 'unknown' = 'unknown';
            if (p.audio) {
              if (p.audio.includes('-us.mp3')) accent = 'US';
              else if (p.audio.includes('-uk.mp3')) accent = 'UK';
            }
            // Avoid duplicates
            if (!phonetics.some(existing => existing.audio === p.audio && existing.text === p.text)) {
                phonetics.push({
                    text: p.text,
                    audio: p.audio,
                    accent
                });
            }
          }
        });
      }

      // If no phonetics array but top level phonetic exists
      if (phonetics.length === 0 && entry.phonetic) {
         phonetics.push({ text: entry.phonetic, accent: 'unknown' });
      }

      // Collect meanings
      if (entry.meanings && Array.isArray(entry.meanings)) {
        entry.meanings.forEach((m: any) => {
          const pos = m.partOfSpeech;
          if (!meaningsMap.has(pos)) {
            meaningsMap.set(pos, {
              partOfSpeech: pos,
              definitions: []
            });
          }
          
          const existingPos = meaningsMap.get(pos);
          m.definitions.forEach((d: any) => {
            existingPos.definitions.push({
              definition: d.definition,
              example: d.example,
              synonyms: [...(d.synonyms || []), ...(m.synonyms || [])],
              antonyms: [...(d.antonyms || []), ...(m.antonyms || [])]
            });
          });
        });
      }

      if (entry.sourceUrls) {
          sourceUrls = [...sourceUrls, ...entry.sourceUrls];
      }
    });

    return {
      word,
      phonetics,
      meanings: Array.from(meaningsMap.values()),
      sourceUrls: [...new Set(sourceUrls)],
      cachedAt: Date.now()
    };
  },

  playAudio(audioUrl?: string, text?: string, fallbackAccent: 'US' | 'UK' | 'AU' | 'IN' = 'US') {
      if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.play().catch(e => {
              console.warn("Failed to play audio url, falling back to TTS", e);
              if (text) this.playTTS(text, fallbackAccent);
          });
      } else if (text) {
          this.playTTS(text, fallbackAccent);
      }
  },

  playTTS(text: string, accent: 'US' | 'UK' | 'AU' | 'IN') {
    const cleanText = text.replace(/[^a-zA-Z0-9-'\s.,?!]/g, '').trim();
    if (!cleanText) return;

    // Youdao only supports US(2) and UK(1).
    if (accent === 'US' || accent === 'UK') {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=${accent === 'US' ? 2 : 1}`;
      const audio = new Audio(audioUrl);
      
      audio.play().catch(() => {
        this._playBrowserTTS(cleanText, accent);
      });
    } else {
      this._playBrowserTTS(cleanText, accent);
    }
  },

  _playBrowserTTS(text: string, accent: 'US' | 'UK' | 'AU' | 'IN') {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
        'US': 'en-US',
        'UK': 'en-GB',
        'AU': 'en-AU',
        'IN': 'en-IN'
    };
    utterance.lang = langMap[accent];
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => v.lang.includes(langMap[accent]) || v.lang.includes(langMap[accent].replace('-', '_')));
    if (preferredVoices.length > 0) {
        // prefer voices with "Premium", "Natural", "Google" in the name
        const premium = preferredVoices.find(v => v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Google'));
        utterance.voice = premium || preferredVoices[0];
    }

    window.speechSynthesis.speak(utterance);
  }
};
