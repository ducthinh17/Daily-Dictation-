import { useRef, useEffect } from 'react';
import './TypingArea.css';

interface TypingAreaProps {
  value: string;
  expectedText?: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function TypingArea({ value, onChange, onSubmit, disabled = false }: TypingAreaProps) {
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
