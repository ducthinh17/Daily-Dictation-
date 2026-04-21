import { useRef, useEffect } from 'react';
import './TypingArea.css';

interface TypingAreaProps {
  value: string;
  expectedText?: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onHintWord?: () => void;
  onHintLetter?: () => void;
  disabled?: boolean;
}

export function TypingArea({ value, onChange, onSubmit, onHintWord, onHintLetter, disabled = false }: TypingAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus logic
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Tab') {
      e.preventDefault(); // Prevent moving focus away from textarea
      if (onHintLetter) onHintLetter();
    } else if (e.key === '`' || e.key === '~') {
      e.preventDefault(); // Prevent typing the character
      if (onHintWord) onHintWord();
    }
  };

  return (
    <div className="typing-area standard-typing">
      <textarea
        ref={textareaRef}
        className="typing-textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type what you hear..."
        spellCheck="false"
      />
    </div>
  );
}
