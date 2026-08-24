import React from 'react';
import { IconLayers, IconSpinner, IconArrow } from '../icons/Icons';
import { ContentRenderer } from '../common/ContentRenderer';

export function Step2ContextConfig({
  promptText,
  techTags,
  allSuggestedTags,
  toggleTag,
  newTag,
  setNewTag,
  handleAddCustomTag,
  configLessons,
  setConfigLessons,
  configDuration,
  setConfigDuration,
  activeFileName,
  handleRemoveAttachedFile,
  insertMarkdown,
  showHeadingDropdown,
  setShowHeadingDropdown,
  applyHeading,
  showTablePicker,
  setShowTablePicker,
  hoverGrid,
  setHoverGrid,
  insertTable,
  isPreviewMode,
  setIsPreviewMode,
  showCatalog,
  setShowCatalog,
  handleFileUploadClick,
  subjectContext,
  setSubjectContext,
  contextTextareaRef,
  setCurrentStep,
  handleJumpToReview,
  canJumpToReview = false,
  handleGenerateProposals,
  isLoading
}) {
  return (
    <div>
      <div className="header">
        <div>
          <h2>Configure your Course</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Provide specific details or guidelines for this course.</p>
        </div>
        <span className="step-chip">Step 2 of 8</span>
      </div>

      {/* Concept Card */}
      <div className="prompt-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '8px' }}>Course Concept</h3>
        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          "{promptText || 'No concept prompt entered yet.'}"
        </p>
      </div>

      {/* Technical Tags & Topics Card */}
      <div className="tech-tags-card" style={{ marginBottom: '24px' }}>
        <div className="tech-tags-header">
          <div className="tech-tags-title-group">
            <div className="tech-tags-icon-circle">
              <IconLayers />
            </div>
            <div>
              <h3 className="tech-tags-title">Key Topics &amp; Skill Tags</h3>
              <p className="tech-tags-subtitle">Select key skills, concepts, and tools for this course. Showing up to {Math.min(allSuggestedTags.length, 20)} relevant suggestions.</p>
            </div>
          </div>
          <div className="tech-tags-count-badge">
            {techTags.length} SELECTED
          </div>
        </div>

        <div className="tech-tags-pills-grid">
          {(() => {
            const displayTags = Array.from(new Set([
              ...techTags,
              ...allSuggestedTags.filter(t => !techTags.includes(t)).slice(0, 20)
            ]));
            return displayTags.map((tag, idx) => {
              const isSelected = techTags.includes(tag);
              return (
                <button
                  key={idx}
                  type="button"
                  className={`tech-tag-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            });
          })()}
        </div>

        <div className="tech-tags-input-container">
          <span className="input-plus-icon">+</span>
          <input
            type="text"
            className="tech-tags-custom-input"
            placeholder="Add custom skill or concept tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddCustomTag}
          />
          {newTag.trim() && (
            <button 
              type="button" 
              className="tech-tags-add-btn" 
              onClick={handleAddCustomTag}
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Course Configuration Card */}
      <div className="prompt-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Course Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Target Number of Lessons</span>
            <div className="stepper" style={{ margin: 0 }}>
              <button onClick={() => setConfigLessons(Math.max(1, configLessons - 1))}>−</button>
              <span style={{ minWidth: '24px', textAlign: 'center' }}>{configLessons}</span>
              <button onClick={() => setConfigLessons(configLessons + 1)}>+</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-1)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            {(() => {
              let numVal = 60;
              if (typeof configDuration === 'number' && !isNaN(configDuration)) {
                numVal = configDuration > 240 ? 60 : configDuration;
              } else if (typeof configDuration === 'string') {
                if (configDuration.includes('week') || configDuration.includes('day') || configDuration.includes('month')) {
                  numVal = 60;
                } else {
                  const parsed = parseInt(configDuration, 10);
                  numVal = !isNaN(parsed) && parsed > 0 ? (parsed > 240 ? 60 : parsed) : 60;
                }
              }
              const isWeekScope = typeof configDuration === 'string' && (configDuration.includes('week') || configDuration.includes('day'));

              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Avg. Duration per Lesson (Min)</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {isWeekScope ? `${configDuration} (${numVal} min/lesson)` : `${numVal} min`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {[5, 10, 15, 30, 60, 90, 120].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setConfigDuration(p)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: `1px solid ${numVal === p ? 'var(--gold)' : 'var(--border-color)'}`,
                          background: numVal === p ? 'var(--gold)' : 'transparent',
                          color: numVal === p ? '#fff' : 'var(--navy)',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={numVal}
                      onChange={(e) => setConfigDuration(Math.max(1, Math.min(480, Number(e.target.value) || 60)))}
                      style={{ minHeight: 'auto', padding: '6px 8px', maxWidth: '70px', marginBottom: 0, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>min</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Subject Matter Context Card */}
      <div className="prompt-card">
        <h3 style={{ marginBottom: '14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Subject Matter Context</h3>

        {/* Attached Reference File Badge */}
        {activeFileName && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--blue-light)', borderRadius: '10px', border: '1.5px solid var(--blue)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.4rem' }}>📄</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.92rem' }}>{activeFileName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600 }}>Attached Reference Document</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveAttachedFile}
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 2px 6px rgba(239,68,68,0.35)' }}
              title="Remove Attached File"
            >
              ✕
            </button>
          </div>
        )}

        {/* Rich Editor Toolbar */}
        <div className="rich-editor-container">
          <div className="rich-editor-toolbar">
            {/* 1. Text Styling */}
            <div className="toolbar-group">
              <button type="button" className="editor-tb-btn" title="bold" onClick={() => insertMarkdown('**', '**')}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
              </button>
              <button type="button" className="editor-tb-btn" title="italic" onClick={() => insertMarkdown('*', '*')}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
              </button>
              <button type="button" className="editor-tb-btn" title="strikeThrough" onClick={() => insertMarkdown('~~', '~~')}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M16 4H9a3 3 0 00-3 3c0 2 2 3 4 3.5m0 0C14 11 17 12 17 15a3.5 3.5 0 01-3.5 3.5H7"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
              </button>
            </div>

            <div className="toolbar-divider" />

            {/* 2. Headings & Titles */}
            <div className="toolbar-group" style={{ position: 'relative' }}>
              <button 
                type="button" 
                className={`editor-tb-btn ${showHeadingDropdown ? 'active' : ''}`} 
                title="title" 
                onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 6v12M12 6v12M4 12h8M20 6v12M16 12h4"/></svg>
                <span className="dropdown-caret">▾</span>
              </button>
              {showHeadingDropdown && (
                <div className="editor-dropdown-menu">
                  <div className="dropdown-item" onClick={() => applyHeading(1)}>Lv1 Heading (#)</div>
                  <div className="dropdown-item" onClick={() => applyHeading(2)}>Lv2 Heading (##)</div>
                  <div className="dropdown-item" onClick={() => applyHeading(3)}>Lv3 Heading (###)</div>
                  <div className="dropdown-item" onClick={() => applyHeading(4)}>Lv4 Heading (####)</div>
                  <div className="dropdown-item" onClick={() => applyHeading(5)}>Lv5 Heading (#####)</div>
                  <div className="dropdown-item" onClick={() => applyHeading(6)}>Lv6 Heading (######)</div>
                </div>
              )}
            </div>

            <div className="toolbar-divider" />

            {/* 3. Advanced Text Formatting */}
            <div className="toolbar-group">
              <button type="button" className="editor-tb-btn" title="subscript" onClick={() => insertMarkdown('~', '~')}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>X<sub>2</sub></span>
              </button>
              <button type="button" className="editor-tb-btn" title="superscript" onClick={() => insertMarkdown('^', '^')}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>X<sup>2</sup></span>
              </button>
              <button type="button" className="editor-tb-btn" title="quote" onClick={() => insertMarkdown('\n> ', '')}>
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
              </button>
            </div>

            <div className="toolbar-divider" />

            {/* 4. Lists & Links */}
            <div className="toolbar-group">
              <button type="button" className="editor-tb-btn" title="unordered list" onClick={() => insertMarkdown('\n- ', '')}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button type="button" className="editor-tb-btn" title="ordered list" onClick={() => insertMarkdown('\n1. ', '')}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
              </button>
              <button type="button" className="editor-tb-btn" title="link" onClick={() => insertMarkdown('[', '](https://example.com)')}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              </button>
            </div>

            <div className="toolbar-divider" />

            {/* 5. Code & Tables */}
            <div className="toolbar-group" style={{ position: 'relative' }}>
              <button type="button" className="editor-tb-btn" title="block-level code" onClick={() => insertMarkdown('\n```\n', '\n```\n')}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </button>
              <button 
                type="button" 
                className={`editor-tb-btn ${showTablePicker ? 'active' : ''}`} 
                title="table" 
                onClick={() => setShowTablePicker(!showTablePicker)}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
              </button>

              {/* Interactive Table Grid Picker */}
              {showTablePicker && (
                <div className="table-picker-popup">
                  <div className="table-picker-header">
                    Table Shape Grid ({hoverGrid.r} &times; {hoverGrid.c})
                  </div>
                  <div className="table-grid-matrix">
                    {Array.from({ length: 6 }).map((_, rIdx) => (
                      <div key={rIdx} className="table-grid-row">
                        {Array.from({ length: 6 }).map((_, cIdx) => {
                          const isHighlighted = rIdx < hoverGrid.r && cIdx < hoverGrid.c;
                          return (
                            <div
                              key={cIdx}
                              className={`table-grid-cell ${isHighlighted ? 'active' : ''}`}
                              onMouseEnter={() => setHoverGrid({ r: rIdx + 1, c: cIdx + 1 })}
                              onClick={() => insertTable(rIdx + 1, cIdx + 1)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="toolbar-divider" />

            {/* 6. View & Navigation */}
            <div className="toolbar-group">
              <button 
                type="button" 
                className={`editor-tb-btn ${isPreviewMode ? 'active' : ''}`} 
                title="preview" 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button 
                type="button" 
                className={`editor-tb-btn ${showCatalog ? 'active' : ''}`} 
                title="catalog" 
                onClick={() => setShowCatalog(!showCatalog)}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>(Max 1 document)</span>
              <button 
                type="button"
                className="editor-tb-btn file-upload-right-btn" 
                title="Upload Reference Document (Max 1 file)"
                onClick={handleFileUploadClick}
              >
                Upload DOCX/PDF 📤
              </button>
            </div>
          </div>

          {/* Editor Content Area (Split catalog or preview mode) */}
          <div className="rich-editor-workspace">
            {showCatalog && (
              <div className="editor-catalog-sidebar">
                <div className="catalog-title">Table of Contents</div>
                {subjectContext.split('\n').filter(l => l.startsWith('#')).length === 0 ? (
                  <div className="catalog-empty">No headings added yet. Use H1-H6 to outline your context.</div>
                ) : (
                  subjectContext.split('\n').filter(l => l.startsWith('#')).map((hLine, hIdx) => {
                    const level = hLine.match(/^#+/)?.[0].length || 1;
                    const text = hLine.replace(/^#+\s*/, '');
                    return (
                      <div key={hIdx} className={`catalog-item level-${level}`}>
                        {text}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {isPreviewMode ? (
              <div className="prompt-textarea editor-preview-box">
                <ContentRenderer text={(subjectContext ? subjectContext.replace(/\[(DOMAIN|INTERACTIVITY|TOOLS REQUIRED|FINAL PROJECT|EXPLICIT OUTLINE):[^\]]*\]\n?/gi, '').trim() : '') || '*No content to preview yet.*'} />
              </div>
            ) : (
              <textarea
                ref={contextTextareaRef}
                className="prompt-textarea"
                value={(subjectContext || '').replace(/\[(DOMAIN|INTERACTIVITY|TOOLS REQUIRED|FINAL PROJECT|EXPLICIT OUTLINE):[^\]]*\]\n?/gi, '').trim()}
                onChange={(e) => setSubjectContext(e.target.value)}
                style={{ minHeight: '220px' }}
                placeholder="Add any extra context about this subject matter to improve AI quality…"
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="file-upload-btn" onClick={() => setCurrentStep('dashboard')}>← Back</button>
          {canJumpToReview && (
            <button className="file-upload-btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={handleJumpToReview} disabled={isLoading}>Jump to Review</button>
          )}
        </div>
        <button className="action-btn" onClick={handleGenerateProposals} disabled={isLoading}>
          {isLoading ? <><IconSpinner /> Generating…</> : <>Save &amp; Continue <IconArrow /></>}
        </button>
      </div>
    </div>
  );
}
