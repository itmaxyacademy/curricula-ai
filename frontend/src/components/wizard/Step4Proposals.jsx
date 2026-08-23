import React from 'react';
import { IconSpinner } from '../icons/Icons';

export function Step4Proposals({
  proposals,
  selectedProposalId,
  handleSelectProposal,
  isLoading,
  setCurrentStep
}) {
  return (
    <div>
      <div className="header">
        <div>
          <h2>Choose a Direction for your Course</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Select one of the proposed directions to proceed.</p>
        </div>
        <span className="step-chip">Step 4 of 8</span>
      </div>

      <div className="proposal-grid">
        {proposals.map((prop) => {
          const isRec = prop.id === 2;
          const isSelected = selectedProposalId === prop.id;
          const isThisLoading = isLoading && isSelected;
          const diffList = prop.differentiators ? prop.differentiators.split(',').map(s => s.trim()).filter(Boolean) : [];
          return (
            <div
              key={prop.id}
              className={`proposal-card ${isRec ? 'recommended' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => !isLoading && handleSelectProposal(prop.id)}
              style={{ 
                border: isThisLoading ? '2.5px solid var(--blue)' : isRec ? '2px solid var(--gold)' : isSelected ? '2px solid var(--blue)' : '1px solid var(--border-color)', 
                boxShadow: isThisLoading ? '0 10px 30px rgba(37, 99, 235, 0.25)' : isRec ? '0 8px 24px rgba(245, 158, 11, 0.15)' : '',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                opacity: isLoading && !isSelected ? 0.6 : 1,
                transform: isSelected ? 'scale(1.01)' : 'none',
                transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
                cursor: isLoading ? 'default' : 'pointer'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  {isRec ? (
                    <span className="tag-badge" style={{ background: 'var(--navy)', color: 'var(--gold)', border: '1.5px solid var(--gold)', fontSize: '0.75rem', padding: '3px 10px', display: 'inline-block' }}>
                      ⭐ Recommended
                    </span>
                  ) : (
                    <span className="tag-badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '3px 10px', display: 'inline-block' }}>
                      Option {prop.id}
                    </span>
                  )}
                  {isSelected && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--blue)', background: 'var(--blue-light)', padding: '2px 8px', borderRadius: '12px' }}>
                      ✓ Selected
                    </span>
                  )}
                </div>

                <h3>{prop.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '20px' }}>
                  {prop.description}
                </p>

                {diffList.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--navy)', marginBottom: '8px' }}>
                      Key Differentiating Factors
                    </h4>
                    <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {diffList.map((diff, idx) => (
                        <li key={idx} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isRec ? "var(--gold-deep)" : "var(--navy)"} strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                className={isThisLoading ? "action-btn" : isRec ? "purple-start-btn" : "file-upload-btn"}
                style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading) handleSelectProposal(prop.id);
                }}
              >
                {isThisLoading ? <><IconSpinner /> Selecting Option {prop.id}…</> : isSelected ? '✓ Selected Direction' : 'Select This Option'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <button className="file-upload-btn" onClick={() => setCurrentStep('grounding')}>← Back to Grounding</button>
        <button 
          className="action-btn"
          disabled={!selectedProposalId || isLoading}
          onClick={() => {
            if (selectedProposalId) {
              handleSelectProposal(selectedProposalId);
            }
          }}
        >
          {isLoading ? <><IconSpinner /> Loading Structure…</> : <>Continue to Structure →</>}
        </button>
      </div>
    </div>
  );
}
