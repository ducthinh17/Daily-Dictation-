import { useCallback, useRef } from 'react';
import { Upload, Music } from 'lucide-react';
import './AudioUploader.css';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFileName?: string;
}

export function AudioUploader({ onFileSelect, selectedFileName }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidAudio = (file: File) => {
    return file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|m4b|aac|ogg)$/i);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidAudio(file)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && isValidAudio(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div 
      className={`audio-uploader ${selectedFileName ? 'has-file' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        accept="audio/*,.mp3,.wav,.m4a,.m4b,.aac,.ogg" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      
      <div className="uploader-content">
        {selectedFileName ? (
          <>
            <div className="file-icon">
              <Music size={32} />
            </div>
            <div className="file-info">
              <p className="file-name">{selectedFileName}</p>
              <p className="upload-hint">Click or drag to change audio file</p>
            </div>
          </>
        ) : (
          <>
            <div className="upload-icon">
              <Upload size={32} />
            </div>
            <p className="upload-text">Drop your audio file here</p>
            <p className="upload-hint">or click to browse (MP3, WAV, M4A)</p>
          </>
        )}
      </div>
    </div>
  );
}
