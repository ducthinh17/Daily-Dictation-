import { useState, useEffect } from 'react';
import { RefreshCcw, Check, ArrowRight } from 'lucide-react';
import { Button } from './ui/Button';
import styles from './SentenceScramble.module.css';

interface SentenceScrambleProps {
  text: string;
  onComplete: (correct: boolean) => void;
  onSkip: () => void;
}

export function SentenceScramble({ text, onComplete, onSkip }: SentenceScrambleProps) {
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    // Basic tokenizer: split by spaces, removing extra spaces
    const words = text
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    // Shuffle words using Fisher-Yates
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // In very rare cases the shuffle might equal the original
    if (shuffled.join(' ') === words.join(' ') && words.length > 1) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }

    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsCorrect(null);
  }, [text]);

  const handleSelectWord = (word: string, index: number) => {
    if (isCorrect) return; // Prevent moves after correct

    // Remove from available, add to selected
    const newAvailable = [...availableWords];
    newAvailable.splice(index, 1);
    setAvailableWords(newAvailable);
    setSelectedWords([...selectedWords, word]);
  };

  const handleDeselectWord = (word: string, index: number) => {
    if (isCorrect) return;

    // Remove from selected, return to available
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
  };

  const handleCheck = () => {
    const userSentence = selectedWords.join(' ').toLowerCase().replace(/[.,!?;:]/g, '');
    const targetSentence = text.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    
    if (userSentence === targetSentence) {
      setIsCorrect(true);
      // Wait a moment then trigger complete
      setTimeout(() => {
        onComplete(true);
      }, 1000);
    } else {
      setIsCorrect(false);
      // Shake animation effect would trigger here
      setTimeout(() => setIsCorrect(null), 1000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.instruction}>
        Listen to the audio, then tap the words to reconstruct the sentence.
      </div>

      <div className={`${styles.dropZone} ${isCorrect === true ? styles.correct : isCorrect === false ? styles.incorrect : ''}`}>
        {selectedWords.length === 0 && availableWords.length > 0 && (
          <span className={styles.placeholder}>Your sentence will appear here...</span>
        )}
        
        {selectedWords.map((word, idx) => (
          <button 
            key={`${word}-${idx}`} 
            className={styles.wordChipSelected}
            onClick={() => handleDeselectWord(word, idx)}
          >
            {word}
          </button>
        ))}
      </div>

      <div className={styles.wordBank}>
        {availableWords.map((word, idx) => (
          <button 
            key={`${word}-${idx}`} 
            className={styles.wordChipAvailable}
            onClick={() => handleSelectWord(word, idx)}
          >
            {word}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <Button 
          variant="secondary" 
          onClick={() => {
            setAvailableWords([...availableWords, ...selectedWords].sort(() => 0.5 - Math.random()));
            setSelectedWords([]);
            setIsCorrect(null);
          }}
          disabled={selectedWords.length === 0 || isCorrect === true}
        >
          <RefreshCcw size={16} /> Reset
        </Button>
        
        {availableWords.length === 0 && isCorrect !== true && (
          <Button variant="primary" onClick={handleCheck}>
            Check <Check size={16} />
          </Button>
        )}

        <Button variant="ghost" onClick={onSkip} className={styles.skipBtn}>
          Skip <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
