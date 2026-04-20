import type { WordError } from '../types';

// ── Error Categories ──
export type ErrorCategory =
  | 'homophone'
  | 'spelling'
  | 'article'
  | 'preposition'
  | 'contraction'
  | 'plural'
  | 'tense'
  | 'word_order'
  | 'unknown';

export interface ErrorInsight {
  category: ErrorCategory;
  count: number;
  percentage: number;
  label: string;
  color: string;
  icon: string;
  examples: string[];
}

// ── Homophone Pairs Database (~50 pairs) ──
const HOMOPHONE_PAIRS: Record<string, string[]> = {
  'their': ['there', "they're", 'theyre'],
  'there': ['their', "they're", 'theyre'],
  "they're": ['their', 'there'],
  'theyre': ['their', 'there'],
  'your': ["you're", 'youre'],
  "you're": ['your'],
  'youre': ['your'],
  'its': ["it's", 'its'],
  "it's": ['its'],
  'to': ['too', 'two'],
  'too': ['to', 'two'],
  'two': ['to', 'too'],
  'hear': ['here'],
  'here': ['hear'],
  'know': ['no'],
  'no': ['know'],
  'knew': ['new'],
  'new': ['knew'],
  'write': ['right', 'rite'],
  'right': ['write', 'rite'],
  'weather': ['whether'],
  'whether': ['weather'],
  'where': ['wear', 'were'],
  'wear': ['where', 'were'],
  'were': ['where', 'wear'],
  'which': ['witch'],
  'witch': ['which'],
  'peace': ['piece'],
  'piece': ['peace'],
  'through': ['threw'],
  'threw': ['through'],
  'accept': ['except'],
  'except': ['accept'],
  'affect': ['effect'],
  'effect': ['affect'],
  'than': ['then'],
  'then': ['than'],
  'brake': ['break'],
  'break': ['brake'],
  'by': ['buy', 'bye'],
  'buy': ['by', 'bye'],
  'bye': ['by', 'buy'],
  'would': ['wood'],
  'wood': ['would'],
  'seen': ['scene'],
  'scene': ['seen'],
  'whose': ["who's", 'whos'],
  "who's": ['whose'],
  'whos': ['whose'],
  'wait': ['weight'],
  'weight': ['wait'],
  'flour': ['flower'],
  'flower': ['flour'],
  'meat': ['meet'],
  'meet': ['meat'],
  'sea': ['see'],
  'see': ['sea'],
  'weak': ['week'],
  'week': ['weak'],
  'sun': ['son'],
  'son': ['sun'],
  'one': ['won'],
  'won': ['one'],
  'tail': ['tale'],
  'tale': ['tail'],
  'bare': ['bear'],
  'bear': ['bare'],
  'die': ['dye'],
  'dye': ['die'],
  'fair': ['fare'],
  'fare': ['fair'],
  'male': ['mail'],
  'mail': ['male'],
  'pair': ['pear', 'pare'],
  'pear': ['pair'],
  'pare': ['pair'],
  'rain': ['reign', 'rein'],
  'reign': ['rain', 'rein'],
  'rein': ['rain', 'reign'],
  'role': ['roll'],
  'roll': ['role'],
  'sale': ['sail'],
  'sail': ['sale'],
  'steal': ['steel'],
  'steel': ['steal'],
  'stare': ['stair'],
  'stair': ['stare'],
  'waist': ['waste'],
  'waste': ['waist'],
};

const ARTICLES = new Set(['a', 'an', 'the']);
const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'by', 'to', 'for', 'with', 'from',
  'of', 'about', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'under', 'over'
]);

// ── Levenshtein Distance ──
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

