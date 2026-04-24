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

  const n = inputWords.length;
  const m = expectedWords.length;
  
  // Create DP matrix
  // dp[i][j] represents the minimum operations to convert inputWords[0...i-1] to expectedWords[0...j-1]
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
  
  // actions[i][j] stores the operation used to reach this cell: 'M' (Match), 'S' (Substitute/Wrong), 'I' (Insert/Missing from input), 'D' (Delete/Extra in input)
  const actions: string[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(''));

  for (let i = 0; i <= n; i++) {
    dp[i][0] = i;
    actions[i][0] = 'D'; // Delete extra input words
  }
  for (let j = 0; j <= m; j++) {
    dp[0][j] = j;
    actions[0][j] = 'I'; // Insert missing expected words
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (inputWords[i - 1] === expectedWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        actions[i][j] = 'M';
      } else {
        const substitute = dp[i - 1][j - 1] + 1;
        const deleteOp = dp[i - 1][j] + 1; // Input has extra word
        const insertOp = dp[i][j - 1] + 1; // Input is missing word

        const minOp = Math.min(substitute, deleteOp, insertOp);
        dp[i][j] = minOp;

        if (minOp === substitute) {
          actions[i][j] = 'S';
        } else if (minOp === deleteOp) {
          actions[i][j] = 'D';
        } else {
          actions[i][j] = 'I';
        }
      }
    }
  }

  // Backtrack to count operations and find wrong positions in input
  let i = n;
  let j = m;
  let wrongCount = 0;
  let missingCount = 0;
  let extraCount = 0;
  const wrongPositions: number[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && actions[i][j] === 'M') {
      i--;
      j--;
    } else if (i > 0 && j > 0 && actions[i][j] === 'S') {
      wrongCount++;
      wrongPositions.push(i - 1); // 0-indexed position in input
      i--;
      j--;
    } else if (i > 0 && actions[i][j] === 'D') {
      extraCount++;
      wrongPositions.push(i - 1); // Mark the extra input word as wrong position
      i--;
    } else if (j > 0 && actions[i][j] === 'I') {
      missingCount++;
      j--;
    }
  }

  wrongPositions.sort((a, b) => a - b);
  const totalWrong = wrongCount + missingCount + extraCount;

  return {
    correct: totalWrong === 0,
    totalWords: expectedWords.length,
    wrongCount,
    missingCount,
    extraCount,
    wrongPositions
  };
}
