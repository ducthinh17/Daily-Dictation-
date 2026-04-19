
import './ScriptEditor.css';

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ScriptEditor({ value, onChange, placeholder = "Paste your script here..." }: ScriptEditorProps) {
  return (
    <div className="script-editor">
      <textarea
        className="script-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
}
