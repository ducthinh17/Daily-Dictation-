import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { LessonCard } from '../components/LessonCard';
import { db } from '../db';
import { useLesson } from '../hooks/useLesson';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { deleteLesson } = useLesson();

  const lessons = useLiveQuery(() => 
    db.lessons.orderBy('createdAt').reverse().toArray()
  );

  const progressList = useLiveQuery(() => 
    db.progress.toArray()
  );

  const segmentsList = useLiveQuery(() => 
    db.segments.toArray()
  );

  const [_deletingId, setDeletingId] = useState<string | null>(null);

  const handlePractice = (id: string) => {
    navigate(`/practice/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      handleConfirmDelete(id);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteLesson(id);
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      alert("Failed to delete lesson");
    } finally {
      setDeletingId(null);
    }
  };

  if (lessons === undefined || progressList === undefined || segmentsList === undefined) {
    return (
      <div className="home-page loading">
        <div className="spinner"></div>
        <p>Loading your lessons...</p>
      </div>
    );
  }

  const hasLessons = lessons.length > 0;

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="brand">
          <div className="brand-logo-container">
            <img src="/logo.png" alt="Dictination Master Logo" className="brand-logo" />
          </div>
          <div className="brand-text">
            <h1>Dictination Master</h1>
            <p className="tagline">Listen. Type. Master.</p>
          </div>
        </div>
        
        {hasLessons && (
          <Button onClick={() => navigate('/create')}>
            <Plus size={18} />
            <span>New Lesson</span>
          </Button>
        )}
      </header>

      {!hasLessons ? (
        <div className="empty-state glass-panel">
          <div className="empty-icon-wrapper">
            <img src="/logo.png" alt="Dictination Master" className="empty-state-logo" />
          </div>
          <h2>Welcome to Dictination Master</h2>
          <p>Create your first dictation lesson by uploading an audio file and pasting its script.</p>
          <Button size="lg" onClick={() => navigate('/create')}>
            <Plus size={20} />
            <span>Create First Lesson</span>
          </Button>
        </div>
      ) : (
        <div className="lessons-grid">
          {lessons.map(lesson => {
            const progress = progressList.find(p => p.lessonId === lesson.id);
            const totalSegments = segmentsList.filter(s => s.lessonId === lesson.id).length;
            const completedSegments = progress?.completedSegments.length || 0;
            
            return (
              <LessonCard
                key={lesson.id}
                id={lesson.id}
                title={lesson.title}
                totalSegments={totalSegments}
                completedSegments={completedSegments}
                createdAt={lesson.createdAt}
                onPractice={handlePractice}
                onDelete={handleDeleteClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
