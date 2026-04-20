import type { ErrorCategory } from './errorAnalyzer';
import { classifyError } from './errorAnalyzer';

export interface GrammarTip {
  id: string;
  patterns: string[];
  category: ErrorCategory;
  title: string;
  explanation: string;
  examples: { wrong: string; correct: string; why: string }[];
}

// ── 30+ Grammar Tips Database (100% local, no API) ──
export const GRAMMAR_TIPS: GrammarTip[] = [
  // ── HOMOPHONES ──
  {
    id: 'their-there-theyre',
    patterns: ['their', 'there', "they're", 'theyre'],
    category: 'homophone',
    title: "Their vs There vs They're",
    explanation: '"There" refers to a place or existence. "Their" shows possession. "They\'re" is short for "they are".',
    examples: [
      { wrong: 'Their going home', correct: "They're going home", why: "They're = They are" },
      { wrong: "Put it they're", correct: 'Put it there', why: '"There" refers to a place' },
      { wrong: 'There dog is cute', correct: 'Their dog is cute', why: '"Their" = belonging to them' },
    ],
  },
  {
    id: 'your-youre',
    patterns: ['your', "you're", 'youre'],
    category: 'homophone',
    title: "Your vs You're",
    explanation: '"Your" shows possession. "You\'re" is short for "you are".',
    examples: [
      { wrong: 'Your welcome', correct: "You're welcome", why: "You're = You are" },
      { wrong: "You're car is nice", correct: 'Your car is nice', why: '"Your" = belonging to you' },
    ],
  },
  {
    id: 'its-its',
    patterns: ['its', "it's"],
    category: 'homophone',
    title: "Its vs It's",
    explanation: '"Its" shows possession (no apostrophe!). "It\'s" is short for "it is" or "it has".',
    examples: [
      { wrong: "The dog wagged it's tail", correct: 'The dog wagged its tail', why: '"Its" = belonging to it' },
      { wrong: 'Its a beautiful day', correct: "It's a beautiful day", why: "It's = It is" },
    ],
  },
  {
    id: 'to-too-two',
    patterns: ['to', 'too', 'two'],
    category: 'homophone',
    title: 'To vs Too vs Two',
    explanation: '"To" is a preposition or infinitive marker. "Too" means "also" or "excessively". "Two" is the number 2.',
    examples: [
      { wrong: 'I want to go to', correct: 'I want to go too', why: '"Too" = also' },
      { wrong: 'There are to cats', correct: 'There are two cats', why: '"Two" = the number 2' },
    ],
  },
  {
    id: 'hear-here',
    patterns: ['hear', 'here'],
    category: 'homophone',
    title: 'Hear vs Here',
    explanation: '"Hear" is about sound (with your ear). "Here" is about place (opposite of there).',
    examples: [
      { wrong: 'I can here you', correct: 'I can hear you', why: '"Hear" = perceive sound' },
      { wrong: 'Come hear', correct: 'Come here', why: '"Here" = this place' },
    ],
  },
  {
    id: 'know-no',
    patterns: ['know', 'no'],
    category: 'homophone',
    title: 'Know vs No',
    explanation: '"Know" means to be aware of. "No" is the opposite of yes.',
    examples: [
      { wrong: 'I no the answer', correct: 'I know the answer', why: '"Know" = have knowledge' },
    ],
  },
  {
    id: 'write-right',
    patterns: ['write', 'right', 'rite'],
    category: 'homophone',
    title: 'Write vs Right',
    explanation: '"Write" means to put words on paper. "Right" means correct or a direction.',
    examples: [
      { wrong: 'You are write', correct: 'You are right', why: '"Right" = correct' },
      { wrong: 'Please right a letter', correct: 'Please write a letter', why: '"Write" = put words on paper' },
    ],
  },
  {
    id: 'than-then',
    patterns: ['than', 'then'],
    category: 'homophone',
    title: 'Than vs Then',
    explanation: '"Than" is used for comparisons. "Then" relates to time or sequence.',
    examples: [
      { wrong: 'She is taller then me', correct: 'She is taller than me', why: '"Than" for comparisons' },
      { wrong: 'First eat, than sleep', correct: 'First eat, then sleep', why: '"Then" for sequence' },
    ],
  },
  {
    id: 'affect-effect',
    patterns: ['affect', 'effect'],
    category: 'homophone',
    title: 'Affect vs Effect',
    explanation: '"Affect" is usually a verb (to influence). "Effect" is usually a noun (a result).',
    examples: [
      { wrong: 'The rain will effect the game', correct: 'The rain will affect the game', why: '"Affect" = verb, to influence' },
      { wrong: 'The affect was dramatic', correct: 'The effect was dramatic', why: '"Effect" = noun, a result' },
    ],
  },
  {
    id: 'accept-except',
    patterns: ['accept', 'except'],
    category: 'homophone',
    title: 'Accept vs Except',
    explanation: '"Accept" means to receive or agree. "Except" means to exclude.',
    examples: [
      { wrong: 'I except your offer', correct: 'I accept your offer', why: '"Accept" = receive' },
      { wrong: 'Everyone accept him', correct: 'Everyone except him', why: '"Except" = excluding' },
    ],
  },
  {
    id: 'weather-whether',
    patterns: ['weather', 'whether'],
    category: 'homophone',
    title: 'Weather vs Whether',
    explanation: '"Weather" refers to climate conditions. "Whether" introduces alternatives.',
    examples: [
      { wrong: 'I wonder weather it will rain', correct: 'I wonder whether it will rain', why: '"Whether" = if/alternatives' },
    ],
  },
  {
    id: 'whose-whos',
    patterns: ['whose', "who's", 'whos'],
    category: 'homophone',
    title: "Whose vs Who's",
    explanation: '"Whose" shows possession. "Who\'s" is short for "who is" or "who has".',
    examples: [
      { wrong: "Who's book is this?", correct: 'Whose book is this?', why: '"Whose" = belonging to whom' },
      { wrong: 'Whose coming?', correct: "Who's coming?", why: "Who's = Who is" },
    ],
  },
  {
    id: 'where-wear-were',
    patterns: ['where', 'wear', 'were'],
    category: 'homophone',
    title: 'Where vs Wear vs Were',
    explanation: '"Where" is about place. "Wear" is about clothing. "Were" is past tense of "are".',
    examples: [
      { wrong: 'Were are you going?', correct: 'Where are you going?', why: '"Where" = what place' },
      { wrong: 'I where glasses', correct: 'I wear glasses', why: '"Wear" = have on body' },
    ],
  },
  {
    id: 'peace-piece',
    patterns: ['peace', 'piece'],
    category: 'homophone',
    title: 'Peace vs Piece',
    explanation: '"Peace" means calmness or no war. "Piece" means a part of something.',
    examples: [
      { wrong: 'A peace of cake', correct: 'A piece of cake', why: '"Piece" = a part/portion' },
    ],
  },
  {
    id: 'break-brake',
    patterns: ['break', 'brake'],
    category: 'homophone',
    title: 'Break vs Brake',
    explanation: '"Break" means to shatter or a pause. "Brake" is what stops a vehicle.',
    examples: [
      { wrong: 'Hit the break', correct: 'Hit the brake', why: '"Brake" = stopping device' },
    ],
  },

  // ── ARTICLES ──
  {
    id: 'a-an',
    patterns: ['a', 'an'],
    category: 'article',
    title: 'A vs An',
    explanation: 'Use "a" before consonant sounds. Use "an" before vowel sounds. It\'s about the SOUND, not the letter.',
    examples: [
      { wrong: 'A apple', correct: 'An apple', why: '"Apple" starts with a vowel sound' },
      { wrong: 'An university', correct: 'A university', why: '"University" starts with "yoo" consonant sound' },
      { wrong: 'A hour', correct: 'An hour', why: '"Hour" starts with a vowel sound (silent h)' },
    ],
  },
  {
    id: 'the-omission',
    patterns: ['the'],
    category: 'article',
    title: 'When to Use "The"',
    explanation: 'Use "the" for specific, known things. Omit it for general concepts, most proper nouns, and uncountable nouns used generally.',
    examples: [
      { wrong: 'I like the music', correct: 'I like music', why: 'General concept, no "the" needed' },
      { wrong: 'Sun is bright', correct: 'The sun is bright', why: 'There is only one sun — specific' },
    ],
  },

  // ── CONTRACTIONS ──
  {
    id: 'dont-doesnt',
    patterns: ["don't", "doesn't", 'dont', 'doesnt', 'do', 'does'],
    category: 'contraction',
    title: "Don't vs Doesn't",
    explanation: '"Don\'t" = do not (I/you/we/they). "Doesn\'t" = does not (he/she/it).',
    examples: [
      { wrong: "He don't like it", correct: "He doesn't like it", why: 'Third person singular uses "doesn\'t"' },
    ],
  },
  {
    id: 'cant-couldnt',
    patterns: ["can't", "couldn't", 'cant', 'couldnt'],
    category: 'contraction',
    title: "Can't vs Couldn't",
    explanation: '"Can\'t" = cannot (present). "Couldn\'t" = could not (past or conditional).',
    examples: [
      { wrong: "I couldn't go tomorrow", correct: "I can't go tomorrow", why: '"Can\'t" for present/future inability' },
    ],
  },

  // ── PREPOSITIONS ──
  {
    id: 'in-on-at-time',
    patterns: ['in', 'on', 'at'],
    category: 'preposition',
    title: 'In vs On vs At (Time)',
    explanation: '"At" for specific times. "On" for days/dates. "In" for months/years/long periods.',
    examples: [
      { wrong: 'I wake up in 7 AM', correct: 'I wake up at 7 AM', why: '"At" for specific times' },
      { wrong: 'See you at Monday', correct: 'See you on Monday', why: '"On" for days' },
      { wrong: 'Born at 1990', correct: 'Born in 1990', why: '"In" for years' },
    ],
  },
  {
    id: 'in-on-at-place',
    patterns: ['in', 'on', 'at'],
    category: 'preposition',
    title: 'In vs On vs At (Place)',
    explanation: '"At" for specific points. "On" for surfaces. "In" for enclosed spaces.',
    examples: [
      { wrong: 'I am in the bus stop', correct: 'I am at the bus stop', why: '"At" for specific points' },
      { wrong: 'The book is at the table', correct: 'The book is on the table', why: '"On" for surfaces' },
    ],
  },
  {
    id: 'to-for',
    patterns: ['to', 'for'],
    category: 'preposition',
    title: 'To vs For',
    explanation: '"To" indicates direction or recipient. "For" indicates purpose or benefit.',
    examples: [
      { wrong: 'This gift is to you', correct: 'This gift is for you', why: '"For" = intended benefit' },
      { wrong: 'I went for the store', correct: 'I went to the store', why: '"To" = direction/destination' },
    ],
  },

  // ── PLURAL ──
  {
    id: 'irregular-plural',
    patterns: ['child', 'children', 'man', 'men', 'woman', 'women', 'person', 'people', 'foot', 'feet', 'tooth', 'teeth'],
    category: 'plural',
    title: 'Irregular Plurals',
    explanation: 'Some English nouns have irregular plural forms that don\'t follow the -s/-es rule.',
    examples: [
      { wrong: 'Two childs', correct: 'Two children', why: '"Children" is the irregular plural' },
      { wrong: 'Three mans', correct: 'Three men', why: '"Men" is the irregular plural' },
      { wrong: 'Many peoples', correct: 'Many people', why: '"People" is already plural' },
    ],
  },

  // ── TENSE ──
  {
    id: 'past-simple-irregular',
    patterns: ['went', 'goed', 'came', 'comed', 'saw', 'seed', 'took', 'taked', 'made', 'maked'],
    category: 'tense',
    title: 'Irregular Past Tense',
    explanation: 'Many common English verbs have irregular past tense forms. They don\'t use -ed.',
    examples: [
      { wrong: 'I goed to school', correct: 'I went to school', why: '"Went" is past tense of "go"' },
      { wrong: 'She comed home', correct: 'She came home', why: '"Came" is past tense of "come"' },
      { wrong: 'He taked the book', correct: 'He took the book', why: '"Took" is past tense of "take"' },
    ],
  },
  {
    id: 'present-perfect',
    patterns: ['have', 'has', 'had'],
    category: 'tense',
    title: 'Present Perfect Tense',
    explanation: 'Use "have/has + past participle" for actions completed at an unspecified time or continuing to present.',
    examples: [
      { wrong: 'I have went there', correct: 'I have gone there', why: '"Gone" is the past participle of "go"' },
      { wrong: 'She has ate lunch', correct: 'She has eaten lunch', why: '"Eaten" is the past participle of "eat"' },
    ],
  },

  // ── SPELLING ──
  {
    id: 'ie-ei-rule',
    patterns: ['receive', 'recieve', 'believe', 'beleive', 'achieve', 'acheive'],
    category: 'spelling',
    title: 'I Before E (Except After C)',
    explanation: 'Generally: "i" before "e" except after "c" (receive, deceive). Exceptions exist (weird, seize).',
    examples: [
      { wrong: 'recieve', correct: 'receive', why: 'After "c", use "ei"' },
      { wrong: 'beleive', correct: 'believe', why: 'No "c" before, so "ie"' },
    ],
  },
  {
    id: 'double-consonant',
    patterns: ['occurred', 'occured', 'beginning', 'begining', 'referring', 'refering'],
    category: 'spelling',
    title: 'Double Consonants',
    explanation: 'When adding -ing/-ed to words ending in a single vowel + consonant, double the final consonant.',
    examples: [
      { wrong: 'occured', correct: 'occurred', why: 'Double the "r" before -ed' },
      { wrong: 'begining', correct: 'beginning', why: 'Double the "n" before -ing' },
    ],
  },
  {
    id: 'silent-letters',
    patterns: ['knowledge', 'knolege', 'psychology', 'sychology', 'island', 'iland'],
    category: 'spelling',
    title: 'Silent Letters',
    explanation: 'Many English words have silent letters that must be written but not pronounced.',
    examples: [
      { wrong: 'nowledge', correct: 'knowledge', why: 'Silent "k" at the start' },
      { wrong: 'iland', correct: 'island', why: 'Silent "s" in the middle' },
    ],
  },
  {
    id: 'common-misspellings',
    patterns: ['definitely', 'definately', 'separate', 'seperate', 'necessary', 'neccessary', 'accommodate', 'accomodate'],
    category: 'spelling',
    title: 'Commonly Misspelled Words',
    explanation: 'Some words are frequently misspelled. Pay attention to tricky letter combinations.',
    examples: [
      { wrong: 'definately', correct: 'definitely', why: 'Remember: de-FINITE-ly' },
      { wrong: 'seperate', correct: 'separate', why: 'Remember: there is "a rat" in separate' },
      { wrong: 'neccessary', correct: 'necessary', why: 'One "c", two "s"s' },
    ],
  },
];

// ── Find Matching Tip ──
export function findTipForError(expected: string, typed: string): GrammarTip | null {
  const exp = expected.toLowerCase().replace(/[^a-z']/g, '');
  const typ = typed.toLowerCase().replace(/[^a-z']/g, '');
  if (!exp || !typ || exp === typ) return null;

  // First, get the error category
  const category = classifyError(expected, typed);

  // Try to find a tip that matches the specific words
  const directMatch = GRAMMAR_TIPS.find(tip =>
    tip.patterns.includes(exp) && tip.patterns.includes(typ)
  );
  if (directMatch) return directMatch;

  // Try to find a tip matching just the expected word + same category
  const categoryMatch = GRAMMAR_TIPS.find(tip =>
    tip.category === category && tip.patterns.includes(exp)
  );
  if (categoryMatch) return categoryMatch;

  // Try matching just the typed word + same category
  const typedMatch = GRAMMAR_TIPS.find(tip =>
    tip.category === category && tip.patterns.includes(typ)
  );
  if (typedMatch) return typedMatch;

  // Fallback: any tip for this category
  const fallback = GRAMMAR_TIPS.find(tip => tip.category === category);
  return fallback || null;
}