// ── Classify a Single Error ──
export function classifyError(expected: string, typed: string): ErrorCategory {
  const exp = expected.toLowerCase().replace(/[^a-z']/g, '');
  const typ = typed.toLowerCase().replace(/[^a-z']/g, '');

  if (!exp || !typ) return 'unknown';
  if (exp === typ) return 'unknown';

  // 1. Homophone check
  const homophones = HOMOPHONE_PAIRS[exp];
  if (homophones && homophones.includes(typ)) {
    return 'homophone';
  }

  // 2. Article check
  if (ARTICLES.has(exp) || ARTICLES.has(typ)) {
    return 'article';
  }

  // 3. Preposition check
  if (PREPOSITIONS.has(exp) && PREPOSITIONS.has(typ)) {
    return 'preposition';
  }

  // 4. Contraction check
  if (exp.includes("'") || typ.includes("'")) {
    return 'contraction';
  }

  // 5. Plural check (one ends with s/es, other doesn't)
  if (
    (exp.endsWith('s') && !typ.endsWith('s') && (exp.slice(0, -1) === typ || exp.slice(0, -2) === typ)) ||
    (typ.endsWith('s') && !exp.endsWith('s') && (typ.slice(0, -1) === exp || typ.slice(0, -2) === exp))
  ) {
    return 'plural';
  }

  // 6. Tense check (common tense patterns)
  const tensePatterns = [
    { suffix: 'ed', base: (w: string) => w.replace(/ed$/, '') },
    { suffix: 'ing', base: (w: string) => w.replace(/ing$/, '') },
  ];
  for (const p of tensePatterns) {
    if (exp.endsWith(p.suffix) && !typ.endsWith(p.suffix)) {
      const base = p.base(exp);
      if (typ.startsWith(base.slice(0, Math.max(3, base.length - 1)))) return 'tense';
    }
    if (typ.endsWith(p.suffix) && !exp.endsWith(p.suffix)) {
      const base = p.base(typ);
      if (exp.startsWith(base.slice(0, Math.max(3, base.length - 1)))) return 'tense';
    }
  }

  // 7. Spelling check (Levenshtein distance ≤ 2)
  if (levenshtein(exp, typ) <= 2) {
    return 'spelling';
  }

  return 'unknown';
}

// ── Category Metadata ──
const CATEGORY_META: Record<ErrorCategory, { label: string; color: string; icon: string }> = {
  homophone:    { label: 'Homophones',   color: '#ef4444', icon: '🔊' },
  spelling:     { label: 'Spelling',     color: '#f59e0b', icon: '✏️' },
  article:      { label: 'Articles',     color: '#3b82f6', icon: '📝' },
  preposition:  { label: 'Prepositions', color: '#8b5cf6', icon: '📍' },
  contraction:  { label: 'Contractions', color: '#10b981', icon: '🔗' },
  plural:       { label: 'Plurals',      color: '#06b6d4', icon: '📊' },
  tense:        { label: 'Verb Tense',   color: '#ec4899', icon: '⏳' },
  word_order:   { label: 'Word Order',   color: '#6366f1', icon: '🔀' },
  unknown:      { label: 'Other',        color: '#64748b', icon: '❓' },
};

// ── Aggregate Error Insights ──
export function getErrorInsights(errors: WordError[]): ErrorInsight[] {
  if (errors.length === 0) return [];

  const categoryCount: Record<ErrorCategory, { count: number; examples: Set<string> }> = {
    homophone: { count: 0, examples: new Set() },
    spelling: { count: 0, examples: new Set() },
    article: { count: 0, examples: new Set() },
    preposition: { count: 0, examples: new Set() },
    contraction: { count: 0, examples: new Set() },
    plural: { count: 0, examples: new Set() },
    tense: { count: 0, examples: new Set() },
    word_order: { count: 0, examples: new Set() },
    unknown: { count: 0, examples: new Set() },
  };

  errors.forEach(err => {
    const category = classifyError(err.expectedWord, err.typedWord);
    categoryCount[category].count++;
    if (categoryCount[category].examples.size < 3) {
      categoryCount[category].examples.add(`${err.typedWord} → ${err.expectedWord}`);
    }
  });

  const total = errors.length;

  return Object.entries(categoryCount)
    .filter(([, data]) => data.count > 0)
    .map(([cat, data]) => ({
      category: cat as ErrorCategory,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      label: CATEGORY_META[cat as ErrorCategory].label,
      color: CATEGORY_META[cat as ErrorCategory].color,
      icon: CATEGORY_META[cat as ErrorCategory].icon,
      examples: Array.from(data.examples),
    }))
    .sort((a, b) => b.count - a.count);
}
