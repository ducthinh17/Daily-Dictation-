import { db } from '../db';
import type { SupportedLanguage } from '../types';

export type TranscribeEngine = 'groq' | 'browser';

// Default values
export const DEFAULT_SETTINGS = {
  groqApiKey: '',
  defaultLanguage: 'en' as SupportedLanguage,
  transcribeEngine: 'groq' as TranscribeEngine,
  playbackRate: 1
};

// --- Dexie Async Getters & Setters ---

export async function getSettings() {
  const settings = await db.settings.get('global');
  return settings || DEFAULT_SETTINGS;
}

export async function getGroqApiKey(): Promise<string> {
  const settings = await getSettings();
  return settings.groqApiKey;
}

export async function setGroqApiKey(key: string): Promise<void> {
  await db.settings.update('global', { groqApiKey: key.trim() });
}

export async function hasGroqApiKey(): Promise<boolean> {
  const key = await getGroqApiKey();
  return key.length > 0;
}

export async function getDefaultLanguage(): Promise<SupportedLanguage> {
  const settings = await getSettings();
  return settings.defaultLanguage;
}

export async function setDefaultLanguage(lang: SupportedLanguage): Promise<void> {
  await db.settings.update('global', { defaultLanguage: lang });
}

export async function getTranscribeEngine(): Promise<TranscribeEngine> {
  const settings = await getSettings();
  return settings.transcribeEngine;
}

export async function setTranscribeEngine(engine: TranscribeEngine): Promise<void> {
  await db.settings.update('global', { transcribeEngine: engine });
}

export async function getPlaybackRate(): Promise<number> {
  const settings = await getSettings();
  return settings.playbackRate;
}

export async function setPlaybackRate(rate: number): Promise<void> {
  await db.settings.update('global', { playbackRate: rate });
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
