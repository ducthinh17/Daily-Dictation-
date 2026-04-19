import type { CheckResult } from '../types';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, '') // remove punctuation except apostrophe
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkAnswer(input: string, expected: string): CheckResult {
  const inputNorm = normalize(input);
  const expectedNorm = normalize(expected);
  
  if (!inputNorm && !expectedNorm) {
    return {
      correct: true,
      totalWords: 0,
      wrongCount: 0,
      missingCount: 0,
      extraCount: 0,
      wrongPositions: []
    };
  }

  const inputWords = inputNorm ? inputNorm.split(' ') : [];
  const expectedWords = expectedNorm ? expectedNorm.split(' ') : [];
  
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
