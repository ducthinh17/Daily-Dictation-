import { useState, useEffect, useRef } from 'react';
import { Volume2, X, ExternalLink, Loader2 } from 'lucide-react';
import { dictionaryService, type DictionaryEntry } from '../utils/dictionaryService';
import './WordDictionaryPopup.css';

export interface Position {
  top: number;
  left: number;
  bottom: number;
}

interface WordDictionaryPopupProps {
  word: string;
  position: Position | null;
  onClose: () => void;
}

export function WordDictionaryPopup({ word, position, onClose }: WordDictionaryPopupProps) {
  const [data, setData] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!word) return;

    let isMounted = true;
    setLoading(true);
    setError(false);
    
    dictionaryService.fetchWord(word).then(res => {
      if (!isMounted) return;
      if (res) {
        setData(res);
        if (res.meanings.length > 0) {
          setActiveTab(res.meanings[0].partOfSpeech);
        }
      } else {
        setError(true);
      }
    }).catch(() => {
      if (isMounted) setError(true);
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [word]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Slight delay to prevent immediate close on trigger click
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Escape to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!word || !position) return null;

  // Calculate position logic to avoid overflowing viewport
  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
  };

  // Basic positioning: place below the word. If too low, place above.
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  if (position.bottom + 350 > viewportHeight && position.top > 350) {
    // Place above
    popupStyle.bottom = viewportHeight - position.top + 10;
  } else {
    // Place below
    popupStyle.top = position.bottom + 10;
  }

  // Horizontal positioning: center to the word, but bound within screen
  const popupWidth = 320;
  let leftPos = position.left - (popupWidth / 2) + 20; // roughly center
  if (leftPos < 10) leftPos = 10;
  if (leftPos + popupWidth > viewportWidth - 10) leftPos = viewportWidth - popupWidth - 10;
  
  popupStyle.left = leftPos;

  // Render helpers
  const playAudio = (audioUrl?: string, accent?: 'US' | 'UK' | 'unknown') => {
    dictionaryService.playAudio(audioUrl, word, accent === 'UK' ? 'UK' : 'US');
  };

  const usPhonetic = data?.phonetics.find(p => p.accent === 'US' && p.text);
  const ukPhonetic = data?.phonetics.find(p => p.accent === 'UK' && p.text);
  const fallbackPhonetic = data?.phonetics.find(p => p.text && p.accent !== 'US' && p.accent !== 'UK');

  const activeMeaning = data?.meanings.find(m => m.partOfSpeech === activeTab);

  return (
    <div className="word-dict-popup" style={popupStyle} ref={popupRef}>
      <button className="dict-close-btn" onClick={onClose}><X size={16} /></button>
      
      <div className="dict-header">
        <h3 className="dict-word">{word.toLowerCase()}</h3>
        
        {loading && <div className="dict-loading"><Loader2 size={16} className="spin" /> Fetching...</div>}
        
        {!loading && !error && (
          <div className="dict-phonetics">
            {usPhonetic && (
              <div className="dict-phonetic-item">
                <span className="accent-tag us">US</span>
                <span className="ipa">{usPhonetic.text}</span>
                <button className="audio-btn" onClick={() => playAudio(usPhonetic.audio, 'US')}>
                  <Volume2 size={14} />
                </button>
              </div>
            )}
            
            {ukPhonetic && (
              <div className="dict-phonetic-item">
                <span className="accent-tag uk">UK</span>
                <span className="ipa">{ukPhonetic.text}</span>
                <button className="audio-btn" onClick={() => playAudio(ukPhonetic.audio, 'UK')}>
                  <Volume2 size={14} />
                </button>
              </div>
            )}

            {!usPhonetic && !ukPhonetic && fallbackPhonetic && (
               <div className="dict-phonetic-item">
                <span className="ipa">{fallbackPhonetic.text}</span>
                <button className="audio-btn" onClick={() => playAudio(fallbackPhonetic.audio)}>
                  <Volume2 size={14} />
                </button>
              </div>
            )}
            
            {data?.phonetics.length === 0 && (
               <div className="dict-phonetic-item">
                  <button className="audio-btn" onClick={() => playAudio(undefined, 'US')}>
                    <Volume2 size={14} /> Listen
                  </button>
               </div>
            )}
          </div>
        )}
      </div>

      <div className="dict-body scrollbar">
        {error ? (
          <div className="dict-error-state">
            <p>Definition not found for "{word}".</p>
            <button className="audio-btn fallback-play" onClick={() => dictionaryService.playTTS(word, 'US')}>
              <Volume2 size={16} /> Play Pronunciation
            </button>
          </div>
        ) : loading ? (
           <div className="dict-skeleton">
             <div className="skel-line w-full"></div>
             <div className="skel-line w-3/4"></div>
             <div className="skel-line w-1/2"></div>
           </div>
        ) : data && (
          <>
            {data.meanings.length > 1 && (
              <div className="dict-tabs">
                {data.meanings.map(m => (
                  <button 
                    key={m.partOfSpeech}
                    className={`dict-tab ${activeTab === m.partOfSpeech ? 'active' : ''}`}
                    onClick={() => setActiveTab(m.partOfSpeech)}
                  >
                    {m.partOfSpeech}
                  </button>
                ))}
              </div>
            )}

            {activeMeaning && (
              <div className="dict-definitions">
                {activeMeaning.definitions.slice(0, 3).map((def, idx) => (
                  <div key={idx} className="dict-def-item">
                    <span className="def-number">{idx + 1}.</span>
                    <div className="def-content">
                      <p className="def-text">{def.definition}</p>
                      {def.example && (
                        <p className="def-example">"{def.example}"</p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Synonyms */}
                {activeMeaning.definitions.some(d => d.synonyms && d.synonyms.length > 0) && (
                  <div className="dict-synonyms">
                    <span className="syn-label">Synonyms:</span>
                    <div className="syn-tags">
                      {Array.from(new Set(activeMeaning.definitions.flatMap(d => d.synonyms))).slice(0, 5).map(syn => (
                        <span key={syn} className="syn-tag">{syn}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {data?.sourceUrls && data.sourceUrls.length > 0 && (
         <div className="dict-footer">
            <a href={data.sourceUrls[0]} target="_blank" rel="noreferrer" className="source-link">
              Wiktionary <ExternalLink size={10} />
            </a>
         </div>
      )}
    </div>
  );
}
