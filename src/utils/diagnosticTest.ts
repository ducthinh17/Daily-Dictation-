import { db } from '../db';

export interface DiagnosticSentence {
  level: number;
  text: string;
  category: string;
}

export const DIAGNOSTIC_SENTENCES: DiagnosticSentence[] = [
  { level: 1, text: 'The cat is on the table.', category: 'Basic' },
  { level: 2, text: 'She went to the store yesterday.', category: 'Past tense' },
  { level: 3, text: 'I would like a cup of coffee, please.', category: 'Polite requests' },
  { level: 4, text: 'The weather has been quite unpredictable lately.', category: 'Present perfect' },
  { level: 5, text: 'Could you tell me where the nearest subway station is?', category: 'Indirect questions' },
  { level: 6, text: 'Despite the heavy rain, they decided to go hiking in the mountains.', category: 'Complex sentences' },
  { level: 7, text: 'The committee has reached a unanimous decision regarding the proposal.', category: 'Formal vocabulary' },
  { level: 8, text: 'Had I known about the cancellation, I would have made alternative arrangements.', category: 'Conditionals' },
  { level: 9, text: 'The unprecedented circumstances necessitated immediate governmental intervention.', category: 'Academic' },
  { level: 10, text: 'Notwithstanding the considerable opposition, the legislation was subsequently ratified by a substantial majority.', category: 'Advanced academic' },
];

export function calculateAccuracy(expected: string, typed: string): number {
  const expectedWords = expected.toLowerCase().replace(/[^a-z0-9\s']/g, '').trim().split(/\s+/);
  const typedWords = typed.toLowerCase().replace(/[^a-z0-9\s']/g, '').trim().split(/\s+/);
  
  if (typedWords.length === 0 || (typedWords.length === 1 && typedWords[0] === '')) return 0;
  
  let correct = 0;
  expectedWords.forEach((w, i) => {
    if (typedWords[i] === w) correct++;
  });
  return Math.round((correct / expectedWords.length) * 100);
}

export interface DiagnosticReport {
  overallScore: number;
  estimatedLevel: number;
  breakdown: { level: number; accuracy: number; category: string }[];
  strengths: string[];
  weaknesses: string[];
}

export function generateReport(results: { level: number; accuracy: number }[]): DiagnosticReport {
  const breakdown = results.map(r => ({
    ...r,
    category: DIAGNOSTIC_SENTENCES.find(s => s.level === r.level)?.category || 'Unknown'
  }));
  
  // Weighted score (higher levels count more)
  const totalWeight = results.reduce((sum, r) => sum + r.level, 0);
  const weightedScore = results.reduce((sum, r) => sum + (r.accuracy * r.level), 0);
  const overallScore = Math.round(weightedScore / totalWeight);

  // Estimated level: highest level where accuracy >= 70%
  let estimatedLevel = 1;
  for (const r of results.sort((a, b) => a.level - b.level)) {
    if (r.accuracy >= 70) estimatedLevel = r.level;
    else break;
  }

  const strengths = breakdown.filter(b => b.accuracy >= 80).map(b => b.category);
  const weaknesses = breakdown.filter(b => b.accuracy < 60).map(b => b.category);

  return { overallScore, estimatedLevel, breakdown, strengths, weaknesses };
}

export function playDiagnosticSentence(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const premium = voices.find(v => v.lang.includes('en-US') && (v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Google')));
  if (premium) utterance.voice = premium;
  window.speechSynthesis.speak(utterance);
}

export async function saveDiagnosticResult(report: DiagnosticReport, results: { level: number; accuracy: number }[]) {
  await db.diagnosticResults.add({
    id: crypto.randomUUID(),
    score: report.overallScore,
    level: report.estimatedLevel,
    details: results,
    takenAt: Date.now()
  });
}
