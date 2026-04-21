import { CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { useState } from 'react';
import type { CheckResult } from '../types';
import { WordDictionaryPopup, type Position } from './WordDictionaryPopup';
import { TranslationPanel } from './TranslationPanel';
import './FeedbackDisplay.css';

interface FeedbackDisplayProps {
  result: CheckResult | null;
  expectedText: string;
  input: string;
}

export function FeedbackDisplay({ result, expectedText, input }: FeedbackDisplayProps) {
  const [accent, setAccent] = useState<'US' | 'UK'>('US');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<Position | null>(null);

  if (!result) return null;

  const originalExpectedWords = expectedText.trim().split(/\s+/).filter(w => w.length > 0);
  const inputWords = input.trim().split(/\s+/).filter(w => w.length > 0);

  const playAudio = (text: string) => {
    // Clean text: keep spaces and basic punctuation for full sentences
    const cleanText = text.replace(/[^a-zA-Z0-9-'\s.,?!]/g, '').trim();
    if (!cleanText) return;

    // Try Youdao's free, high-quality dictionary voice API (1 = UK, 2 = US)
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=${accent === 'US' ? 2 : 1}`;
    const audio = new Audio(audioUrl);
    
    audio.play().catch((err) => {
      console.warn("Dictionary audio failed, falling back to SpeechSynthesis", err);
      
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = accent === 'US' ? 'en-US' : 'en-GB';
      
      const voices = window.speechSynthesis.getVoices();
      // Look for high quality human-like voices
      const premiumVoices = voices.filter(v => 
        v.lang.startsWith(accent === 'US' ? 'en-US' : 'en-GB') && 
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Online'))
      );
      
      utterance.voice = premiumVoices[0] || 
                        voices.find(v => v.lang === utterance.lang && v.localService) || 
                        voices.find(v => v.lang.startsWith(accent === 'US' ? 'en-US' : 'en-GB')) || 
                        null;
                        
      window.speechSynthesis.speak(utterance);
    });
  };

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
      bottom: rect.bottom
    });
    const cleanWord = word.replace(/[^a-zA-Z0-9-']/g, '');
    setSelectedWord(cleanWord);
  };

  if (result.correct) {
    return (
      <div className="feedback-display success glass-panel">
        <CheckCircle2 size={24} className="feedback-icon" />
        <div className="feedback-content">
          <h4 className="feedback-title">Correct!</h4>
          <p className="feedback-text">Great job, moving to next segment...</p>
        </div>
      </div>
    );
  }

  const errors = [];
  if (result.wrongCount > 0) errors.push(`${result.wrongCount} wrong word${result.wrongCount > 1 ? 's' : ''}`);
  if (result.missingCount > 0) errors.push(`Missing ${result.missingCount} word${result.missingCount > 1 ? 's' : ''}`);
  if (result.extraCount > 0) errors.push(`Extra ${result.extraCount} word${result.extraCount > 1 ? 's' : ''}`);

  // Calculate correctly typed prefix for translation
  let correctPrefixWords: string[] = [];
  for (let i = 0; i < originalExpectedWords.length; i++) {
    const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (inputWords[i] && normalize(inputWords[i]) === normalize(originalExpectedWords[i])) {
      correctPrefixWords.push(originalExpectedWords[i]);
    } else {
      break; // Stop at first mistake
    }
  }
  const sentencePrefix = correctPrefixWords.join(' ');

  return (
    <div className="feedback-display error glass-panel">
      <div className="feedback-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', width: '100%' }}>
        <XCircle size={24} className="feedback-icon" />
        <div className="feedback-content" style={{ flex: 1 }}>
          <h4 className="feedback-title">Not quite right</h4>
          <p className="feedback-text">{errors.join(', ')}</p>
        </div>
        
        <div className="voice-selector" style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => playAudio(expectedText)}
            title="Play full sentence"
            style={{
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Volume2 size={16} />
          </button>
          <div style={{ width: '1px', background: 'var(--border-color)', margin: '4px 2px' }} />
          <button 
            onClick={() => setAccent('US')}
            style={{ 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-sm)', 
              border: 'none',
              background: accent === 'US' ? 'var(--primary-color)' : 'transparent',
              color: accent === 'US' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            US
          </button>
          <button 
            onClick={() => setAccent('UK')}
            style={{ 
              padding: '4px 12px', 
              borderRadius: 'var(--radius-sm)', 
              border: 'none',
              background: accent === 'UK' ? 'var(--primary-color)' : 'transparent',
              color: accent === 'UK' ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            UK
          </button>
        </div>
      </div>

      <div className="feedback-diff">
        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {originalExpectedWords.map((expectedWord, idx) => {
            const inputWord = inputWords[idx];
            
            const normalize = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
            const isCorrect = inputWord && normalize(inputWord) === normalize(expectedWord);
            
            if (isCorrect) {
              return (
                <span 
                  key={idx} 
                  className="diff-word diff-correct"
                  onClick={(e) => handleWordClick(expectedWord, e)}
                  title="Click to see definition"
                  style={{ 
                    cursor: 'pointer', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {expectedWord}
                </span>
              );
            }
            
            return (
              <span key={idx} style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                {inputWord && (
                  <span 
                    className="diff-word diff-wrong"
                    onClick={(e) => handleWordClick(expectedWord, e)}
                    title="Click to see expected word definition"
                    style={{ cursor: 'pointer' }}
                  >
                    {inputWord}
                  </span>
                )}
                <span 
                  className="diff-word" 
                  onClick={(e) => handleWordClick(expectedWord, e)}
                  style={{ color: '#9ca3af', letterSpacing: '4px', fontWeight: 'bold', cursor: 'pointer' }} 
                  title={`Missing word: ${expectedWord}`}
                >
                  {expectedWord.replace(/[^a-zA-Z0-9]/g, '').split('').map(() => '_').join('')}
                </span>
              </span>
            );
          })}
          
          {/* Render any extra words typed by the user */}
          {inputWords.length > originalExpectedWords.length && (
            <span className="diff-word diff-wrong">
              {inputWords.slice(originalExpectedWords.length).join(' ')}
            </span>
          )}
        </p>
      </div>

      <TranslationPanel sentencePrefix={sentencePrefix} />

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
