import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Mic, FileText, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AudioUploader } from '../components/AudioUploader';
import { ScriptEditor } from '../components/ScriptEditor';
import { SegmentPreview } from '../components/SegmentPreview';
import { LanguageSelector } from '../components/LanguageSelector';
import { TranscribeButton } from '../components/TranscribeButton';
import { Settings } from '../components/Settings';
import { splitScript, splitTranscript } from '../utils/segmentSplitter';
import type { SegmentWithTime } from '../utils/segmentSplitter';
import { transcribeAudio } from '../utils/transcriber';
import type { TranscribeStatus, TranscriptResult } from '../utils/transcriber';
import { useLesson } from '../hooks/useLesson';
import { db } from '../db';
import type { SupportedLanguage } from '../types';
import './CreateLessonPage.css';

type TabMode = 'audio-only' | 'audio-script';

export default function CreateLessonPage() {
  const navigate = useNavigate();
  const { createLesson } = useLesson();

  const settings = useLiveQuery(() => db.settings.get('global'));

  // Tab state
  const [activeTab, setActiveTab] = useState<TabMode>('audio-only');

  // Shared state
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Audio-Only tab state
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  
  useEffect(() => {
    if (settings?.defaultLanguage) {
      setLanguage(settings.defaultLanguage);
    }
  }, [settings?.defaultLanguage]);

  const [transcribeStatus, setTranscribeStatus] = useState<TranscribeStatus | null>(null);
  const [transcriptResult, setTranscriptResult] = useState<TranscriptResult | null>(null);
  const [editedScript, setEditedScript] = useState('');
  const [timedSegments, setTimedSegments] = useState<SegmentWithTime[]>([]);

  // Audio+Script tab state
  const [manualScript, setManualScript] = useState('');
  const [plainSegments, setPlainSegments] = useState<string[]>([]);
  
  // Collections state
  const searchParams = new URLSearchParams(window.location.search);
  const initialCollectionId = searchParams.get('collectionId') || '';
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(initialCollectionId);

  const [newCollectionName, setNewCollectionName] = useState('');

  const collections = useLiveQuery(() => db.collections.orderBy('createdAt').reverse().toArray()) || [];

  const hasGroqApiKey = !!settings?.groqApiKey?.trim();

  // --- Audio-Only handlers ---
  const handleTranscribe = async () => {
    if (!audioFile) return;

    const apiKey = settings?.groqApiKey;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    try {
      // transcribeAudio now transparently handles large files (auto-split + merge)
      const result = await transcribeAudio({
        audioFile,
        language,
        apiKey,
        onProgress: setTranscribeStatus,
      });

      setTranscriptResult(result);
      setEditedScript(result.text);

      // Build timed segments from Whisper output
      const segments = splitTranscript(result.segments);
      setTimedSegments(segments);
    } catch (err: any) {
      setTranscribeStatus({ phase: 'error', message: err.message || 'Transcription failed' });
    }
  };

  const handleRefreshSegments = () => {
    if (transcriptResult) {
      // Re-split using original Whisper segments (timestamps preserved)
      const segments = splitTranscript(transcriptResult.segments);
      setTimedSegments(segments);
    }
  };

  // --- Audio+Script handlers ---
  const handlePreviewSegments = () => {
    if (!manualScript.trim()) return;
    const splitResult = splitScript(manualScript);
    setPlainSegments(splitResult);
  };

  // --- Save & Start Practice ---
  const handleSaveAndStart = async () => {
    if (!title.trim() || !audioFile) {
      alert('Please provide title and audio.');
      return;
    }

    const isAudioOnly = activeTab === 'audio-only';
    const scriptText = isAudioOnly ? editedScript : manualScript;

    if (!scriptText.trim()) {
      alert(isAudioOnly
        ? 'Please transcribe the audio first.'
        : 'Please provide a script.');
      return;
    }

    if (selectedCollectionId === 'create-new' && !newCollectionName.trim()) {
      alert('Please provide a name for the new collection.');
      return;
    }

    try {
      setIsSaving(true);
      
      let collectionId = selectedCollectionId || 'default-collection';
      
      if (collectionId === 'create-new') {
        collectionId = crypto.randomUUID();
        await db.collections.add({
          id: collectionId,
          title: newCollectionName.trim(),
          description: 'A newly created collection',
          category: 'custom',
          difficulty: 'intermediate',
          coverColor: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          tags: [],
          lessonCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      const lessonId = await createLesson(title, audioFile, scriptText, language, activeTab, collectionId);

      // Build segment objects
      let segmentObjects;

      if (isAudioOnly && timedSegments.length > 0) {
        // Use timed segments with timestamps
        segmentObjects = timedSegments.map((seg, index) => ({
          id: crypto.randomUUID(),
          lessonId,
          index,
          text: seg.text,
          startTime: seg.startTime,
          endTime: seg.endTime,
        }));
      } else {
        // Use plain text segments (no timestamps)
        let finalSegments = isAudioOnly ? [] : plainSegments;
        if (finalSegments.length === 0) {
          finalSegments = splitScript(scriptText);
        }
        segmentObjects = finalSegments.map((text, index) => ({
          id: crypto.randomUUID(),
          lessonId,
          index,
          text,
        }));
      }

      if (segmentObjects.length === 0) {
        alert("Script couldn't be divided into segments.");
        return;
      }

      await db.segments.bulkAdd(segmentObjects);

      // Initialize progress
      await db.progress.add({
        lessonId,
        currentSegmentIndex: 0,
        completedSegments: [],
        attempts: {},
        mistakes: {},
        draftInput: '',
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
      });

      navigate(`/practice/${lessonId}`);
    } catch (error) {
      console.error('Failed to save lesson:', error);
      alert('Failed to save lesson. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = title.trim() && audioFile && (
    activeTab === 'audio-only'
      ? editedScript.trim() && timedSegments.length > 0
      : manualScript.trim()
  );

  return (
    <div className="create-lesson-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2>Create Lesson</h2>
        <button
          className="settings-header-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      {/* Tab Switcher */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === 'audio-only' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio-only')}
        >
          <Mic size={16} />
          Audio Only
        </button>
        <button
          className={`tab-btn ${activeTab === 'audio-script' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio-script')}
        >
          <FileText size={16} />
          Audio + Script
        </button>
      </div>

      <div className="form-container">
        {/* Title (shared) */}
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            className="text-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. IELTS Section 3 — Work Experience"
          />
        </div>

        <div className="form-group">
          <label>Collection</label>
          <div className="collection-select-group">
            <select 
              className="text-input" 
              value={selectedCollectionId}
              onChange={e => setSelectedCollectionId(e.target.value)}
            >
              <option value="">Select a collection or use Uncategorized</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
              <option value="create-new">+ Create New Collection</option>
            </select>
          </div>
          
          {selectedCollectionId === 'create-new' && (
            <div className="new-collection-input" style={{ marginTop: '10px' }}>
              <input
                type="text"
                className="text-input"
                placeholder="New Collection Name"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Audio (shared) */}
        <div className="form-group">
          <label>Audio</label>
          <AudioUploader
            onFileSelect={setAudioFile}
            selectedFileName={audioFile?.name}
          />
        </div>

        {/* === Audio Only Tab === */}
        {activeTab === 'audio-only' && (
          <>
            <div className="form-group">
              <label>Language</label>
              <LanguageSelector value={language} onChange={setLanguage} />
            </div>

            <div className="form-group">
              {!hasGroqApiKey && (
                <div className="api-key-notice">
                  <p>
                    You need a <strong>free Groq API key</strong> to use auto transcription.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => setShowSettings(true)}>
                    Set API Key
                  </Button>
                </div>
              )}
              <TranscribeButton
                status={transcribeStatus}
                onClick={handleTranscribe}
                disabled={!audioFile || !hasGroqApiKey}
              />
            </div>

            {/* Editable transcript */}
            {editedScript && (
              <div className="form-group">
                <label>Generated Transcript <span className="label-hint">(editable)</span></label>
                <ScriptEditor
                  value={editedScript}
                  onChange={setEditedScript}
                />
                <div className="actions-row">
                  <Button variant="secondary" size="sm" onClick={handleRefreshSegments}>
                    Refresh Segments
                  </Button>
                </div>
              </div>
            )}

            {/* Timed segment preview */}
            {timedSegments.length > 0 && (
              <SegmentPreview segments={[]} timedSegments={timedSegments} />
            )}
          </>
        )}

        {/* === Audio + Script Tab === */}
        {activeTab === 'audio-script' && (
          <>
            <div className="form-group">
              <label>Script</label>
              <ScriptEditor
                value={manualScript}
                onChange={setManualScript}
              />
            </div>

            <div className="actions-row">
              <Button variant="secondary" onClick={handlePreviewSegments} disabled={!manualScript.trim()}>
                Preview Segments
              </Button>
            </div>

            {plainSegments.length > 0 && (
              <SegmentPreview segments={plainSegments} />
            )}
          </>
        )}

        {/* Save button */}
        <div className="submit-row">
          <Button
            size="lg"
            fullWidth
            onClick={handleSaveAndStart}
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save & Start Practice'}
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
