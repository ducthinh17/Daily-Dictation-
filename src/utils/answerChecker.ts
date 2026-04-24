import type { CheckResult } from '../types';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, '') // Keep letters, numbers, spaces, and apostrophes from ANY language
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string, language: string = 'en'): string[] {
  const norm = normalize(text);
  if (!norm) return [];

  if (language === 'zh' || language === 'ja' || language === 'zh-CN' || language === 'ja-JP') {
    try {
      const segmenter = new Intl.Segmenter(language, { granularity: 'word' });
      return Array.from(segmenter.segment(norm))
        .filter(s => s.isWordLike)
        .map(s => s.segment);
    } catch (e) {
      console.warn('Intl.Segmenter not supported or failed, falling back to char split', e);
      return norm.split('');
    }
  }

  return norm.split(' ');
}

export function checkAnswer(input: string, expected: string, language: string = 'en'): CheckResult {
  const inputWords = tokenize(input, language);
  const expectedWords = tokenize(expected, language);
  
  if (inputWords.length === 0 && expectedWords.length === 0) {
    return {
      correct: true,
      totalWords: 0,
      wrongCount: 0,
      missingCount: 0,
      extraCount: 0,
      wrongPositions: []
    };
  }

  
  let wrongCount = 0;
  const wrongPositions: number[] = [];
  
  // simple word by word comparison based on expected length
  for (let i = 0; i < expectedWords.length; i++) {
    if (i < inputWords.length) {
      if (inputWords[i] !== expectedWords[i]) {
        wrongCount++;
        wrongPositions.push(i);
      }
    } else {
      // Missing words
      wrongPositions.push(i);
    }
  }
  
  const missingCount = Math.max(0, expectedWords.length - inputWords.length);
  const extraCount = Math.max(0, inputWords.length - expectedWords.length);
  
  const totalWrong = wrongCount + missingCount + extraCount;

  return {
    correct: totalWrong === 0 && inputWords.length === expectedWords.length,
    totalWords: expectedWords.length,
    wrongCount,
    missingCount,
    extraCount,
    wrongPositions
  };
}
