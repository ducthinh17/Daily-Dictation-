import { db } from '../db';

const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

export const translationService = {
  async translate(text: string, fromLang: string = 'en', toLang: string = 'vi'): Promise<string | null> {
    const cleanText = text.trim();
    if (!cleanText) return null;

    const langPair = `${fromLang}|${toLang}`;
    
    // Hash key can just be the text itself for simplicity since sentences are short
    // However, including langPair ensures we don't return EN when asking for VI
    const cacheKey = `${langPair}:${cleanText}`;

    // 1. Check Cache
    try {
      const cached = await db.translationCache.get(cacheKey);
      if (cached && (Date.now() - cached.cachedAt < CACHE_TTL)) {
        return cached.translation;
      }
    } catch (e) {
      console.warn("Translation cache read failed", e);
    }

    // 2. Fetch from MyMemory API
    try {
      // MyMemory API doesn't require a key for up to 5000 chars/day (anonymous) or 50000 chars/day (with email)
      // See: https://translated.net/projects/api-documentation/
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${langPair}`
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText;
        
        // MyMemory sometimes returns "PLEASE SELECT TWO DISTINCT LANGUAGES" if they are the same
        if (translatedText.includes("PLEASE SELECT TWO DISTINCT LANGUAGES")) {
          return null;
        }

        // 3. Save to Cache
        try {
          await db.translationCache.put({
            key: cacheKey,
            text: cleanText,
            translation: translatedText,
            langPair,
            cachedAt: Date.now()
          });
        } catch (e) {
          console.warn("Translation cache write failed", e);
        }

        return translatedText;
      }

      return null;
    } catch (error) {
      console.error("Translation service error:", error);
      
      // Fallback: Google Translate Unofficial (can be blocked, but good as a secondary try)
      try {
        const fallbackRes = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(cleanText)}`
        );
        if (fallbackRes.ok) {
           const fallbackData = await fallbackRes.json();
           if (fallbackData && fallbackData[0] && fallbackData[0][0] && fallbackData[0][0][0]) {
               const fallbackTranslatedText = fallbackData[0].map((item: any) => item[0]).join('');
               
               // Save fallback to cache too
               try {
                await db.translationCache.put({
                  key: cacheKey,
                  text: cleanText,
                  translation: fallbackTranslatedText,
                  langPair,
                  cachedAt: Date.now()
                });
              } catch (e) {
                console.warn("Translation cache write failed", e);
              }

               return fallbackTranslatedText;
           }
        }
      } catch (fallbackError) {
          console.error("Fallback translation also failed", fallbackError);
      }

      return null;
    }
  }
};
