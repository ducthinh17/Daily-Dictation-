import { useState, useEffect } from 'react';
import { Volume2, RotateCcw, Check, ThumbsUp, HelpCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { getDueCards, processReview, type SRSCard } from '../utils/srsEngine';
import { playAudio } from '../utils/ttsEngine';
import { db } from '../db';
import styles from './FlashcardPlayer.module.css';

export function FlashcardPlayer({ onComplete }: { onComplete: () => void }) {
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ttsEngine, setTtsEngine] = useState<'groq' | 'browser'>('browser');
  const [typedAnswer, setTypedAnswer] = useState('');

  useEffect(() => {
    async function init() {
      const settings = await db.settings.get('global');
      if (settings) {
        setTtsEngine(settings.transcribeEngine);
      }
      const due = await getDueCards(20);
      setCards(due);
      setLoading(false);
    }
    init();
  }, []);

  const currentCard = cards[currentIndex];

  const handlePlayAudio = async () => {
    if (!currentCard) return;
    try {
      await playAudio(currentCard.word, ttsEngine);
    } catch (e) {
      console.error('Failed to play audio', e);
    }
  };

  const handleRate = async (quality: number) => {
    if (!currentCard) return;
    
    await processReview(currentCard.word, quality);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setTypedAnswer('');
    } else {
      onComplete();
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading due flashcards...</div>;
  }

  if (cards.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Check size={48} className={styles.emptyIcon} />
        <h2>All Caught Up!</h2>
        <p>You have reviewed all your due flashcards. Check back later!</p>
        <button className={styles.doneBtn} onClick={onComplete}>Back to Review</button>
      </div>
    );
  }

  return (
    <div className={styles.playerContainer}>
      <div className={styles.progress}>
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      <div className={`${styles.cardContainer} ${isFlipped ? styles.flipped : ''}`}>
        <div className={styles.cardInner}>
          {/* Front of card */}
          <Card className={styles.cardFront}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.wordPrompt}>
                <span className={styles.questionMark}>?</span>
                <p>Listen and type the word, or recall its meaning</p>
                <button className={styles.playLargeBtn} onClick={handlePlayAudio}>
                  <Volume2 size={48} />
                </button>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  placeholder="Type the word..."
                  className={styles.typingInput}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsFlipped(true);
                    }
                  }}
                />
              </div>
              <button 
                className={styles.flipBtn} 
                onClick={() => setIsFlipped(true)}
              >
                {typedAnswer.trim() ? 'Check Answer' : 'Skip & Show Answer'}
              </button>
            </Card.Body>
          </Card>

          {/* Back of card */}
          <Card className={styles.cardBack}>
            <Card.Body className={styles.cardBody}>
              {typedAnswer.trim() && (
                <div className={styles.typingResult}>
                  {typedAnswer.toLowerCase().trim() === currentCard.word.toLowerCase().trim() ? (
                    <div className={styles.resultCorrect}><Check size={16} /> Correct Spelling</div>
                  ) : (
                    <div className={styles.resultIncorrect}>You typed: <s>{typedAnswer}</s></div>
                  )}
                </div>
              )}
              <h2 className={styles.wordReveal}>{currentCard.word}</h2>
              
              <div className={styles.actions}>
                <button className={styles.audioBtn} onClick={handlePlayAudio}>
                  <Volume2 size={20} /> Listen Again
                </button>
              </div>

              <div className={styles.ratingSection}>
                <h3>How well did you know it?</h3>
                <div className={styles.ratingButtons}>
                  <button className={`${styles.rateBtn} ${styles.rateAgain}`} onClick={() => handleRate(1)}>
                    <RotateCcw size={20} />
                    <span>Again</span>
                  </button>
                  <button className={`${styles.rateBtn} ${styles.rateHard}`} onClick={() => handleRate(3)}>
                    <HelpCircle size={20} />
                    <span>Hard</span>
                  </button>
                  <button className={`${styles.rateBtn} ${styles.rateGood}`} onClick={() => handleRate(4)}>
                    <ThumbsUp size={20} />
                    <span>Good</span>
                  </button>
                  <button className={`${styles.rateBtn} ${styles.rateEasy}`} onClick={() => handleRate(5)}>
                    <Check size={20} />
                    <span>Easy</span>
                  </button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
