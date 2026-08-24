import React from 'react';
import { IconSpinner, IconArrow, IconTrash } from '../icons/Icons';

export function Step3Grounding({
  prerequisites,
  setPrerequisites,
  boundaries,
  setBoundaries,
  learningOutcomes,
  setLearningOutcomes,
  handleAutoSuggestGrounding,
  loadingField,
  setCurrentStep,
  handleJumpToReview,
  canJumpToReview = false,
  handleSaveGrounding,
  isLoading
}) {
  return (
    <div>
      <div className="header">
        <div>
          <h2>Ground your Course</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Define the knowledge boundaries and learning objectives.</p>
        </div>
        <span className="step-chip">Step 3 of 8</span>
      </div>

      <div className="review-summary-grid">
        {/* Card 1: Prerequisites (Green Accent Theme) */}
        <div className="review-card" style={{ borderTop: '4px solid #10b981', borderRadius: '16px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)' }}>
          <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>PREREQUISITES</span>
              <h4 className="review-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>What they should know</h4>
            </div>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
          </div>
          <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            {prerequisites.length === 0 ? (
              <div style={{ background: '#f0fdf4', border: '1px dashed #a7f3d0', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#166534', fontSize: '0.85rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>No prerequisites added yet</p>
                <p style={{ fontSize: '0.78rem', color: '#15803d', opacity: 0.8 }}>Add basic skills learners need or click <strong>AI Suggest ✨</strong> below!</p>
              </div>
            ) : (
              prerequisites.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>✓</span>
                  <input
                    type="text"
                    className="prompt-textarea"
                    style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#14532d', fontWeight: 600 }}
                    value={item}
                    onChange={(e) => {
                      const updated = [...prerequisites];
                      updated[idx] = e.target.value;
                      setPrerequisites(updated);
                    }}
                    placeholder="e.g. Basic Python programming, Functions"
                  />
                  <button className="icon-btn-tool danger" onClick={() => {
                    const updated = prerequisites.filter((_, i) => i !== idx);
                    setPrerequisites(updated);
                  }}>
                    <IconTrash />
                  </button>
                </div>
              ))
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                className="file-upload-btn" 
                style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center', borderColor: '#a7f3d0', color: '#047857', background: '#ffffff', fontWeight: 700 }} 
                onClick={() => setPrerequisites([...prerequisites, ''])}
              >
                + Add Item
              </button>
              <button 
                className="action-btn" 
                style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', fontWeight: 700 }} 
                onClick={() => handleAutoSuggestGrounding('prerequisites', prerequisites, setPrerequisites)} 
                disabled={loadingField !== null}
              >
                {loadingField === 'prerequisites' ? <><IconSpinner /> Generating…</> : '✨ AI Suggest'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Boundaries (Red Accent Theme) */}
        <div className="review-card" style={{ borderTop: '4px solid #ef4444', borderRadius: '16px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)' }}>
          <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>OUT OF SCOPE</span>
              <h4 className="review-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>Topics NOT covered</h4>
            </div>
            <span style={{ fontSize: '1.2rem' }}>⛔</span>
          </div>
          <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            {boundaries.length === 0 ? (
              <div style={{ background: '#fef2f2', border: '1px dashed #fca5a5', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#991b1b', fontSize: '0.85rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>No boundaries defined yet</p>
                <p style={{ fontSize: '0.78rem', color: '#b91c1c', opacity: 0.8 }}>Define topics excluded to focus learning, or click <strong>AI Suggest ✨</strong>!</p>
              </div>
            ) : (
              boundaries.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>✕</span>
                  <input
                    type="text"
                    className="prompt-textarea"
                    style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1, border: '1px solid #fca5a5', background: '#fef2f2', color: '#7f1d1d', fontWeight: 600 }}
                    value={item}
                    onChange={(e) => {
                      const updated = [...boundaries];
                      updated[idx] = e.target.value;
                      setBoundaries(updated);
                    }}
                    placeholder="e.g. Advanced Django, Mobile App Development"
                  />
                  <button className="icon-btn-tool danger" onClick={() => {
                    const updated = boundaries.filter((_, i) => i !== idx);
                    setBoundaries(updated);
                  }}>
                    <IconTrash />
                  </button>
                </div>
              ))
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                className="file-upload-btn" 
                style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center', borderColor: '#fca5a5', color: '#b91c1c', background: '#ffffff', fontWeight: 700 }} 
                onClick={() => setBoundaries([...boundaries, ''])}
              >
                + Add Item
              </button>
              <button 
                className="action-btn" 
                style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', fontWeight: 700 }} 
                onClick={() => handleAutoSuggestGrounding('boundaries', boundaries, setBoundaries)} 
                disabled={loadingField !== null}
              >
                {loadingField === 'boundaries' ? <><IconSpinner /> Generating…</> : '✨ AI Suggest'}
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Learning Outcomes (Brand Gold Accent Theme) */}
        <div className="review-card" style={{ gridColumn: 'span 2', borderTop: '4px solid #E9B259', borderRadius: '16px', boxShadow: '0 4px 12px rgba(233, 178, 89, 0.12)' }}>
          <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>TARGET OUTCOMES</span>
              <h4 className="review-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>What learners will master</h4>
            </div>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
          </div>
          <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
            {learningOutcomes.length === 0 ? (
              <div style={{ background: '#FFFDF7', border: '1px dashed #FDE68A', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#78350F', fontSize: '0.85rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>No learning outcomes added yet</p>
                <p style={{ fontSize: '0.78rem', color: '#92400E', opacity: 0.8 }}>Add skills learners will achieve or click <strong>AI Suggest ✨</strong> below!</p>
              </div>
            ) : (
              learningOutcomes.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    className="prompt-textarea"
                    style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1, border: '1px solid #FCD34D', background: '#FFFDF7', color: '#2D3561', fontWeight: 600 }}
                    value={item}
                    onChange={(e) => {
                      const updated = [...learningOutcomes];
                      updated[idx] = e.target.value;
                      setLearningOutcomes(updated);
                    }}
                    placeholder="e.g. Build a complete REST API using FastAPI and SQL"
                  />
                  <button className="icon-btn-tool danger" onClick={() => {
                    const updated = learningOutcomes.filter((_, i) => i !== idx);
                    setLearningOutcomes(updated);
                  }}>
                    <IconTrash />
                  </button>
                </div>
              ))
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', maxWidth: '420px' }}>
              <button 
                className="file-upload-btn" 
                style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center', borderColor: '#FCD34D', color: '#92400E', background: '#ffffff', fontWeight: 700 }} 
                onClick={() => setLearningOutcomes([...learningOutcomes, ''])}
              >
                + Add Item
              </button>
              <button 
                className="action-btn" 
                style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', justifyContent: 'center', background: 'linear-gradient(135deg, #E9B259 0%, #D9A046 100%)', color: '#2D3561', border: 'none', boxShadow: '0 4px 12px rgba(233, 178, 89, 0.28)', fontWeight: 800 }} 
                onClick={() => handleAutoSuggestGrounding('learning_outcomes', learningOutcomes, setLearningOutcomes)} 
                disabled={loadingField !== null}
              >
                {loadingField === 'learning_outcomes' ? <><IconSpinner /> Generating…</> : '✨ AI Suggest'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="file-upload-btn" onClick={() => setCurrentStep('context')}>← Back</button>
          {canJumpToReview && (
            <button className="file-upload-btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={handleJumpToReview} disabled={isLoading}>Jump to Review</button>
          )}
        </div>
        <button className="action-btn" onClick={handleSaveGrounding} disabled={isLoading}>
          {isLoading ? <><IconSpinner /> Generating Proposals…</> : <>Generate Proposals <IconArrow /></>}
        </button>
      </div>
    </div>
  );
}
