import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Star, Trash2, Folder, Search, Volume2, RotateCcw } from 'lucide-react';
import { db } from '../db';
import { useSegmentAudio } from '../hooks/useSegmentAudio';
import './BookmarksPage.css';

interface BookmarksPageProps {
  embedded?: boolean;
}

export function BookmarksPage({ embedded = false }: BookmarksPageProps) {
  const navigate = useNavigate();
  const topics = useLiveQuery(() => db.bookmarkTopics.toArray()) || [];
  const bookmarks = useLiveQuery(() => db.audioBookmarks.orderBy('createdAt').reverse().toArray()) || [];

  const [activeTopicId, setActiveTopicId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'most-reviewed' | 'label'>('newest');

  const { play, stop, isPlaying, activeId } = useSegmentAudio();

  // Filter
  let filtered = activeTopicId === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.topicTags.includes(activeTopicId));

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(b => 
      b.segmentText.toLowerCase().includes(q) || 
      (b.customName && b.customName.toLowerCase().includes(q))
    );
  }

  // Sort
  if (sortBy === 'most-reviewed') {
    filtered = [...filtered].sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (sortBy === 'label') {
    filtered = [...filtered].sort((a, b) => a.topicTags.join(',').localeCompare(b.topicTags.join(',')));
  }
  // 'newest' is default order from DB

  const handleDelete = async (id: string, tags: string[]) => {
    if (!confirm('Remove this starred sentence?')) return;
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

  const handlePlay = async (bookmark: typeof bookmarks[0]) => {
    // Increment review count
    await db.audioBookmarks.update(bookmark.id, { 
      reviewCount: bookmark.reviewCount + 1,
      lastReviewedAt: Date.now()
    });
    play(bookmark.id, bookmark.lessonId, bookmark.startTime, bookmark.endTime);
  };

  return (
    <div className={`bookmarks-page ${!embedded ? 'page-container' : ''}`}>
      {!embedded && (
        <header className="bp-header">
          <div className="header-title">
            <Star size={36} className="header-icon" fill="var(--color-warning)" color="var(--color-warning)" />
            <h1>Starred Sentences</h1>
          </div>
          <span className="bp-count">{bookmarks.length} starred</span>
        </header>
      )}

      <main className="bp-main">
        <div className="bp-sidebar">
          <h2 className="bp-sidebar-title"><Folder size={18} /> Labels</h2>
          <div className="bp-topics-list">
            <button 
              className={`bp-topic-item ${activeTopicId === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTopicId('all')}
            >
              <div className="bp-topic-color" style={{ backgroundColor: 'var(--text-secondary)' }} />
              <span className="bp-topic-name">All</span>
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
          {/* Search + Sort bar */}
          <div className="bp-toolbar">
            <div className="bp-search">
              <Search size={18} className="bp-search-icon" />
              <input 
                type="text"
                placeholder="Search sentences..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="bp-sort" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="newest">Newest</option>
              <option value="most-reviewed">Most Reviewed</option>
              <option value="label">By Label</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="bp-empty">
              <Star size={48} className="bp-empty-icon" />
              <h3>{searchQuery ? 'No results found' : 'No starred sentences yet'}</h3>
              <p>{searchQuery ? 'Try a different search term.' : 'Star sentences during practice to build your review library.'}</p>
            </div>
          ) : (
            <div className="bp-list">
              {filtered.map(bookmark => {
                const isActive = activeId === bookmark.id && isPlaying;
                return (
                  <div key={bookmark.id} className={`bp-sentence-card ${isActive ? 'playing' : ''}`}>
                    <button 
                      className={`bp-play-btn ${isActive ? 'active' : ''}`}
                      onClick={() => isActive ? stop() : handlePlay(bookmark)}
                      title={isActive ? 'Stop' : 'Play this segment'}
                    >
                      {isActive ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    <div className="bp-sentence-body">
                      {bookmark.customName && <h4 className="bp-sentence-name">{bookmark.customName}</h4>}
                      <p className="bp-sentence-text">"{bookmark.segmentText}"</p>
                      
                      <div className="bp-sentence-meta">
                        <div className="bp-sentence-tags">
                          {bookmark.topicTags.map(tagId => {
                            const topic = topics.find(t => t.id === tagId);
                            if (!topic) return null;
                            return (
                              <span 
                                key={tagId} 
                                className="bp-tag"
                                style={{ backgroundColor: `${topic.color}18`, color: topic.color, borderColor: `${topic.color}40` }}
                              >
                                {topic.name}
                              </span>
                            );
                          })}
                        </div>
                        <div className="bp-sentence-stats">
                          <span className="bp-review-count" title={`Reviewed ${bookmark.reviewCount} times`}>
                            <RotateCcw size={12} /> {bookmark.reviewCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bp-sentence-actions">
                      <button className="bp-action-btn" onClick={() => navigate(`/practice/${bookmark.lessonId}`)} title="Go to Lesson">
                        <Volume2 size={16} />
                      </button>
                      <button className="bp-action-btn danger" onClick={() => handleDelete(bookmark.id, bookmark.topicTags)} title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
