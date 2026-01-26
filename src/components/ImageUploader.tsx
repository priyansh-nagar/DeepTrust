import { useState, useCallback } from 'react';
import { Upload, Link, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageUploaderProps {
  onImageSelected: (imageData: { url?: string; base64?: string; preview: string }) => void;
  isAnalyzing: boolean;
}

export function ImageUploader({ onImageSelected, isAnalyzing }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageSelected({ base64, preview: base64 });
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onImageSelected({ url: urlInput.trim(), preview: urlInput.trim() });
    }
  }, [urlInput, onImageSelected]);

  return (
    <div className="w-full space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-secondary rounded-lg">
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            mode === 'upload' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span className="font-medium">Upload</span>
        </button>
        <button
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            mode === 'url' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link className="w-4 h-4" />
          <span className="font-medium">URL</span>
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
            dragActive 
              ? 'border-primary bg-primary/10 glow-cyan' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          } ${isAnalyzing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isAnalyzing}
          />
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`p-4 rounded-full bg-muted ${dragActive ? 'animate-pulse-glow' : ''}`}>
              <ImageIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                {dragActive ? 'Drop your image here' : 'Drag & drop an image'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse • PNG, JPG, WEBP supported
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Paste image URL here..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              disabled={isAnalyzing}
              className="flex-1 bg-muted border-border focus:border-primary"
            />
            <Button 
              onClick={handleUrlSubmit} 
              disabled={!urlInput.trim() || isAnalyzing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Analyze
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a direct link to an image (must be publicly accessible)
          </p>
        </div>
      )}
    </div>
  );
}
