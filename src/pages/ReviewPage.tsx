import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Repeat, CheckCircle, AlertTriangle, BookOpen, ArrowRight } from 'lucide-react';
import { db } from '../db';
import { WordDictionaryPopup, type Position } from '../components/WordDictionaryPopup';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import styles from './ReviewPage.module.css';

export function ReviewPage() {
  const [reviewingWord, setReviewingWord] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<Position | null>(null);

  // Fetch all errors
  const allErrors = useLiveQuery(() => db.wordErrors.orderBy('timestamp').reverse().toArray());
  const lessons = useLiveQuery(() => db.lessons.toArray());

  if (!allErrors || !lessons) {
    return <div className={styles.loading}>Loading review data...</div>;
  }

  // Aggregate errors by word
  const errorMap = new Map<string, { count: number; typedWords: Set<string>; latestDate: number; lessonIds: Set<string> }>();
  
  allErrors.forEach(err => {
    const w = err.word.toLowerCase();
    if (!errorMap.has(w)) {
      errorMap.set(w, { count: 0, typedWords: new Set(), latestDate: err.timestamp, lessonIds: new Set() });
    }
    const entry = errorMap.get(w)!;
    entry.count += 1;
    if (err.typedWord) entry.typedWords.add(err.typedWord.toLowerCase());
    if (err.timestamp > entry.latestDate) entry.latestDate = err.timestamp;
    entry.lessonIds.add(err.lessonId);
  });

  const sortedErrors = Array.from(errorMap.entries()).sort((a, b) => b[1].count - a[1].count);

  const handleMasterWord = async (word: string) => {
    // Delete all error records for this word to "master" it
    const errorsToDelete = allErrors.filter(e => e.word.toLowerCase() === word.toLowerCase());
    const ids = errorsToDelete.map(e => e.id);
    await db.wordErrors.bulkDelete(ids);
    setReviewingWord(null);
    setTypedInput('');
  };

  const checkReviewInput = () => {
    if (reviewingWord && typedInput.trim().toLowerCase() === reviewingWord.toLowerCase()) {
      handleMasterWord(reviewingWord);
    } else {
      // Shaking animation or error state could be added here
      alert("Incorrect! Keep trying or check the spelling.");
    }
  };

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
      bottom: rect.bottom
    });
    setSelectedWord(word);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className="header-title">
            <Repeat className="header-icon" size={36} />
            <h1 className="page-title">Spaced Repetition Review</h1>
          </div>
          <p className="page-subtitle">Master the words you've struggled with to build a perfect vocabulary.</p>
        </div>
        
        <div className={styles.statsOverview}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{sortedErrors.length}</span>
            <span className={styles.statLabel}>Words to Review</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{allErrors.length}</span>
            <span className={styles.statLabel}>Total Mistakes</span>
          </div>
        </div>
      </header>

      {reviewingWord ? (
        <Card variant="highlight" className={styles.reviewActiveCard}>
          <Card.Header>
            <Card.Title>Target Practice</Card.Title>
            <Badge variant="warning">Focus Mode</Badge>
          </Card.Header>
          <Card.Body className={styles.reviewActiveBody}>
            <div className={styles.reviewInstructions}>
              Type the word correctly to mark it as mastered.
            </div>
            
            <div className={styles.targetWordReveal}>
              {reviewingWord}
            </div>

            <div className={styles.reviewInputWrapper}>
              <input 
                type="text" 
                autoFocus
                className={styles.reviewInput}
                placeholder="Type the word here..."
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkReviewInput()}
              />
              <Button onClick={checkReviewInput} variant="primary">
                Verify <ArrowRight size={16} />
              </Button>
            </div>
          </Card.Body>
          <Card.Footer>
            <Button variant="ghost" onClick={() => { setReviewingWord(null); setTypedInput(''); }}>
              Cancel
            </Button>
            <Button variant="ghost" className={styles.markMasteredBtn} onClick={() => handleMasterWord(reviewingWord)}>
              Force Master <CheckCircle size={16} />
            </Button>
          </Card.Footer>
        </Card>
      ) : (
        <Tabs defaultValue="needs-review">
          <Tabs.List>
            <Tabs.Trigger value="needs-review" icon={<AlertTriangle size={16} />}>Needs Review</Tabs.Trigger>
            <Tabs.Trigger value="mastered" icon={<CheckCircle size={16} />}>Mastered</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="needs-review">
            {sortedErrors.length === 0 ? (
              <Card variant="glass" className={styles.emptyCard}>
                <Card.Body className={styles.emptyState}>
                  <CheckCircle size={48} className={styles.emptyIcon} />
                  <h3>You're all caught up!</h3>
                  <p>No words to review right now. Keep practicing to find new challenges.</p>
                </Card.Body>
              </Card>
            ) : (
              <div className={styles.wordGrid}>
                {sortedErrors.map(([word, data]) => (
                  <Card key={word} variant="default" className={styles.wordCard}>
                    <Card.Body className={styles.wordCardBody}>
                      <div className={styles.wordHeader}>
                        <h3 
                          className={styles.theWord} 
                          onClick={(e) => handleWordClick(word, e)}
                          title="Click to see definition"
                          style={{ cursor: 'pointer' }}
                        >
                          {word}
                        </h3>
                        <Badge variant="danger" size="sm">{data.count} mistakes</Badge>
                      </div>
                      
                      <div className={styles.mistakeHistory}>
                        <span className={styles.mistakeLabel}>You typed:</span>
                        <div className={styles.typedTags}>
                          {Array.from(data.typedWords).slice(0, 3).map(tw => (
                            <span key={tw} className={styles.typedTag}>"{tw}"</span>
                          ))}
                        </div>
                      </div>

                      <div className={styles.wordActions}>
                        <Button variant="primary" size="sm" fullWidth onClick={() => setReviewingWord(word)}>
                          <Repeat size={14} /> Practice
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="mastered">
             <Card variant="glass" className={styles.emptyCard}>
                <Card.Body className={styles.emptyState}>
                  <BookOpen size={48} className={styles.emptyIcon} />
                  <h3>Mastered Words Ledger</h3>
                  <p>In Phase 5, this will show a permanent history of all words you've successfully learned.</p>
                </Card.Body>
              </Card>
          </Tabs.Content>
        </Tabs>
      )}

      {selectedWord && (
        <WordDictionaryPopup
          word={selectedWord}
          position={popupPosition}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
