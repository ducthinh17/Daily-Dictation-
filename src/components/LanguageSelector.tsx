
import type { SupportedLanguage } from '../types';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="language-selector">
      <button
        className={`lang-pill ${value === 'en' ? 'active' : ''}`}
        onClick={() => onChange('en')}
        type="button"
      >
        🇬🇧 English
      </button>
      <button
        className={`lang-pill ${value === 'zh' ? 'active' : ''}`}
        onClick={() => onChange('zh')}
        type="button"
      >
        🇨🇳 Chinese
      </button>
      <button
        className={`lang-pill ${value === 'ja' ? 'active' : ''}`}
        onClick={() => onChange('ja')}
        type="button"
      >
        🇯🇵 Japanese
      </button>
    </div>
  );
}
