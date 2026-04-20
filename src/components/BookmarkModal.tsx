import { useState } from 'react';
import { X, Plus, Star } from 'lucide-react';
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

export function BookmarkModal({ isOpen, onClose, lessonId, segmentIndex, segmentText, startTime, endTime }: BookmarkModalProps) {
  const { topics, addBookmark, createTopic } = useBookmarks();
  
  const [customName, setCustomName] = useState('');
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

  const handleSave = async () => {
    // If no topic selected, we could force one or just leave it empty.
    // We'll allow empty topic list for now, or maybe auto-select 'Custom'
    
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

  return (
    <div className="bm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bm-modal">
        <div className="bm-header">
          <div className="bm-title-group">
             <Star className="bm-star-icon" size={24} fill="var(--color-warning)" color="var(--color-warning)" />
             <h2>Save Bookmark</h2>
          </div>
          <button className="bm-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="bm-body">
          <div className="bm-preview">
            <span className="bm-label">Preview</span>
            <p className="bm-preview-text">"{segmentText}"</p>
          </div>

          <div className="bm-field">
            <label className="bm-label">Name (Optional)</label>
            <input 
              type="text" 
              className="bm-input"
              placeholder="E.g., Great phrase for writing"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
            />
          </div>

          <div className="bm-field">
            <label className="bm-label">Select Topics</label>
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
                  <Plus size={14} /> New Topic
                </button>
              )}
            </div>
            
            {isCreatingTopic && (
              <div className="bm-create-topic">
                <input 
                  type="text" 
                  className="bm-input topic-name-input"
                  placeholder="Topic name..."
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
          <button className="bm-btn primary" onClick={handleSave}>Save Bookmark</button>
        </div>
      </div>
    </div>
  );
}
