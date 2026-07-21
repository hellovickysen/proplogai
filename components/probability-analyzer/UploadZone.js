'use client';

import { useState, useRef, useCallback } from 'react';

const ACCEPTED = '.csv,.xlsx,.xls';
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export default function UploadZone({ onFileLoaded, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      setError('');
      if (!file) return;

      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        setError('Unsupported file type. Please upload a CSV or Excel file.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('File too large. Maximum size is 50MB.');
        return;
      }

      try {
        let content;
        if (ext === 'csv') {
          content = await file.text();
        } else {
          const buf = await file.arrayBuffer();
          content = new Uint8Array(buf);
        }
        onFileLoaded({ content, fileName: file.name });
      } catch (err) {
        setError('Failed to read file: ' + err.message);
      }
    },
    [onFileLoaded],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onClick = () => inputRef.current?.click();

  const onChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <button
        type="button"
        onClick={onClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        disabled={disabled}
        className={`
          group relative flex w-full flex-col items-center justify-center
          rounded-2xl border-2 border-dashed p-10 transition-all duration-300
          ${dragOver
            ? 'border-cyan-400/60 bg-cyan-400/5'
            : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
          }
          ${disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
      >
        {/* Icon */}
        <div
          className={`
            mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
            border border-white/10 bg-white/5 text-3xl
            transition-transform duration-300 group-hover:scale-110
            ${dragOver ? 'scale-110' : ''}
          `}
        >
          📊
        </div>

        <p className="text-base font-medium text-white">
          {dragOver ? 'Drop your statement here' : 'Upload Trading Statement'}
        </p>
        <p className="mt-2 text-sm text-white/45">
          Drag & drop or click to browse
        </p>
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-white/30">
          MT5 · MT4 · cTrader · DXTrade · CSV · Excel
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onChange}
          className="hidden"
          aria-label="Upload trading statement"
        />
      </button>

      {error && (
        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
