import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Edit3, Trash2, Plus, Play, MoreVertical, BookOpen, Calendar, Download } from 'lucide-react';
import { db } from '../db';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useLesson } from '../hooks/useLesson';
import type { LessonCategory, DifficultyLevel } from '../types';
import { exportCollection, downloadBlob } from '../utils/contentExporter';
import './CollectionDetailPage.css';

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<LessonCategory>('custom');
  const [editDifficulty, setEditDifficulty] = useState<DifficultyLevel>('beginner');
  const [exporting, setExporting] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{id: string, title: string} | null>(null);
  const { updateLesson, deleteLesson } = useLesson();

  const collection = useLiveQuery(() => db.collections.get(id || ''));
  const lessons = useLiveQuery(() => db.lessons.where('collectionId').equals(id || '').toArray()) || [];
  
  const progressRecords = useLiveQuery(() => 
    lessons.length > 0 ? db.progress.where('lessonId').anyOf(lessons.map(l => l.id)).toArray() : []
  , [lessons]) || [];
  
  const segments = useLiveQuery(() => 
    lessons.length > 0 ? db.segments.where('lessonId').anyOf(lessons.map(l => l.id)).toArray() : []
  , [lessons]) || [];
  
  const completedLessonsCount = progressRecords.filter(p => p.completedAt).length;
  const collectionProgress = lessons.length > 0 ? (completedLessonsCount / lessons.length) * 100 : 0;

  const getLessonProgress = (lessonId: string) => {
    const p = progressRecords.find(pr => pr.lessonId === lessonId);
    if (!p) return 0;
    if (p.completedAt) return 100;
    
    const lessonSegments = segments.filter(s => s.lessonId === lessonId);
    if (lessonSegments.length === 0) return 0;
    
    return Math.min(100, (p.completedSegments.length / lessonSegments.length) * 100);
  };

  if (!collection) {
    return (
      <div className="page-container loading-state">
        <p>Loading collection...</p>
      </div>
    );
  }

  const handleEdit = () => {
    setEditTitle(collection.title);
    setEditDesc(collection.description);
    setEditCategory(collection.category);
    setEditDifficulty(collection.difficulty);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!id || !editTitle.trim()) return;
    
    await db.collections.update(id, {
      title: editTitle,
      description: editDesc,
      category: editCategory,
      difficulty: editDifficulty,
      updatedAt: Date.now()
    });
    
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm('Are you sure you want to delete this collection and all its lessons? This cannot be undone.');
    if (!confirmDelete) return;

    // Delete collection and all its lessons
    await db.transaction('rw', db.collections, db.lessons, db.segments, db.progress, async () => {
      const lessonIds = lessons.map(l => l.id);
      
      await db.collections.delete(id);
      await db.lessons.bulkDelete(lessonIds);
      
      for (const lessonId of lessonIds) {
        await db.segments.where('lessonId').equals(lessonId).delete();
        await db.progress.delete(lessonId);
      }
    });

    navigate('/library');
  };

  const handleDeleteLesson = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      await deleteLesson(lessonId);
    }
  };

  const handleEditLesson = (lesson: {id: string, title: string}, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setEditingLesson(lesson);
  };

  const handleSaveLessonInfo = async () => {
    if (editingLesson && editingLesson.title.trim()) {
      await updateLesson(editingLesson.id, { title: editingLesson.title });
      setEditingLesson(null);
    }
  };

  const handleCreateLesson = () => {
    // Pass collection ID to create page
    navigate(`/create?collectionId=${id}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="collection-detail-page page-container">
      <header className="page-header detail-header">
        <button className="back-btn" onClick={() => navigate('/library')}>
          <ArrowLeft size={20} />
          <span>Library</span>
        </button>
        <div className="header-actions">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </>
          ) : (
            <>
              <button className="icon-btn" onClick={async () => {
                if (!id) return;
                setExporting(true);
                try {
                  const blob = await exportCollection(id);
                  const safeName = collection.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                  downloadBlob(blob, `${safeName}.dictination`);
                } catch (err: any) {
                  alert(`Export failed: ${err.message}`);
                } finally {
                  setExporting(false);
                }
              }} title="Export Collection" disabled={exporting}>
                <Download size={18} />
              </button>
              <button className="icon-btn" onClick={handleEdit} title="Edit Collection">
                <Edit3 size={18} />
              </button>
              <button className="icon-btn danger" onClick={handleDelete} title="Delete Collection">
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <div 
        className="collection-banner"
        style={{ background: collection.coverColor }}
      >
        <div className="banner-content">
          <div className="collection-badges">
            <span className="badge category-badge">{collection.category}</span>
            <span className="badge difficulty-badge">{collection.difficulty}</span>
          </div>
          
          {isEditing ? (
            <div className="edit-form glass-panel">
              <div className="form-row" style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <select 
                  className="glass-input"
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value as LessonCategory)}
                  style={{ flex: 1 }}
                >
                  <option value="ielts">IELTS</option>
                  <option value="toefl">TOEFL</option>
                  <option value="business">Business</option>
                  <option value="daily">Daily</option>
                  <option value="academic">Academic</option>
                  <option value="custom">Custom</option>
                </select>
                <select 
                  className="glass-input"
                  value={editDifficulty}
                  onChange={e => setEditDifficulty(e.target.value as DifficultyLevel)}
                  style={{ flex: 1 }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <input 
                type="text" 
                className="edit-title-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Collection Title"
                autoFocus
              />
              <textarea 
                className="edit-desc-input"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Collection Description"
                rows={3}
              />
            </div>
          ) : (
            <div className="collection-info">
              <h1 className="collection-title">{collection.title}</h1>
              <p className="collection-desc">{collection.description || 'No description provided.'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="collection-stats-bar glass-panel">
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <BookOpen size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{lessons.length}</span>
            <span className="stat-label">Lessons</span>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-item">
          <div className="stat-icon-wrapper">
            <Calendar size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatDate(collection.createdAt)}</span>
            <span className="stat-label">Created</span>
          </div>
        </div>
        
        <div className="stat-divider"></div>
        
        <div className="stat-item progress-item">
          <div className="progress-header">
            <div className="stat-info">
              <span className="stat-label">Completion Progress</span>
              <span className="stat-value small">{Math.round(collectionProgress)}%</span>
            </div>
          </div>
          <ProgressBar progress={collectionProgress} showPercentage={false} height={8} />
        </div>
      </div>

      <div className="lessons-section">
        <div className="section-header">
          <div className="section-title-group">
            <h2>Collection Content</h2>
            <span className="lesson-count-pill">{lessons.length} lessons</span>
          </div>
          <Button variant="primary" onClick={handleCreateLesson}>
            <Plus size={18} />
            <span>Add New Lesson</span>
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="empty-state glass-panel premium-empty-state">
            <div className="empty-icon-glow">
              <BookOpen size={48} className="empty-icon" />
            </div>
            <h3>Your collection is ready</h3>
            <p>Start your learning journey by adding your first lesson.</p>
            <div className="empty-actions">
              <Button variant="primary" onClick={handleCreateLesson}>
                <Plus size={20} />
                <span>Create First Lesson</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="lessons-list">
            {lessons.map((lesson, index) => {
              const lessonProgress = getLessonProgress(lesson.id);
              return (
              <div 
                key={lesson.id} 
                className="lesson-list-item glass-panel"
                onClick={() => navigate(`/practice/${lesson.id}`)}
              >
                <div className="lesson-number">{index + 1}</div>
                <div className="lesson-info">
                  <h3 className="lesson-title">{lesson.title}</h3>
                  <div className="lesson-meta">
                    <span className="meta-tag">{lesson.language.toUpperCase()}</span>
                    <span className="meta-tag">{lesson.mode === 'audio-script' ? 'Audio + Script' : 'Audio Only'}</span>
                    <span className="meta-date">{formatDate(lesson.createdAt)}</span>
                  </div>
                  {lessonProgress > 0 && (
                    <div className="lesson-progress-inline">
                      <ProgressBar progress={lessonProgress} showPercentage={false} height={4} />
                    </div>
                  )}
                </div>
                <div className="lesson-actions" style={{ position: 'relative' }}>
                  <button className="icon-btn lesson-play-btn" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/practice/${lesson.id}`);
                  }}>
                    <Play size={18} fill="currentColor" />
                  </button>
                  <button className="icon-btn" onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === lesson.id ? null : lesson.id);
                  }}>
                    <MoreVertical size={18} />
                  </button>
                  
                  {activeMenuId === lesson.id && (
                    <div className="dropdown-menu glass-panel">
                      <button 
                        className="dropdown-item" 
                        onClick={(e) => handleEditLesson({ id: lesson.id, title: lesson.title }, e)}
                      >
                        <Edit3 size={16} /> Edit Info
                      </button>
                      <button 
                        className="dropdown-item danger" 
                        onClick={(e) => handleDeleteLesson(lesson.id, e)}
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!editingLesson} 
        onClose={() => setEditingLesson(null)}
        title="Edit Lesson Info"
      >
        <div className="edit-collection-form">
          <div className="form-group">
            <label>Lesson Title</label>
            <input 
              type="text" 
              value={editingLesson?.title || ''} 
              onChange={e => setEditingLesson(prev => prev ? {...prev, title: e.target.value} : null)}
              placeholder="E.g., IELTS Task 1 Listening"
              className="glass-input"
            />
          </div>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setEditingLesson(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveLessonInfo} disabled={!editingLesson?.title.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
