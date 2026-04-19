
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight, RotateCcw } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import './CompletionModal.css';

interface CompletionModalProps {
  isOpen: boolean;
  totalSegments: number;
  totalMistakes: number;
  onRestart: () => void;
}

export function CompletionModal({ isOpen, totalSegments, totalMistakes, onRestart }: CompletionModalProps) {
  const navigate = useNavigate();
  
  const accuracy = Math.max(0, Math.round(((totalSegments - totalMistakes) / totalSegments) * 100));
  
  return (
    <Modal isOpen={isOpen} title="Lesson Completed!">
      <div className="completion-content">
        <div className="award-icon-wrapper">
          <Award size={64} className="award-icon" />
        </div>
        
        <h3 className="completion-greeting">Great Job!</h3>
        <p className="completion-desc">You've successfully completed all {totalSegments} segments of this lesson.</p>
        
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{totalSegments}</span>
            <span className="stat-label">Segments</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalMistakes}</span>
            <span className="stat-label">Total Mistakes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Est. Accuracy</span>
          </div>
        </div>
        
        <div className="completion-actions">
          <Button variant="secondary" onClick={onRestart} fullWidth>
            <RotateCcw size={18} />
            <span>Practice Again</span>
          </Button>
          <Button onClick={() => navigate('/')} fullWidth>
            <span>Back to Home</span>
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
