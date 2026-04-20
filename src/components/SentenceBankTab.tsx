import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookText, Volume2, Trash2, Search } from 'lucide-react';
import { db } from '../db';
import { dictionaryService } from '../utils/dictionaryService';
import { Card } from './ui/Card';
import './SentenceBankTab.css';

export function SentenceBankTab() {
  const [search, setSearch] = useState('');

  const sentences = useLiveQuery(() =>
    db.sentenceBank.orderBy('createdAt').reverse().limit(100).toArray()
  );

  if (!sentences) return <div className="sbt-loading">Loading...</div>;

  const filtered = search
    ? sentences.filter(s =>
        s.word.toLowerCase().includes(search.toLowerCase()) ||
        s.sentence.toLowerCase().includes(search.toLowerCase()))
    : sentences;

  const handleDelete = async (id: string) => {
    await db.sentenceBank.delete(id);
  };

  const handlePlaySentence = (text: string) => {
    dictionaryService.playAudio(undefined, text, 'US');
  };

  if (sentences.length === 0) {
    return (
      <Card variant="glass" className="sbt-empty-card">
        <Card.Body>
          <div className="sbt-empty">
            <BookText size={48} className="sbt-empty-icon" />
            <h3>No sentences saved yet</h3>
            <p>When you make mistakes during practice, the full sentence will be saved here for context-rich review.</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="sbt-container">
      <div className="sbt-search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search sentences or words..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="sbt-stats">
        <span>{filtered.length} sentence{filtered.length !== 1 ? 's' : ''}</span>
        <span className="sbt-stat-dot">•</span>
        <span>{new Set(filtered.map(s => s.word)).size} unique words</span>
      </div>

      <div className="sbt-list">
        {filtered.map(s => (
          <div key={s.id} className="sbt-item">
            <div className="sbt-sentence">
              {highlightWord(s.sentence, s.word)}
            </div>
            <div className="sbt-meta">
              <span className="sbt-word-badge">{s.word}</span>
              <span className="sbt-date">
                {new Date(s.createdAt).toLocaleDateString()}
              </span>
              <div className="sbt-actions">
                <button className="sbt-icon-btn" onClick={() => handlePlaySentence(s.sentence)} title="Listen">
                  <Volume2 size={14} />
                </button>
                <button className="sbt-icon-btn danger" onClick={() => handleDelete(s.id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function highlightWord(sentence: string, word: string): React.ReactElement {
  const regex = new RegExp(`(\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b)`, 'gi');
  const parts = sentence.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="sbt-highlight">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}
