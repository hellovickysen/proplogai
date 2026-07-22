'use client';

import { useState, useRef, useCallback } from 'react';

const ACCEPTED = '.csv,.xlsx,.xls';
const MAX_SIZE = 50 * 1024 * 1024;

export default function UploadZone({ onFileLoaded, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    setError('');
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Unsupported file type. Please upload a CSV or Excel file.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File too large. Maximum size is 50 MB.');
      return;
    }
    try {
      const content = ext === 'csv'
        ? await file.text()
        : new Uint8Array(await file.arrayBuffer());
      onFileLoaded({ content, fileName: file.name });
    } catch (err) {
      setError('Failed to read file: ' + err.message);
    }
  }, [onFileLoaded]);

  return (
    <div className="mx-auto w-full max-w-xl">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer?.files?.[0]); }}
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
          {dragOver ? 'Drop your statement here' : 'Upload Trading Statement'}
        </p>
        <p className="mt-2 text-sm text-white/40">
          Drag &amp; drop or click to browse
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-white/25">
          MT4 · MT5 · CSV · Excel
        </p>
        <input ref={inputRef} type="file" accept={ACCEPTED}
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
          className="hidden" aria-label="Upload trading statement" />
      </button>

      {error && (
        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
