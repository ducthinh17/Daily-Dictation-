import { useState, useEffect } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { translationService } from '../utils/translationService';
import './TranslationPanel.css';

interface TranslationPanelProps {
  sentencePrefix: string;
  defaultTargetLang?: 'vi' | 'en';
}

export function TranslationPanel({ sentencePrefix, defaultTargetLang = 'vi' }: TranslationPanelProps) {
  const [targetLang, setTargetLang] = useState<'vi' | 'en'>(defaultTargetLang);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!sentencePrefix.trim()) {
      setTranslatedText('');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      // Assuming source is English if target is Vietnamese, and vice-versa.
      // This could be made dynamic if we pass the source language from the lesson.
      const sourceLang = targetLang === 'vi' ? 'en' : 'vi'; 
      
      const result = await translationService.translate(sentencePrefix, sourceLang, targetLang);
      
      if (result) {
        setTranslatedText(result);
      } else {
        setTranslatedText('Translation unavailable.');
      }
      setLoading(false);
    }, 500); // 500ms debounce to avoid spamming API while typing/revealing

    return () => clearTimeout(timer);
  }, [sentencePrefix, targetLang]);

  if (!sentencePrefix.trim()) return null;

  return (
    <div className="translation-panel glass-panel">
      <div className="translation-header">
        <div className="translation-title">
          <Languages size={14} className="translation-icon" />
          Translation
        </div>
        <div className="lang-toggle">
          <button 
            className={`lang-btn ${targetLang === 'vi' ? 'active' : ''}`}
            onClick={() => setTargetLang('vi')}
          >
            VI
          </button>
          <button 
            className={`lang-btn ${targetLang === 'en' ? 'active' : ''}`}
            onClick={() => setTargetLang('en')}
          >
            EN
          </button>
        </div>
      </div>
      
      <div className="translation-content">
        {loading && !translatedText ? (
          <div className="translation-loading">
            <Loader2 size={16} className="spin" /> Translating...
          </div>
        ) : (
          <div className={`translation-text ${targetLang}`}>
            {translatedText}
          </div>
        )}
      </div>
    </div>
  );
}
