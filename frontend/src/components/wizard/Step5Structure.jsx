import React, { useState } from 'react';
import { IconLayers, IconTrash, IconSpinner, IconArrow } from '../icons/Icons';

export function Step5Structure({
  promptText,
  promptExpanded,
  setPromptExpanded,
  structure,
  setStructure,
  selectedStructureLessonId,
  setSelectedStructureLessonId,
  draggingIdx,
  setDraggingIdx,
  dragOverIdx,
  setDragOverIdx,
  moveLesson,
  deleteLesson,
  addLesson,
  activeStructureRole,
  setActiveStructureRole,
  moveSection,
  setNewSectionRole,
  setIsAddSectionModalOpen,
  isAddSectionModalOpen,
  newSectionRole,
  newSectionTitle,
  setNewSectionTitle,
  newSectionInstruction,
  setNewSectionInstruction,
  defaultSections,
  sessionId,
  API_BASE,
  setCurrentStep,
  handleJumpToReview,
  canJumpToReview = false,
  isLoading,
  setIsLoading,
  toast
}) {
  const [isEnhancingSection, setIsEnhancingSection] = useState(false);

  return (
    <div>
      <div className="header">
        <div>
          <h2>Curriculum Structure</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Review and refine the course curriculum blueprint.</p>
        </div>
        <span className="step-chip">Step 5 of 8</span>
      </div>

      <div className="structure-split-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Column: Lesson Modules List */}
        <div className="lesson-list-panel" style={{ background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '6px' }}>Course Curriculum Overview</h3>
            {/* Compact inline prompt with collapsible accordion */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginTop: '8px' }}>
              <button
                onClick={() => setPromptExpanded(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'transparent', border: 'none', cursor: 'pointer', gap: '6px' }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                  {promptExpanded ? 'Hide Prompt' : (promptText ? `Approach: ${promptText.split(' ').slice(0, 8).join(' ')}…` : 'View Prompt')}
                </span>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: promptExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0, color: 'var(--text-muted)' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {promptExpanded && (
                <div style={{ padding: '8px 12px 12px', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--blue)', fontStyle: 'italic', lineHeight: 1.6, maxHeight: '150px', overflowY: 'auto' }}>
                  {promptText || 'Practical AI and Regulatory Foundations'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {structure.map((item, idx) => (
              <div 
                key={item.id} 
                className={`structure-item ${selectedStructureLessonId === item.id ? 'active' : ''}`}
                onClick={() => setSelectedStructureLessonId(item.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', idx.toString());
                  setDraggingIdx(idx);
                }}
                onDragEnd={() => {
                  setDraggingIdx(null);
                  setDragOverIdx(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingIdx !== null && draggingIdx !== idx) {
                    setDragOverIdx(idx);
                  }
                }}
                onDragLeave={() => {
                  setDragOverIdx(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (fromIdx === idx) return;
                  const updated = [...structure];
                  const [moved] = updated.splice(fromIdx, 1);
                  updated.splice(idx, 0, moved);
                  updated.forEach((lesson, oIdx) => { lesson.order = oIdx + 1; });
                  setStructure(updated);
                  setDraggingIdx(null);
                  setDragOverIdx(null);
                }}
                style={{ 
                  padding: '12px', 
                  borderRadius: 'var(--radius-md)', 
                  background: draggingIdx === idx 
                    ? 'rgba(72, 107, 245, 0.05)' 
                    : dragOverIdx === idx 
                      ? 'var(--blue-light)' 
                      : selectedStructureLessonId === item.id 
                        ? 'var(--blue-light)' 
                        : 'var(--surface-2)',
                  border: draggingIdx === idx 
                    ? '2px dashed var(--blue)' 
                    : dragOverIdx === idx 
                      ? '2.2px solid var(--blue)' 
                      : selectedStructureLessonId === item.id 
                        ? '1px solid rgba(72, 107, 245, 0.25)' 
                        : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: draggingIdx !== null ? 'grabbing' : 'pointer',
                  opacity: draggingIdx === idx ? 0.45 : 1,
                  transform: draggingIdx === idx 
                    ? 'scale(0.95)' 
                    : dragOverIdx === idx 
                      ? 'translateY(-2px) scale(1.02)' 
                      : 'none',
                  boxShadow: dragOverIdx === idx 
                    ? '0 6px 16px rgba(72, 107, 245, 0.12)' 
                    : 'none',
                  transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span style={{ cursor: 'grab', color: 'var(--text-muted)', fontSize: '1.1rem', userSelect: 'none' }} title="Drag to reorder">⋮⋮</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--white)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    {item.order < 10 ? `0${item.order}` : item.order}
                  </span>
                  <input
                    type="text"
                    value={(item.title || '').replace(/^Lesson\s*\d+[\s\:\.\-]*/i, '')}
                    onChange={(e) => {
                      const updated = [...structure];
                      updated[idx].title = e.target.value;
                      setStructure(updated);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="structure-title-input"
                    style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      border: 'none', 
                      background: 'transparent', 
                      flex: 1, 
                      color: 'var(--navy)',
                      padding: '4px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <button className="icon-btn-tool" onClick={() => moveLesson(idx, -1)} title="Move Up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6"/></svg>
                  </button>
                  <button className="icon-btn-tool" onClick={() => moveLesson(idx, 1)} title="Move Down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <button className="icon-btn-tool danger" onClick={() => deleteLesson(idx)} title="Delete Lesson">
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="file-upload-btn" 
            onClick={addLesson} 
            style={{ width: '100%', justifyContent: 'center', marginTop: '16px', fontSize: '0.875rem' }}
          >
            + Add Lesson
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button className="file-upload-btn" onClick={() => setCurrentStep('proposal')}>← Back</button>
          </div>
        </div>

        {/* Right Column: Detailed Section Editor & Role Tabs */}
        <div className="lesson-detail-panel" style={{ background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '4px' }}>Lesson Structure by Role</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Choose which lesson sections are generated and shown for Creator, Educator, and Student.
            </span>
          </div>

          {selectedStructureLessonId ? (
            (() => {
              const lIdx = structure.findIndex(l => l.id === selectedStructureLessonId);
              const lesson = structure[lIdx];
              if (!lesson) return null;
              const sections = lesson.sections?.[activeStructureRole] || [];

              const roleDetails = {
                creator: {
                  desc: "Focuses on content depth, technical accuracy, and andragogical alignment for high-quality curriculum design.",
                  label: "Creator View"
                },
                student: {
                  desc: "Optimized for learning outcomes, student engagement, and compelling value propositions.",
                  label: "Student View"
                },
                educator: {
                  desc: "Designed for seamless facilitation, classroom management, and effective student engagement strategies.",
                  label: "Educator View"
                }
              };

              return (
                <div>
                  {/* Role Tabs */}
                  <div className="tab-row" style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
                    {['creator', 'student', 'educator'].map(role => (
                      <button
                        key={role}
                        className={`tab-btn ${activeStructureRole === role ? 'active' : ''}`}
                        onClick={() => setActiveStructureRole(role)}
                        style={{ 
                          padding: '10px 16px', 
                          borderBottom: activeStructureRole === role ? '2px solid var(--blue)' : 'none',
                          fontWeight: activeStructureRole === role ? 'bold' : 'normal',
                          color: activeStructureRole === role ? 'var(--blue)' : 'var(--text-secondary)'
                        }}
                      >
                        {roleDetails[role].label}
                      </button>
                    ))}
                  </div>

                  {/* Active Role Description */}
                  <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', borderLeft: '3px solid var(--blue)' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {roleDetails[activeStructureRole].desc}
                    </p>
                  </div>

                  {/* Sections List */}
                  <div className="sections-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sections.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px 0' }}>No sections added yet.</p>
                    ) : (
                      sections.map((sec, sIdx) => (
                        <div
                          key={sec.id}
                          className="section-list-item"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', sIdx.toString());
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                            moveSection(lesson.id, activeStructureRole, fromIdx, sIdx);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'var(--white)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <span style={{ cursor: 'grab', color: 'var(--text-muted)', fontSize: '1.1rem', userSelect: 'none' }} title="Drag to reorder">⋮⋮</span>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="text"
                                  value={sec.title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const updated = structure.map(lesson => {
                                      const lSecs = lesson.sections ? JSON.parse(JSON.stringify(lesson.sections)) : JSON.parse(JSON.stringify(defaultSections));
                                      if (lSecs[activeStructureRole]?.[sIdx]) {
                                        lSecs[activeStructureRole][sIdx].title = val;
                                      }
                                      return { ...lesson, sections: lSecs };
                                    });
                                    setStructure(updated);
                                  }}
                                  className="structure-title-input"
                                  style={{ fontWeight: 700, fontSize: '0.9rem', border: 'none', background: 'transparent', color: 'var(--navy)', flex: 1, padding: 0 }}
                                />
                              </div>
                              <input
                                type="text"
                                value={sec.instruction}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = structure.map(lesson => {
                                    const lSecs = lesson.sections ? JSON.parse(JSON.stringify(lesson.sections)) : JSON.parse(JSON.stringify(defaultSections));
                                    if (lSecs[activeStructureRole]?.[sIdx]) {
                                      lSecs[activeStructureRole][sIdx].instruction = val;
                                    }
                                    return { ...lesson, sections: lSecs };
                                  });
                                  setStructure(updated);
                                }}
                                placeholder="AI instructions for this section..."
                                className="structure-title-input"
                                style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', border: 'none', background: 'transparent', padding: 0 }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {sec.locked ? (
                              <span className="locked-badge" title="Core Section">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                Locked
                              </span>
                            ) : (
                              <button 
                                className="icon-btn-tool danger" 
                                onClick={() => {
                                  const updated = structure.map(lesson => {
                                    const lSecs = lesson.sections ? JSON.parse(JSON.stringify(lesson.sections)) : JSON.parse(JSON.stringify(defaultSections));
                                    if (lSecs[activeStructureRole]) {
                                      lSecs[activeStructureRole] = lSecs[activeStructureRole].filter((_, i) => i !== sIdx);
                                    }
                                    return { ...lesson, sections: lSecs };
                                  });
                                  setStructure(updated);
                                }}
                              >
                                <IconTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Custom Section Button */}
                  <button 
                    type="button"
                    className="file-upload-btn" 
                    onClick={() => {
                      setNewSectionRole(activeStructureRole);
                      setIsAddSectionModalOpen(true);
                    }}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '16px', fontSize: '0.85rem' }}
                  >
                    + Add Custom Section
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="empty-state" style={{ minHeight: '400px' }}>
              <IconLayers />
              <h3>Select a Lesson Module</h3>
              <p>Select a lesson from the list on the left to configure its detailed sections.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions for Step 5 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="file-upload-btn" onClick={() => setCurrentStep('proposal')}>← Back to Proposals</button>
          {canJumpToReview && (
            <button className="file-upload-btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={handleJumpToReview} disabled={isLoading}>Jump to Review</button>
          )}
        </div>
        <button 
          className="action-btn" 
          onClick={async () => {
            if (sessionId) {
              setIsLoading(true);
              try {
                const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lessons: structure })
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.structure) {
                    setStructure(data.structure);
                  }
                }
              } catch (e) {
                if (toast) toast.error('Failed to save structure');
              } finally {
                setIsLoading(false);
              }
            }
            setCurrentStep('review');
          }} 
          disabled={isLoading}
        >
          {isLoading ? <><IconSpinner /> Saving…</> : <>Save &amp; Continue to Review <IconArrow /></>}
        </button>
      </div>

      {/* Custom Section Add Popup Modal */}
      {isAddSectionModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') { setIsAddSectionModalOpen(false); setNewSectionTitle(''); setNewSectionInstruction(''); } }}>
          <div className="add-section-modal">

            {/* Header */}
            <div className="add-section-modal-header">
              <div>
                <h2 className="add-section-modal-title">Add Custom Section</h2>
                <p className="add-section-modal-subtitle">
                  Define a new structural requirement for the{' '}
                  <strong style={{ color: 'var(--gold)', fontWeight: 700 }}>
                    {newSectionRole === 'creator' ? 'CREATOR' : newSectionRole === 'student' ? 'STUDENT' : 'EDUCATOR'}
                  </strong>{' '}view.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => { setIsAddSectionModalOpen(false); setNewSectionTitle(''); setNewSectionInstruction(''); }}>
                ✕
              </button>
            </div>

            {/* Target Role selector */}
            <div className="add-section-modal-role-tabs">
              {['creator', 'student', 'educator'].map(role => (
                <button
                  key={role}
                  className={`role-tab-pill ${newSectionRole === role ? 'active' : ''}`}
                  onClick={() => setNewSectionRole(role)}
                >
                  {role === 'creator' ? '🛠 Creator' : role === 'student' ? '📚 Student' : '🎓 Educator'}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="add-section-modal-body">
              <div className="config-item">
                <label style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Section Title</label>
                <input
                  type="text"
                  className="modal-input"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Case Study, Code Review"
                  autoFocus
                />
              </div>
              <div className="config-item" style={{ marginTop: '16px' }}>
                <label style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Instruction / Description</label>
                <textarea
                  className="modal-textarea"
                  value={newSectionInstruction}
                  onChange={(e) => setNewSectionInstruction(e.target.value)}
                  placeholder="e.g. To ensure learners understand the performance implications of their architectural choices."
                  rows={4}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="add-section-modal-footer">
              <button
                className="modal-add-btn"
                disabled={isEnhancingSection}
                onClick={async () => {
                  if (!newSectionTitle.trim()) {
                    if (toast) toast.warning('Please enter a section title.');
                    return;
                  }
                  setIsEnhancingSection(true);
                  let finalTitle = newSectionTitle.trim();
                  let finalInstruction = newSectionInstruction.trim();

                  try {
                    const res = await fetch(`${API_BASE}/courses/sections/ai-enhance`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: finalTitle,
                        instruction: finalInstruction,
                        session_id: sessionId
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.title) finalTitle = data.title;
                      if (data.instruction) finalInstruction = data.instruction;
                    }
                  } catch (e) {
                    console.warn('AI enhancement fallback:', e);
                  } finally {
                    setIsEnhancingSection(false);
                  }

                  const cleanType = `custom_${finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '')}_${Date.now().toString().slice(-4)}`;
                  const newSec = {
                    id: `custom-${Date.now()}`,
                    type: cleanType,
                    title: finalTitle,
                    instruction: finalInstruction || 'Explore foundational concepts, best practices, and practical workflows.',
                    locked: false
                  };
                  const updated = structure.map((lesson) => {
                    const lSecs = lesson.sections ? JSON.parse(JSON.stringify(lesson.sections)) : JSON.parse(JSON.stringify(defaultSections));
                    if (!lSecs[newSectionRole]) {
                      lSecs[newSectionRole] = [];
                    }
                    lSecs[newSectionRole].push({ ...newSec });
                    return { ...lesson, sections: lSecs };
                  });
                  setStructure(updated);
                  setIsAddSectionModalOpen(false);
                  setNewSectionTitle('');
                  setNewSectionInstruction('');
                  if (toast) toast.success('AI-enhanced custom section added!');
                }}
              >
                {isEnhancingSection ? <><IconSpinner /> Enhancing with AI...</> : 'Add Section →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
