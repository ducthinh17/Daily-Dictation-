import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle, Key, Loader2, Save, Stethoscope } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { getGroqApiKey, setGroqApiKey, testGroqApiKey, getDefaultLanguage, setDefaultLanguage } from '../utils/settingsStore';
import type { SupportedLanguage } from '../types';
import '../components/Settings.css'; // Reuse existing CSS for inputs and options
import './SettingsPage.css';

export function SettingsPage() {
  const [apiKey, setApiKeyLocal] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [testError, setTestError] = useState('');
  const [language, setLanguageLocal] = useState<SupportedLanguage>('en');
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getGroqApiKey().then(setApiKeyLocal);
    getDefaultLanguage().then(setLanguageLocal);
    setTestStatus('idle');
    setTestError('');
  }, []);

  const handleSave = async () => {
    await setGroqApiKey(apiKey);
    await setDefaultLanguage(language);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
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

  return (
    <div className="settings-page page-container">
      <header className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">Manage your API keys, preferences, and account settings.</p>
        </div>
      </header>

      <div className="settings-content">
        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <h3><Key size={20} /> AI Model Configuration</h3>
            <p className="settings-hint">Dictination uses the Groq API to provide ultra-fast transcriptions and feedback.</p>
          </div>
          
          <div className="settings-body no-padding">
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
                    onChange={e => { setApiKeyLocal(e.target.value); setTestStatus('idle'); setIsSaved(false); }}
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
                  className="test-btn"
                >
                  {testStatus === 'testing' ? 'Testing...' : 'Test Key'}
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

            <div className="settings-divider"></div>

            {/* Default Language */}
            <div className="settings-section">
              <div className="settings-label-group">
                <label className="settings-label">Target Language</label>
                <p className="settings-hint">Choose the default language for generating lessons and providing feedback.</p>
              </div>
              <div className="language-options">
                <button
                  className={`lang-option ${language === 'en' ? 'active' : ''}`}
                  onClick={() => { setLanguageLocal('en'); setIsSaved(false); }}
                >
                  🇬🇧 English
                </button>
                <button
                  className={`lang-option ${language === 'zh' ? 'active' : ''}`}
                  onClick={() => { setLanguageLocal('zh'); setIsSaved(false); }}
                >
                  🇨🇳 Chinese
                </button>
                <button
                  className={`lang-option ${language === 'ja' ? 'active' : ''}`}
                  onClick={() => { setLanguageLocal('ja'); setIsSaved(false); }}
                >
                  🇯🇵 Japanese
                </button>
              </div>
            </div>
            
            <div className="settings-card-footer">
              <Button onClick={handleSave} className="save-btn" size="lg">
                <Save size={18} />
                {isSaved ? 'Saved Successfully' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </div>

        <div className="settings-card glass-panel">
          <div className="settings-card-header">
            <h3><Stethoscope size={20} /> Listening Diagnostic</h3>
            <p className="settings-hint">Assess your English listening level with a 10-question progressive test using browser TTS.</p>
          </div>
          <div className="settings-body no-padding">
            <div className="settings-section">
              <Button onClick={() => navigate('/diagnostic')} variant="secondary" size="lg" className="save-btn">
                <Stethoscope size={18} />
                Take Listening Test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
