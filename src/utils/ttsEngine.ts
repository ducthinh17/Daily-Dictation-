import { db } from '../db';

export async function playAudio(text: string, engine: 'groq' | 'browser' = 'browser', lang: 'en' | 'zh' = 'en') {
  if (engine === 'browser') {
    return new Promise<void>((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser TTS not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select appropriate voice based on language
      const voices = window.speechSynthesis.getVoices();
      
      if (lang === 'en') {
        const enVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') || v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      } else if (lang === 'zh') {
        const zhVoice = voices.find(v => v.lang.startsWith('zh'));
        if (zhVoice) utterance.voice = zhVoice;
      }

      // Get user playback rate preference
      db.settings.get('global').then(settings => {
        if (settings && settings.playbackRate) {
           // Limit TTS rate between 0.5 and 2
           utterance.rate = Math.max(0.5, Math.min(2, settings.playbackRate));
        }
      });

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      window.speechSynthesis.speak(utterance);
    });
  } else {
    // If future integration with an external API (like OpenAI TTS) happens
    // Note: Groq currently doesn't have an official TTS endpoint, but we can mock or fallback to browser
    console.warn('External TTS not fully implemented, falling back to browser TTS');
    return playAudio(text, 'browser', lang);
  }
}
