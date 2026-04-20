import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Bookmark as BookmarkIcon, Trash2, Folder } from 'lucide-react';
import { db } from '../db';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './BookmarksPage.css';

export function BookmarksPage() {
  const navigate = useNavigate();
  const topics = useLiveQuery(() => db.bookmarkTopics.toArray()) || [];
  const bookmarks = useLiveQuery(() => db.audioBookmarks.orderBy('createdAt').reverse().toArray()) || [];

  const [activeTopicId, setActiveTopicId] = useState<string | 'all'>('all');

  const filteredBookmarks = activeTopicId === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.topicTags.includes(activeTopicId));

  const handleDelete = async (id: string, tags: string[]) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;
    await db.transaction('rw', db.audioBookmarks, db.bookmarkTopics, async () => {
      await db.audioBookmarks.delete(id);
      for (const topicId of tags) {
        const topic = await db.bookmarkTopics.get(topicId);
        if (topic && topic.bookmarkCount > 0) {
          await db.bookmarkTopics.update(topicId, { bookmarkCount: topic.bookmarkCount - 1 });
        }
      }
    });
  };

  const handlePlay = (lessonId: string) => {
    // Navigate to practice page. Ideally we'd pass a segmentIndex to play immediately, but for now just navigate
    navigate(`/practice/${lessonId}`);
  };

  return (
    <div className="bookmarks-page">
      <header className="bp-header">
        <button className="bp-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div className="bp-title">
          <BookmarkIcon size={24} />
          <h1>My Bookmarks</h1>
        </div>
      </header>

      <main className="bp-main">
        <div className="bp-sidebar">
          <h2 className="bp-sidebar-title"><Folder size={18} /> Topics</h2>
          <div className="bp-topics-list">
            <button 
              className={`bp-topic-item ${activeTopicId === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTopicId('all')}
            >
              <div className="bp-topic-color" style={{ backgroundColor: 'var(--text-secondary)' }} />
              <span className="bp-topic-name">All Bookmarks</span>
              <span className="bp-topic-count">{bookmarks.length}</span>
            </button>
            {topics.map(topic => (
              <button 
                key={topic.id}
                className={`bp-topic-item ${activeTopicId === topic.id ? 'active' : ''}`}
                onClick={() => setActiveTopicId(topic.id)}
              >
                <div className="bp-topic-color" style={{ backgroundColor: topic.color }} />
                <span className="bp-topic-name">{topic.name}</span>
                <span className="bp-topic-count">{topic.bookmarkCount}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bp-content">
          {filteredBookmarks.length === 0 ? (
            <div className="bp-empty">
              <BookmarkIcon size={48} className="bp-empty-icon" />
              <h3>No bookmarks yet</h3>
              <p>Save audio segments during practice to build your library.</p>
            </div>
          ) : (
            <div className="bp-grid">
              {filteredBookmarks.map(bookmark => (
                <Card key={bookmark.id} className="bp-card">
                  <Card.Body className="bp-card-body">
                    {bookmark.customName && <h3 className="bp-card-title">{bookmark.customName}</h3>}
                    <p className="bp-card-text">"{bookmark.segmentText}"</p>
                    
                    <div className="bp-card-topics">
                      {bookmark.topicTags.map(tagId => {
                        const topic = topics.find(t => t.id === tagId);
                        if (!topic) return null;
                        return (
                          <span 
                            key={tagId} 
                            className="bp-card-tag"
                            style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
                          >
                            {topic.name}
                          </span>
                        );
                      })}
                    </div>

                    <div className="bp-card-actions">
                      <Button size="sm" variant="secondary" onClick={() => handlePlay(bookmark.lessonId)}>
                        <Play size={14} /> Go to Lesson
                      </Button>
                      <button className="bp-delete-btn" onClick={() => handleDelete(bookmark.id, bookmark.topicTags)} title="Delete Bookmark">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
