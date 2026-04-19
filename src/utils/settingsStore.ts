const KEYS = {
  GROQ_API_KEY: 'dictination_groq_api_key',
  DEFAULT_LANGUAGE: 'dictination_default_language',
  TRANSCRIBE_ENGINE: 'dictination_transcribe_engine',
  PLAYBACK_RATE: 'dictination_playback_rate',
} as const;

export type SupportedLanguage = 'en' | 'zh';
export type TranscribeEngine = 'groq' | 'browser';

// --- Groq API Key ---
export function getGroqApiKey(): string {
  return localStorage.getItem(KEYS.GROQ_API_KEY) || '';
}

export function setGroqApiKey(key: string): void {
  localStorage.setItem(KEYS.GROQ_API_KEY, key.trim());
}

export function hasGroqApiKey(): boolean {
  return getGroqApiKey().length > 0;
}

// --- Default Language ---
export function getDefaultLanguage(): SupportedLanguage {
  const lang = localStorage.getItem(KEYS.DEFAULT_LANGUAGE);
  if (lang === 'zh') return 'zh';
  return 'en';
}

export function setDefaultLanguage(lang: SupportedLanguage): void {
  localStorage.setItem(KEYS.DEFAULT_LANGUAGE, lang);
}

// --- Transcribe Engine ---
export function getTranscribeEngine(): TranscribeEngine {
  const engine = localStorage.getItem(KEYS.TRANSCRIBE_ENGINE);
  if (engine === 'browser') return 'browser';
  return 'groq';
}

export function setTranscribeEngine(engine: TranscribeEngine): void {
  localStorage.setItem(KEYS.TRANSCRIBE_ENGINE, engine);
}

// --- Playback Rate ---
export function getPlaybackRate(): number {
  const rate = localStorage.getItem(KEYS.PLAYBACK_RATE);
  return rate ? parseFloat(rate) : 1;
}

export function setPlaybackRate(rate: number): void {
  localStorage.setItem(KEYS.PLAYBACK_RATE, rate.toString());
}

// --- Validate Groq API Key ---
export async function testGroqApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey.trim()}` },
    });
    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: 'Invalid API key' };
    return { valid: false, error: `Error: ${res.status} ${res.statusText}` };
  } catch {
    return { valid: false, error: 'Network error. Please check your connection.' };
  }
}
