/**
 * Pronunciation scoring engine using word-level comparison.
 * Uses Levenshtein distance for phonetic similarity and LCS for alignment.
 */

export interface WordScore {
  expected: string;
  spoken: string;
  isCorrect: boolean;
  similarity: number; // 0-1
  status: 'correct' | 'close' | 'wrong' | 'missing' | 'extra';
}

export interface PronunciationResult {
  overallScore: number; // 0-100
  wordScores: WordScore[];
  wordsCorrect: number;
  wordsTotal: number;
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Normalize a word for comparison: lowercase, strip punctuation, trim.
 */
function normalize(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, '').trim();
}

/**
 * Compute word similarity as 1 - (distance / maxLength).
 */
function wordSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Align expected and spoken words using LCS-based diff.
 * Returns array of WordScore with proper alignment.
 */
function alignWords(expected: string[], spoken: string[]): WordScore[] {
  const m = expected.length;
  const n = spoken.length;

  // Build LCS table using normalized words
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalize(expected[i - 1]) === normalize(spoken[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find alignment
  let i = m, j = n;
  const tempResult: WordScore[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(expected[i - 1]) === normalize(spoken[j - 1])) {
      tempResult.push({
        expected: expected[i - 1],
        spoken: spoken[j - 1],
        isCorrect: true,
        similarity: 1,
        status: 'correct'
      });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i - 1][j] <= dp[i][j - 1]) {
      // Try to match with similarity
      const sim = wordSimilarity(expected[i - 1], spoken[j - 1]);
      if (sim >= 0.5) {
        tempResult.push({
          expected: expected[i - 1],
          spoken: spoken[j - 1],
          isCorrect: false,
          similarity: sim,
          status: sim >= 0.7 ? 'close' : 'wrong'
        });
        i--; j--;
      } else {
        // Extra spoken word
        tempResult.push({
          expected: '',
          spoken: spoken[j - 1],
          isCorrect: false,
          similarity: 0,
          status: 'extra'
        });
        j--;
      }
    } else if (i > 0 && (j === 0 || dp[i - 1][j] >= dp[i][j - 1])) {
      // Missing expected word
      tempResult.push({
        expected: expected[i - 1],
        spoken: '',
        isCorrect: false,
        similarity: 0,
        status: 'missing'
      });
      i--;
    } else if (j > 0) {
      tempResult.push({
        expected: '',
        spoken: spoken[j - 1],
        isCorrect: false,
        similarity: 0,
        status: 'extra'
      });
      j--;
    }
  }

  return tempResult.reverse();
}

/**
 * Score pronunciation by comparing expected text against spoken transcript.
 */
export function scorePronunciation(expectedText: string, spokenText: string): PronunciationResult {
  const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
  const spokenWords = spokenText.trim().split(/\s+/).filter(Boolean);

  if (expectedWords.length === 0) {
    return { overallScore: 0, wordScores: [], wordsCorrect: 0, wordsTotal: 0 };
  }

  if (spokenWords.length === 0) {
    const wordScores: WordScore[] = expectedWords.map(w => ({
      expected: w, spoken: '', isCorrect: false, similarity: 0, status: 'missing' as const
    }));
    return { overallScore: 0, wordScores, wordsCorrect: 0, wordsTotal: expectedWords.length };
  }

  const wordScores = alignWords(expectedWords, spokenWords);
  
  // Calculate scores based on expected words only (ignore extras)
  const expectedScores = wordScores.filter(s => s.status !== 'extra');
  const wordsCorrect = expectedScores.filter(s => s.isCorrect).length;
  const closeWords = expectedScores.filter(s => s.status === 'close').length;
  
  // Score: correct = 100%, close = proportional, wrong/missing = 0%
  const totalPoints = expectedScores.reduce((sum, s) => {
    if (s.isCorrect) return sum + 1;
    if (s.status === 'close') return sum + s.similarity;
    return sum;
  }, 0);

  const overallScore = Math.round((totalPoints / expectedWords.length) * 100);

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    wordScores,
    wordsCorrect: wordsCorrect + closeWords, // close counts as partial
    wordsTotal: expectedWords.length
  };
}
