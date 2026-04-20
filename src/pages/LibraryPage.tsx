import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Library, Plus, Search, FolderOpen, Upload } from 'lucide-react';
import { db } from '../db';
import { CollectionCard } from '../components/CollectionCard';
import { importDictinationFile } from '../utils/contentImporter';
import type { Collection, LessonCategory } from '../types';
import './LibraryPage.css';

export function LibraryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LessonCategory | 'all'>('all');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const collections = useLiveQuery(
    () => db.collections.orderBy('createdAt').reverse().toArray()
  ) || [];

  const lessons = useLiveQuery(() => db.lessons.toArray()) || [];
  const progressRecords = useLiveQuery(() => db.progress.toArray()) || [];

  const getCompletedLessonsCount = (collectionId: string) => {
    const colLessonIds = new Set(lessons.filter(l => l.collectionId === collectionId).map(l => l.id));
    return progressRecords.filter(p => colLessonIds.has(p.lessonId) && p.completedAt).length;
  };

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          collection.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || collection.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: { id: LessonCategory | 'all', label: string }[] = [
    { id: 'all', label: 'All Collections' },
    { id: 'ielts', label: 'IELTS' },
    { id: 'toefl', label: 'TOEFL' },
    { id: 'business', label: 'Business' },
    { id: 'daily', label: 'Daily Life' },
    { id: 'academic', label: 'Academic' },
    { id: 'custom', label: 'Custom' },
  ];

  const handleCreateCollection = async () => {
    const id = crypto.randomUUID();
    const newCollection: Collection = {
      id,
      title: 'New Collection',
      description: 'A new collection of lessons',
      category: 'custom',
      difficulty: 'beginner',
      coverColor: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Default blue gradient
      tags: [],
      lessonCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await db.collections.add(newCollection);
    navigate(`/collection/${id}`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importDictinationFile(file);
      if (result.success) {
        alert(`✅ Imported "${result.collectionTitle}" with ${result.lessonsImported} lessons!`);
      } else {
        alert(`❌ Import failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="library-page page-container">
      <div className="page-header">
        <div className="header-title">
          <Library className="header-icon" size={36} />
          <h1>My Library</h1>
        </div>
        <div className="header-actions-row">
          <input
            ref={fileInputRef}
            type="file"
            accept=".dictination,.zip"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button className="secondary-button" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload size={18} />
            <span>{importing ? 'Importing...' : 'Import'}</span>
          </button>
          <button className="primary-button" onClick={handleCreateCollection}>
            <Plus size={18} />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      <div className="library-controls">
        <div className="search-bar glass-panel">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="category-filters">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filteredCollections.length === 0 ? (
        <div className="empty-state glass-panel">
          <FolderOpen size={48} className="empty-icon" />
          <h3>No collections found</h3>
          <p>
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'Create your first collection to start organizing your lessons.'}
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <button className="primary-button" onClick={handleCreateCollection}>
              <Plus size={18} />
              <span>Create Collection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="collections-grid">
          {filteredCollections.map(collection => (
            <CollectionCard
              key={collection.id}
              id={collection.id}
              title={collection.title}
              description={collection.description}
              difficulty={collection.difficulty}
              category={collection.category}
              coverColor={collection.coverColor}
              lessonCount={collection.lessonCount}
              completedLessons={getCompletedLessonsCount(collection.id)}
              onClick={(id) => navigate(`/collection/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
