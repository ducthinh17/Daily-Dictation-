import { useState, useEffect } from 'react';
import { Lightbulb, X, ChevronRight, ChevronLeft } from 'lucide-react';
import type { GrammarTip } from '../utils/grammarTips';
import './GrammarTipPopup.css';

interface Props {
  tip: GrammarTip;
  onClose: () => void;
}

export function GrammarTipPopup({ tip, onClose }: Props) {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setExampleIdx(0);
  }, [tip.id]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation(); // Prevent other listeners from firing since we are handling it
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  const ex = tip.examples[exampleIdx];

  return (
    <div className={`gt-overlay ${visible ? 'gt-visible' : ''}`} onClick={handleClose}>
      <div className="gt-popup" onClick={e => e.stopPropagation()}>
        <button className="gt-close" onClick={handleClose}><X size={18} /></button>

        <div className="gt-header">
          <div className="gt-icon-wrap">
            <Lightbulb size={20} />
          </div>
          <div>
            <span className="gt-badge">{tip.category}</span>
            <h3 className="gt-title">{tip.title}</h3>
          </div>
        </div>

        <p className="gt-explanation">{tip.explanation}</p>

        {ex && (
          <div className="gt-example-card">
            <div className="gt-ex-nav">
              <span className="gt-ex-label">Example {exampleIdx + 1}/{tip.examples.length}</span>
              {tip.examples.length > 1 && (
                <div className="gt-ex-arrows">
                  <button
                    disabled={exampleIdx === 0}
                    onClick={() => setExampleIdx(i => i - 1)}
                  ><ChevronLeft size={16} /></button>
                  <button
                    disabled={exampleIdx >= tip.examples.length - 1}
                    onClick={() => setExampleIdx(i => i + 1)}
                  ><ChevronRight size={16} /></button>
                </div>
              )}
            </div>

            <div className="gt-ex-row gt-wrong">
              <span className="gt-ex-marker">✗</span>
              <span>{ex.wrong}</span>
            </div>
            <div className="gt-ex-row gt-correct">
              <span className="gt-ex-marker">✓</span>
              <span>{ex.correct}</span>
            </div>
            <div className="gt-ex-why">{ex.why}</div>
          </div>
        )}

        <button className="gt-got-it" onClick={handleClose}>
          Got it! 👍
        </button>
      </div>
    </div>
  );
}
