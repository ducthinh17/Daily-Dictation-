import { useState, useEffect } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { translationService } from '../utils/translationService';
import type { SupportedLanguage } from '../types';
import './TranslationPanel.css';

interface TranslationPanelProps {
  sentencePrefix: string;
  sourceLang?: SupportedLanguage;
  defaultTargetLang?: 'vi' | 'en';
}

export function TranslationPanel({ sentencePrefix, sourceLang = 'en', defaultTargetLang = 'vi' }: TranslationPanelProps) {
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
      // Use provided sourceLang, fallback to inferring if not set correctly
      const fetchSource = sourceLang !== (targetLang as string) ? sourceLang : (targetLang === 'vi' ? 'en' : 'vi'); 
      
      const result = await translationService.translate(sentencePrefix, fetchSource, targetLang);
      
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
