import { useState } from 'react';
import { Star } from 'lucide-react';
import { BookmarkModal } from './BookmarkModal';
import { useBookmarks } from '../hooks/useBookmarks';
import './BookmarkButton.css';

interface BookmarkButtonProps {
  lessonId: string;
  segmentIndex: number;
  segmentText: string;
  startTime?: number;
  endTime?: number;
}

export function BookmarkButton({ lessonId, segmentIndex, segmentText, startTime, endTime }: BookmarkButtonProps) {
  const { isBookmarked, getBookmarkBySegment, removeBookmark } = useBookmarks(lessonId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const bookmarked = isBookmarked(segmentIndex);
  const bookmarkData = getBookmarkBySegment(segmentIndex);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarked && bookmarkData) {
      removeBookmark(bookmarkData.id);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button 
        className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
        onClick={handleClick}
        title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
      >
        <Star 
          size={20} 
          className="bookmark-icon"
          fill={bookmarked ? "var(--color-warning)" : "none"} 
          color={bookmarked ? "var(--color-warning)" : "var(--text-secondary)"} 
        />
      </button>

      {isModalOpen && (
        <BookmarkModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lessonId={lessonId}
          segmentIndex={segmentIndex}
          segmentText={segmentText}
          startTime={startTime}
          endTime={endTime}
        />
      )}
    </>
  );
}
