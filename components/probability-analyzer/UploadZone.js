'use client';

import { useState, useRef, useCallback } from 'react';

const ACCEPTED_FILES = '.csv,.xlsx,.xls';
const ACCEPTED_IMAGES = '.png,.jpg,.jpeg,.webp';
const ACCEPTED_ALL = ACCEPTED_FILES + ',' + ACCEPTED_IMAGES;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp'];
const FILE_EXTS = ['csv', 'xlsx', 'xls'];

export default function UploadZone({ onFileLoaded, onImagesLoaded, disabled }) {
  const [mode, setMode] = useState('file'); // 'file' | 'screenshot'
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]); // { file, preview, dataUrl }
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    setError('');
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum size is 10 MB.');
      return;
    }

    if (IMAGE_EXTS.includes(ext)) {
      // Switch to screenshot mode and add image
      setMode('screenshot');
      const dataUrl = await fileToDataUrl(file);
      setImages((prev) => [...prev, { file, preview: dataUrl, dataUrl }]);
      return;
    }

    if (FILE_EXTS.includes(ext)) {
      try {
        const content = ext === 'csv'
          ? await file.text()
          : new Uint8Array(await file.arrayBuffer());
        onFileLoaded({ content, fileName: file.name });
      } catch (err) {
        setError('Failed to read file: ' + err.message);
      }
      return;
    }

    setError('Unsupported file type. Upload CSV, Excel, or a screenshot (PNG/JPG).');
  }, [onFileLoaded]);

  const handleMultipleFiles = useCallback(async (fileList) => {
    for (const file of fileList) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (IMAGE_EXTS.includes(ext)) {
        if (file.size > MAX_SIZE) continue;
        const dataUrl = await fileToDataUrl(file);
        setImages((prev) => [...prev, { file, preview: dataUrl, dataUrl }]);
        setMode('screenshot');
      } else {
        // Non-image file — handle as CSV/Excel
        await handleFile(file);
        return; // only process one data file
      }
    }
  }, [handleFile]);

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const analyzeScreenshots = () => {
    if (images.length === 0) return;
    onImagesLoaded(images.map((img) => img.dataUrl));
  };

  const resetToFile = () => {
    setMode('file');
    setImages([]);
    setError('');
  };

  /* ── Screenshot mode ─────────────────────────────────────── */
  if (mode === 'screenshot') {
    return (
      <div className="mx-auto w-full max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white">Screenshots ({images.length})</div>
          <button onClick={resetToFile} className="text-xs text-white/40 hover:text-white/70">
            Switch to CSV/Excel
          </button>
        </div>

        {/* Image previews */}
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <img src={img.preview} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white/70 opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add more button */}
          {images.length < 5 && (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[9/16] flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
            >
              <span className="text-2xl">+</span>
              <span className="mt-1 text-[10px]">Add more</span>
            </button>
          )}
        </div>

        <p className="text-xs text-white/30 text-center">
          Upload up to 5 screenshots. Scroll through your MT5 history and capture each page.
        </p>

        {/* Analyze button */}
        <button
          onClick={analyzeScreenshots}
          disabled={disabled || images.length === 0}
          className="w-full rounded-xl py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
        >
          Analyze {images.length} Screenshot{images.length !== 1 ? 's' : ''} with AI
        </button>

        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGES}
          multiple
          onChange={(e) => { handleMultipleFiles(Array.from(e.target.files || [])); e.target.value = ''; }}
          className="hidden"
        />
      </div>
    );
  }

  /* ── File upload mode (default) ──────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-xl">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleMultipleFiles(Array.from(e.dataTransfer?.files || [])); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        disabled={disabled}
        className={`
          group relative flex w-full flex-col items-center justify-center
          rounded-2xl border-2 border-dashed p-12 transition-all duration-200
          ${dragOver ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'}
          ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
      >
        <div className="mb-4 text-4xl">📊</div>
        <p className="text-base font-medium text-white">
          {dragOver ? 'Drop your file here' : 'Upload Trading Statement'}
        </p>
        <p className="mt-2 text-sm text-white/40">
          Drag &amp; drop or click to browse
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-white/25">
          CSV · Excel · Screenshots
        </p>
        <input ref={inputRef} type="file" accept={ACCEPTED_ALL} multiple
          onChange={(e) => { handleMultipleFiles(Array.from(e.target.files || [])); e.target.value = ''; }}
          className="hidden" aria-label="Upload trading statement" />
      </button>

      {/* Mobile hint */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={() => { setMode('screenshot'); inputRef.current?.click(); }}
          className="text-xs text-white/35 hover:text-white/60 transition-colors"
        >
          📱 On mobile? Upload MT5 screenshots instead
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
