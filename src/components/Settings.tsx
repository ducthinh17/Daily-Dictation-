import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle, AlertCircle, Key, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { getGroqApiKey, setGroqApiKey, testGroqApiKey, getDefaultLanguage, setDefaultLanguage } from '../utils/settingsStore';
import type { SupportedLanguage } from '../types';
import './Settings.css';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [apiKey, setApiKeyLocal] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [testError, setTestError] = useState('');
  const [language, setLanguageLocal] = useState<SupportedLanguage>('en');

  useEffect(() => {
    if (isOpen) {
      getGroqApiKey().then(setApiKeyLocal);
      getDefaultLanguage().then(setLanguageLocal);
      setTestStatus('idle');
      setTestError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]);

  const handleSave = async () => {
    await setGroqApiKey(apiKey);
    await setDefaultLanguage(language);
    onClose();
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestError('Please enter an API key');
      setTestStatus('invalid');
      return;
    }
    setTestStatus('testing');
    setTestError('');
    const result = await testGroqApiKey(apiKey);
    if (result.valid) {
      setTestStatus('valid');
    } else {
      setTestStatus('invalid');
      setTestError(result.error || 'Invalid key');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal glass-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3><Key size={20} /> Settings</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* Groq API Key */}
          <div className="settings-section">
            <label className="settings-label">
              Groq API Key
              <span className="label-badge free">FREE</span>
            </label>
            <p className="settings-hint">
              Get your free key at{' '}
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">
                console.groq.com
              </a>
              {' '}— no credit card needed
            </p>
            <div className="api-key-row">
              <div className="api-key-input-wrapper">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="text-input api-key-input"
                  value={apiKey}
                  onChange={e => { setApiKeyLocal(e.target.value); setTestStatus('idle'); }}
                  placeholder="gsk_xxxxxxxxxxxxxxxx"
                  spellCheck={false}
                />
                <button
                  className="toggle-visibility"
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestKey}
                disabled={testStatus === 'testing'}
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test'}
              </Button>
            </div>

            {testStatus === 'testing' && (
              <div className="test-result testing">
                <Loader2 size={16} className="spinner" /> Verifying API key...
              </div>
            )}
            {testStatus === 'valid' && (
              <div className="test-result success">
                <CheckCircle size={16} /> Key is valid and ready to use!
              </div>
            )}
            {testStatus === 'invalid' && (
              <div className="test-result error">
                <AlertCircle size={16} /> {testError}
              </div>
            )}
          </div>

          {/* Default Language */}
          <div className="settings-section">
            <label className="settings-label">Default Language</label>
            <div className="language-options">
              <button
                className={`lang-option ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguageLocal('en')}
              >
                🇬🇧 English
              </button>
              <button
                className={`lang-option ${language === 'zh' ? 'active' : ''}`}
                onClick={() => setLanguageLocal('zh')}
              >
                🇨🇳 Chinese
              </button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
