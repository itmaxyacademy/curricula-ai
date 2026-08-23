import React, { useRef, useState } from 'react';
import { useCourse } from '../../context/CourseContext';
import { useUI } from '../../context/UIContext';
import { trendingTopics } from '../../constants/starterPrompts';
import { TOPIC_CATEGORIES } from '../../constants/domainCategories';
import { IconArrow, IconSpinner } from '../icons/Icons';

export function Step1PromptInput({ onStartSession, isAgentMode, setIsAgentMode }) {
  const {
    promptText,
    setPromptText,
    pendingFile,
    setPendingFile,
    isLoading,
    selectedTopicCategory,
    setSelectedTopicCategory
  } = useCourse();
  const { toast } = useUI();

  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE_MB = 10;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        if (toast) toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller document.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setPendingFile(file);
    }
  };

  const charCount = promptText?.length || 0;
  const wordCount = promptText?.trim() ? promptText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.docx,.txt"
      />

      {/* Content Type Tabs */}
      <div className="content-type-tabs">
        <button className="content-type-tab active">Course</button>
      </div>

      <div className="prompt-card">
        <textarea
          className="prompt-textarea"
          placeholder="Create a course about..."
          value={promptText}
          maxLength={2000}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') onStartSession();
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 8px', fontSize: '0.78rem', color: charCount > 1800 ? 'var(--gold, #d97706)' : 'var(--text-muted, #94a3b8)', fontWeight: 600 }}>
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>{charCount} / 2,000 characters</span>
        </div>
        <div className="prompt-controls">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="file-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Upload 1 Reference Document (DOCX, PDF, TXT up to 10MB)"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Reference File</span>
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }} title="Maximum 1 file up to 10MB">
              (Max 1 file • DOCX/PDF/TXT • Max 10MB)
            </span>
            <select
              className="file-upload-btn"
              value={isAgentMode}
              onChange={(e) => setIsAgentMode(e.target.value)}
              style={{ background: 'var(--surface-2)', color: '#475569' }}
            >
              <option value="agent">Agent Planning (Auto Workflow)</option>
              <option value="outline">Planning Only (Outline Only)</option>
            </select>
          </div>
          <button className="action-btn" onClick={() => onStartSession()} disabled={isLoading} title="Start Generation">
            {isLoading ? <IconSpinner /> : <><span style={{ marginRight: '6px' }}>Start</span><IconArrow /></>}
          </button>
        </div>
      </div>

      {/* File badge */}
      {pendingFile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-20px', marginBottom: '16px', padding: '8px 14px', background: 'var(--blue-light)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600, border: '1.5px solid var(--blue)', boxShadow: '0 2px 8px rgba(59,130,246,0.1)' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pendingFile.name} ({(pendingFile.size / (1024 * 1024)).toFixed(2)} MB)
          </span>
          <button
            type="button"
            onClick={() => {
              setPendingFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            style={{ flexShrink: 0, background: 'var(--blue)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 }}
            title="Remove file"
          >
            ✕
          </button>
        </div>
      )}

      <h2 style={{ marginTop: '40px', marginBottom: '20px', fontSize: '1.25rem', fontWeight: 800 }}>Try these examples</h2>

      <div className="trending-pills" style={{ marginBottom: '20px' }}>
        {TOPIC_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`trending-pill ${selectedTopicCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedTopicCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="suggested-grid">
        {trendingTopics
          .filter((t) => selectedTopicCategory === 'All Categories' || t.category === selectedTopicCategory)
          .map((card, idx) => (
            <div key={idx} className="suggested-card" onClick={() => setPromptText(card.prompt)} style={{ cursor: 'pointer' }}>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
