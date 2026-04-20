import { useState } from 'react';
import { X, Plus, Star, Tag } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import './BookmarkModal.css';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  segmentIndex: number;
  segmentText: string;
  startTime?: number;
  endTime?: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

const LABEL_PRESETS = [
  { name: 'Grammar', color: '#3b82f6', icon: '📝' },
  { name: 'Vocabulary', color: '#10b981', icon: '📖' },
  { name: 'Pronunciation', color: '#f59e0b', icon: '🗣️' },
  { name: 'Idiom', color: '#8b5cf6', icon: '💎' },
  { name: 'Listening', color: '#06b6d4', icon: '🎧' },
  { name: 'Difficult', color: '#ef4444', icon: '🔥' },
];

export function BookmarkModal({ isOpen, onClose, lessonId, segmentIndex, segmentText, startTime, endTime }: BookmarkModalProps) {
  const { topics, addBookmark, createTopic } = useBookmarks();
  
  // Auto-populate name from first 50 chars
  const autoName = segmentText.length > 50 ? segmentText.slice(0, 50) + '…' : segmentText;
  const [customName, setCustomName] = useState(autoName);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicColor, setNewTopicColor] = useState(COLORS[4]);

  if (!isOpen) return null;

  const handleToggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    const topicId = await createTopic(newTopicName.trim(), newTopicColor);
    setSelectedTopics(prev => [...prev, topicId]);
    setIsCreatingTopic(false);
    setNewTopicName('');
  };

  const handlePresetClick = async (preset: typeof LABEL_PRESETS[0]) => {
    // Check if topic already exists
    const existing = topics.find(t => t.name.toLowerCase() === preset.name.toLowerCase());
    if (existing) {
      handleToggleTopic(existing.id);
    } else {
      // Create it on-the-fly
      const topicId = await createTopic(preset.name, preset.color);
      setSelectedTopics(prev => [...prev, topicId]);
    }
  };

  const handleSave = async () => {
    await addBookmark({
      lessonId,
      segmentIndex,
      segmentText,
      customName: customName.trim() || undefined,
      topicTags: selectedTopics,
      startTime,
      endTime
    });
    onClose();
  };

  // Separate existing topics from presets not yet created
  const existingTopicIds = new Set(topics.map(t => t.name.toLowerCase()));
  const availablePresets = LABEL_PRESETS.filter(p => !existingTopicIds.has(p.name.toLowerCase()));

  return (
    <div className="bm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bm-modal">
        <div className="bm-header">
          <div className="bm-title-group">
             <Star className="bm-star-icon" size={24} fill="var(--color-warning)" color="var(--color-warning)" />
             <h2>⭐ Star Sentence</h2>
          </div>
          <button className="bm-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="bm-body">
          <div className="bm-preview">
            <span className="bm-label">Sentence</span>
            <p className="bm-preview-text">"{segmentText}"</p>
          </div>

          <div className="bm-field">
            <label className="bm-label">Name</label>
            <input 
              type="text" 
              className="bm-input"
              placeholder="E.g., Great phrase for writing"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
            />
          </div>

          <div className="bm-field">
            <label className="bm-label"><Tag size={14} /> Labels</label>
            
            {/* Quick preset labels */}
            {availablePresets.length > 0 && (
              <div className="bm-presets">
                {availablePresets.map(preset => (
                  <button
                    key={preset.name}
                    className="bm-preset-chip"
                    style={{ borderColor: preset.color, color: preset.color }}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.icon} {preset.name}
                  </button>
                ))}
              </div>
            )}

            {/* Existing topics */}
            <div className="bm-topics">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  className={`bm-topic-chip ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: selectedTopics.includes(topic.id) ? topic.color : 'transparent',
                    borderColor: topic.color,
                    color: selectedTopics.includes(topic.id) ? '#fff' : topic.color
                  }}
                  onClick={() => handleToggleTopic(topic.id)}
                >
                  {topic.name}
                </button>
              ))}
              
              {!isCreatingTopic && (
                <button className="bm-topic-chip add-new" onClick={() => setIsCreatingTopic(true)}>
                  <Plus size={14} /> New Label
                </button>
              )}
            </div>
            
            {isCreatingTopic && (
              <div className="bm-create-topic">
                <input 
                  type="text" 
                  className="bm-input topic-name-input"
                  placeholder="Label name..."
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  autoFocus
                />
                <div className="bm-color-picker">
                  {COLORS.map(color => (
                    <button 
                      key={color}
                      className={`bm-color-btn ${newTopicColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTopicColor(color)}
                    />
                  ))}
                </div>
                <div className="bm-create-actions">
                  <button className="bm-btn small ghost" onClick={() => setIsCreatingTopic(false)}>Cancel</button>
                  <button className="bm-btn small primary" onClick={handleCreateTopic} disabled={!newTopicName.trim()}>Add</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bm-footer">
          <button className="bm-btn ghost" onClick={onClose}>Cancel</button>
          <button className="bm-btn primary" onClick={handleSave}>
            <Star size={16} fill="currentColor" /> Save Star
          </button>
        </div>
      </div>
    </div>
  );
}
