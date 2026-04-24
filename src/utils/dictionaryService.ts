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
  async fetchWord(word: string, language: string = 'en'): Promise<DictionaryEntry | null> {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return null;

    const cacheKey = `${language}:${cleanWord}`;

    // 1. Check Cache
    try {
      const cached = await db.dictionaryCache.get(cacheKey);
      if (cached && (Date.now() - cached.cachedAt < CACHE_TTL)) {
        return cached.data as DictionaryEntry;
      }
    } catch (e) {
      console.warn("Dictionary cache read failed", e);
    }

    let entry: DictionaryEntry | null = null;

    if (language === 'en') {
      entry = await this.fetchEnglishDict(cleanWord);
    } else {
      entry = await this.fetchGoogleDict(cleanWord, language);
    }

    if (entry) {
      // 3. Save to Cache
      try {
        await db.dictionaryCache.put({
          word: cacheKey,
          cachedAt: Date.now(),
          data: entry
        });
      } catch (e) {
        console.warn("Dictionary cache write failed", e);
      }
    }

    return entry;
  },

  async fetchEnglishDict(word: string): Promise<DictionaryEntry | null> {
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        if (!response.ok) {
          if (response.status === 404) return null; // Word not found
          throw new Error(`Dictionary API error: ${response.status}`);
        }
  
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;
  
        return this.normalizeApiData(word, data);
      } catch (error) {
        console.error("Dictionary service error:", error);
        return null;
      }
  },

  async fetchGoogleDict(word: string, lang: string): Promise<DictionaryEntry | null> {
    try {
      // Query English definition for JA/ZH to be consistent and have a good dictionary structure
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${lang}&tl=en&hl=en&dt=bd&dt=md&dt=rm&dt=t&q=${encodeURIComponent(word)}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !data[0]) return null;

      // Extract Romaji/Pinyin
      let pinyin = '';
      if (data[0] && Array.isArray(data[0])) {
         for (const item of data[0]) {
             if (item && item.length > 3 && typeof item[3] === 'string' && item[3]) {
                 pinyin = item[3];
                 break;
             }
         }
      }
      
      const translation = data[0][0][0];
      const phonetics: DictionaryEntry['phonetics'] = [];
      
      if (pinyin) {
          phonetics.push({ text: pinyin, accent: 'unknown' });
      }

      const meanings: DictionaryEntry['meanings'] = [];
      if (data[1] && Array.isArray(data[1])) {
          data[1].forEach(posGroup => {
              const pos = posGroup[0]; // e.g., "verb"
              const defs = posGroup[2] || [];
              const definitions = defs.map((d: any) => ({
                  definition: d[0], // Translation meaning
                  example: d[1] ? `Similar: ${d[1].join(', ')}` : '', // Synonyms in original lang
                  synonyms: [],
                  antonyms: []
              }));
              
              if (definitions.length === 0 && posGroup[1]) {
                 // Fallback if no detailed defs
                 definitions.push({
                     definition: posGroup[1].join(', '),
                     synonyms: [], antonyms: []
                 });
              }

              meanings.push({
                  partOfSpeech: pos,
                  definitions
              });
          });
      } else {
          // If no dictionary data, just use the translation
          meanings.push({
              partOfSpeech: 'translation',
              definitions: [{ definition: translation, synonyms: [], antonyms: [] }]
          });
      }

      return {
          word,
          phonetics,
          meanings,
          sourceUrls: [],
          cachedAt: Date.now()
      };
    } catch(e) {
      console.error(e);
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

  playAudio(audioUrl?: string, text?: string, fallbackAccent: 'US' | 'UK' | 'AU' | 'IN' = 'US', language = 'en') {
      if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.play().catch(e => {
              console.warn("Failed to play audio url, falling back to TTS", e);
              if (text) this.playTTS(text, fallbackAccent, language);
          });
      } else if (text) {
          this.playTTS(text, fallbackAccent, language);
      }
  },

  playTTS(text: string, accent: 'US' | 'UK' | 'AU' | 'IN', language = 'en') {
    const cleanText = text.replace(/[^a-zA-Z0-9-'\s.,?!ぁ-んァ-ン一-龯]/g, '').trim();
    if (!cleanText) return;

    // Youdao only supports US(2) and UK(1) for English.
    if (language === 'en' && (accent === 'US' || accent === 'UK')) {
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=${accent === 'US' ? 2 : 1}`;
      const audio = new Audio(audioUrl);
      
      audio.play().catch(() => {
        this._playBrowserTTS(cleanText, accent, language);
      });
    } else {
      this._playBrowserTTS(cleanText, accent, language);
    }
  },

  _playBrowserTTS(text: string, accent: 'US' | 'UK' | 'AU' | 'IN', language = 'en') {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    let targetLang = 'en-US';
    if (language === 'ja') targetLang = 'ja-JP';
    else if (language === 'zh') targetLang = 'zh-CN';
    else {
      const langMap: Record<string, string> = {
          'US': 'en-US',
          'UK': 'en-GB',
          'AU': 'en-AU',
          'IN': 'en-IN'
      };
      targetLang = langMap[accent] || 'en-US';
    }
    
    utterance.lang = targetLang;
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => v.lang.includes(targetLang) || v.lang.includes(targetLang.replace('-', '_')));
    if (preferredVoices.length > 0) {
        // prefer voices with "Premium", "Natural", "Google" in the name
        const premium = preferredVoices.find(v => v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Google'));
        utterance.voice = premium || preferredVoices[0];
    }

    window.speechSynthesis.speak(utterance);
  }
};
