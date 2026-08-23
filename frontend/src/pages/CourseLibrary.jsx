import React, { useEffect } from 'react';
import { IconBook, IconTrash, IconClock, IconSpinner } from '../components/icons/Icons';

export function CourseLibrary({
  setCurrentView,
  setCurrentStep,
  librarySearchQuery,
  setLibrarySearchQuery,
  libraryFilterTab,
  setLibraryFilterTab,
  librarySelectedTag,
  setLibrarySelectedTag,
  sessionsList,
  fetchSessions,
  API_BASE,
  setDeleteTargetSession,
  handleResumeSession,
  resetWizardState
}) {
  const [draftPage, setDraftPage] = React.useState(1);
  const [pubPage, setPubPage] = React.useState(1);
  const [archivedPage, setArchivedPage] = React.useState(1);

  useEffect(() => {
    if (fetchSessions) {
      fetchSessions();
    }
  }, []);

  const getCourseTags = (sess) => {
    if (sess.tech_tags && Array.isArray(sess.tech_tags) && sess.tech_tags.length > 0) {
      return sess.tech_tags.slice(0, 3);
    }
    const text = (sess.title || sess.prompt || '').toLowerCase();
    const tags = [];
    if (text.includes('kuli') || text.includes('labor') || text.includes('vocational') || text.includes('tukang') || text.includes('skilled')) {
      tags.push('Skilled Labor', 'Vocational Skills', 'Trade Careers');
    }
    if (text.includes('math') || text.includes('matematika') || text.includes('arithmetic') || text.includes('geometry') || text.includes('algebra')) {
      tags.push('Mathematics', 'Analytical Thinking', 'Problem Solving');
    }
    if (text.includes('mbg') || text.includes('makan bergizi') || text.includes('nutrisi') || text.includes('gizi')) {
      tags.push('Public Policy', 'Governance', 'Nutritional Economics');
    }
    if (text.includes('presiden') || text.includes('election') || text.includes('pilih') || text.includes('politi')) {
      tags.push('Political Science', 'Civic Education', 'Leadership');
    }
    if (text.includes('deep learning') || text.includes('vision') || text.includes('cnn') || text.includes('opencv')) {
      tags.push('Deep Learning', 'Computer Vision', 'PyTorch');
    }
    if (text.includes('cyber') || text.includes('security') || text.includes('penetration') || text.includes('ethical hack') || text.includes('offensive')) {
      tags.push('Cybersecurity', 'Ethical Hacking', 'Kali Linux');
    }
    if (text.includes('python')) tags.push('Python');
    if (text.includes('machine learning') || text.includes('ml')) tags.push('Machine Learning');
    if (text.includes('data science') || text.includes('pandas')) tags.push('Data Science');
    if (text.includes('generative') || text.includes('ai')) tags.push('Generative AI');
    if (text.includes('react') || text.includes('native')) tags.push('React Native');
    if (text.includes('go') || text.includes('golang')) tags.push('Go');
    if (text.includes('web') || text.includes('next.js')) tags.push('Web Development');
    if (text.includes('cook') || text.includes('masak') || text.includes('resep') || text.includes('kuliner') || text.includes('lizard') || text.includes('rendang')) {
      tags.push('Culinary Arts', 'Cooking Techniques', 'Food Prep');
    }

    if (tags.length === 0) {
      return ['AI Curriculum', 'Interactive Learning'];
    }
    return Array.from(new Set(tags)).slice(0, 3);
  };

  const renderPagination = (currentPage, totalPages, setPage) => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1.5px solid #e2e8f0',
            background: '#ffffff',
            color: currentPage === 1 ? '#cbd5e1' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        {Array.from({ length: totalPages }).map((_, pIdx) => {
          const pageNum = pIdx + 1;
          const isActive = currentPage === pageNum;
          return (
            <button 
              key={pageNum}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: isActive ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                background: '#ffffff',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 2px 8px rgba(59,130,246,0.25)' : '0 1px 3px rgba(0,0,0,0.04)'
              }}
              onClick={() => setPage(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}

        <button 
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1.5px solid #e2e8f0',
            background: '#ffffff',
            color: currentPage === totalPages ? '#cbd5e1' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    );
  };

  return (
    <div className="course-library-container">
      {/* Library Top Header */}
      <div className="library-top-header">
        <div>
          <h1 className="library-title">Course Library</h1>
          <p className="library-subtitle">Manage and organize your course curriculum assets.</p>
        </div>

        <div className="library-header-actions">
          <button className="library-upload-btn playful-card" onClick={() => { if (resetWizardState) resetWizardState(); setCurrentView('wizard'); setCurrentStep('dashboard'); }}>
            <span>+</span> Upload
          </button>
          <div className="library-search-box">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={librarySearchQuery}
              onChange={(e) => { 
                setLibrarySearchQuery(e.target.value); 
                setDraftPage(1); 
                setPubPage(1); 
                setArchivedPage(1); 
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="library-split-layout">
        {/* Left Column: Sticky Filter Sidebar Card */}
        <div className="library-filters-card playful-card" style={{ position: 'sticky', top: '90px' }}>
          <div className="filters-header">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span>Filters</span>
          </div>

          <div className="filters-nav-group">
            <button 
              className={`filter-nav-item ${libraryFilterTab === 'all' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('all'); setDraftPage(1); setPubPage(1); setArchivedPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <span>All Content</span>
              </div>
              <span className={`filter-count-pill ${libraryFilterTab === 'all' ? 'active' : ''}`}>{sessionsList.filter(s => s.status !== 'archived').length}</span>
            </button>

            <button 
              className={`filter-nav-item ${libraryFilterTab === 'drafts' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('drafts'); setDraftPage(1); setPubPage(1); setArchivedPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Drafts</span>
              </div>
              <span className="filter-count-pill draft">{sessionsList.filter(s => s.status !== 'completed' && s.status !== 'published' && s.status !== 'archived').length}</span>
            </button>

            <button 
              className={`filter-nav-item ${libraryFilterTab === 'published' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('published'); setDraftPage(1); setPubPage(1); setArchivedPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Published</span>
              </div>
              <span className="filter-count-pill published">{sessionsList.filter(s => (s.status === 'completed' || s.status === 'published') && s.status !== 'archived').length}</span>
            </button>

            <button 
              className={`filter-nav-item ${libraryFilterTab === 'archived' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('archived'); setDraftPage(1); setPubPage(1); setArchivedPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                <span>Archived</span>
              </div>
              <span className="filter-count-pill archived">{sessionsList.filter(s => s.status === 'archived').length}</span>
            </button>
          </div>

          <div className="filter-tags-section">
            <div className="filter-tags-title">■ TAGS</div>
            <div className="filter-tags-list">
              {(() => {
                const allDynamicTags = Array.from(new Set([
                  'All Tags',
                  ...sessionsList.flatMap(s => (window._getCourseTags ? getCourseTags(s) : s.tech_tags || []))
                ]));
                const displayTags = allDynamicTags.length > 1 ? allDynamicTags : ['All Tags', 'Python', 'Machine Learning', 'Generative AI', 'Web Development', 'Go', 'React Native'];
                return displayTags.slice(0, 8).map((t) => (
                  <button 
                    key={t} 
                    className={`filter-tag-pill ${librarySelectedTag === t ? 'active' : ''}`}
                    onClick={() => { setLibrarySelectedTag(t); setDraftPage(1); setPubPage(1); setArchivedPage(1); }}
                  >
                    {t === 'All Tags' ? t : `# ${t}`}
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Filtered Content Area */}
        <div className="library-content-area">
          {(() => {
            // Filter Sessions
            let filteredList = sessionsList.filter((s) => {
              const matchesSearch = !librarySearchQuery || (s.title || s.prompt || '').toLowerCase().includes(librarySearchQuery.toLowerCase());
              const cleanTag = librarySelectedTag.replace('# ', '').trim();
              const courseTags = window._getCourseTags ? getCourseTags(s) : (s.tech_tags || []);
              const matchesTag = librarySelectedTag === 'All Tags' || 
                courseTags.includes(cleanTag) ||
                ((s.title || s.prompt || '').toLowerCase().includes(cleanTag.toLowerCase()));
              const matchesTab = 
                libraryFilterTab === 'all' ? s.status !== 'archived' :
                libraryFilterTab === 'drafts' ? s.status !== 'completed' && s.status !== 'published' && s.status !== 'archived' :
                libraryFilterTab === 'published' ? (s.status === 'completed' || s.status === 'published') && s.status !== 'archived' :
                libraryFilterTab === 'archived' ? s.status === 'archived' : true;
              return matchesSearch && matchesTag && matchesTab;
            });

            const wipList = filteredList.filter(s => s.status !== 'completed' && s.status !== 'published' && s.status !== 'archived');
            const pubList = filteredList.filter(s => (s.status === 'completed' || s.status === 'published') && s.status !== 'archived');
            const archivedList = filteredList.filter(s => s.status === 'archived');

            // 6 cards per page max
            const CARDS_PER_PAGE = 6;
            const totalDraftPages = Math.ceil(wipList.length / CARDS_PER_PAGE) || 1;
            const paginatedWipList = wipList.slice((draftPage - 1) * CARDS_PER_PAGE, draftPage * CARDS_PER_PAGE);

            const totalPubPages = Math.ceil(pubList.length / CARDS_PER_PAGE) || 1;
            const paginatedPubList = pubList.slice((pubPage - 1) * CARDS_PER_PAGE, pubPage * CARDS_PER_PAGE);

            const totalArchivedPages = Math.ceil(archivedList.length / CARDS_PER_PAGE) || 1;
            const paginatedArchivedList = archivedList.slice((archivedPage - 1) * CARDS_PER_PAGE, archivedPage * CARDS_PER_PAGE);

            if (filteredList.length === 0 && sessionsList.length > 0) {
              return (
                <div className="empty-state" style={{ background: 'var(--white)', padding: '50px 20px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <IconBook />
                  <h3>No courses match "{libraryFilterTab !== 'all' ? libraryFilterTab : librarySelectedTag !== 'All Tags' ? librarySelectedTag : librarySearchQuery}"</h3>
                  <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>You have {sessionsList.length} saved courses, but none match this tab or filter.</p>
                  <button 
                    className="ai-pill-btn" 
                    style={{ marginTop: '16px', background: 'var(--blue)', color: 'var(--white)' }}
                    onClick={() => { setLibrarySelectedTag('All Tags'); setLibrarySearchQuery(''); setLibraryFilterTab('all'); }}
                  >
                    Reset Filters 🔄
                  </button>
                </div>
              );
            }

            return (
              <>
                {/* 1. WORK IN PROGRESS (DRAFTS) */}
                {(libraryFilterTab === 'all' || libraryFilterTab === 'drafts') && wipList.length > 0 && (
                  <div className="library-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="library-section-title-wrap">
                        <span className="title-vertical-bar gold"></span>
                        <h3 className="library-section-title">WORK IN PROGRESS (DRAFTS - {wipList.length})</h3>
                      </div>
                      {renderPagination(draftPage, totalDraftPages, setDraftPage)}
                    </div>
                    <div className="elice-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                      {paginatedWipList.map((sess) => {
                        const getStepInfo = (s) => {
                          if (s.status === 'completed' || s.status === 'published' || s.progress >= 100) {
                            return { stepNum: 8, label: 'COMPLETED', progress: 100 };
                          }
                          if (s.status === 'generating' || s.step === 'generating') {
                            // Step 7 smoothly maps between 76% and 95% so it is strictly higher than Step 6 (75%)
                            const rawProg = s.progress || 0;
                            const step7Prog = Math.min(95, Math.max(76, Math.round(75 + (rawProg / 100) * 20)));
                            return { stepNum: 7, label: 'GENERATING', progress: step7Prog };
                          }
                          const step = s.step || 'context';
                          switch (step) {
                            case 'dashboard':
                            case 'prompt': return { stepNum: 1, label: 'CONCEPT', progress: 12 };
                            case 'context': return { stepNum: 2, label: 'CONFIGURATION', progress: 25 };
                            case 'grounding': return { stepNum: 3, label: 'GROUNDING', progress: 38 };
                            case 'proposal': return { stepNum: 4, label: 'PROPOSALS', progress: 50 };
                            case 'structure': return { stepNum: 5, label: 'STRUCTURE', progress: 63 };
                            case 'review': return { stepNum: 6, label: 'REVIEW', progress: 75 };
                            default: return { stepNum: 2, label: 'CONFIGURATION', progress: 25 };
                          }
                        };
                        const info = getStepInfo(sess);

                        return (
                          <div 
                            key={sess.session_id} 
                            className="elice-course-card playful-card"
                          >
                            <div className="card-top">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span className="card-tag" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="9" y1="13" x2="15" y2="13"/>
                                    <line x1="9" y1="17" x2="13" y2="17"/>
                                  </svg>
                                  DRAFT
                                </span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  {sess.progress >= 100 && (
                                    <button 
                                      className="icon-btn-tool" 
                                      style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', color: '#15803d', background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                      title="Publish course"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'completed' })
                                        });
                                        fetchSessions();
                                      }}
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    </button>
                                  )}
                                  <button 
                                    className="icon-btn-tool" 
                                    style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--white)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    title="Archive course"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'archived' })
                                      });
                                      fetchSessions();
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                                  </button>
                                  <button 
                                    className="icon-btn-tool danger"
                                    style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.05)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    title="Delete Draft"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTargetSession(sess);
                                    }}
                                  >
                                    <IconTrash style={{ width: '14px', height: '14px', pointerEvents: 'none' }} />
                                  </button>
                                </div>
                              </div>
                              <h3 
                                className="card-title" 
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleResumeSession(sess)}
                              >
                                {sess.title || sess.prompt}
                              </h3>
                              
                              {/* Dynamic Tech Hashtags */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                                {getCourseTags(sess).slice(0, 3).map((tag, tIdx) => (
                                  <span key={tIdx} className="persona-section-tag"># {tag}</span>
                                ))}
                              </div>

                              {/* Progress Indicator — Clean & Informative */}
                              <div style={{ marginTop: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '5px' }}>
                                  <span>STEP {info.stepNum} • {info.label}</span>
                                  <span style={{ color: 'var(--blue)', fontWeight: 800 }}>
                                    {info.progress}%
                                  </span>
                                </div>
                                <div className="session-mini-progress" style={{ height: '6px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                                  <div 
                                    className="session-mini-bar" 
                                    style={{ 
                                      width: `${info.progress}%`, 
                                      background: 'var(--navy)',
                                      height: '100%',
                                      transition: 'width 0.4s ease'
                                    }} 
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="card-bottom" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <IconClock style={{ width: '13px', height: '13px' }} /> {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Active'}
                              </span>
                              <button 
                                className="action-btn" 
                                onClick={() => handleResumeSession(sess)}
                                style={{ 
                                  padding: '8px 18px',
                                  justifyContent: 'center', 
                                  background: 'var(--surface-2)', 
                                  color: 'var(--navy)', 
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 700,
                                  borderRadius: '10px'
                                }}
                              >
                                Continue
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. PUBLISHED CURRICULUM */}
                {(libraryFilterTab === 'all' || libraryFilterTab === 'published') && pubList.length > 0 && (
                  <div className="library-section" style={{ marginTop: wipList.length > 0 ? '30px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="library-section-title-wrap">
                        <span className="title-vertical-bar blue"></span>
                        <h3 className="library-section-title">PUBLISHED CURRICULUM ({pubList.length})</h3>
                      </div>
                      {renderPagination(pubPage, totalPubPages, setPubPage)}
                    </div>

                    <div className="elice-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                      {paginatedPubList.map((sess) => (
                        <div 
                          key={sess.session_id} 
                          className="elice-course-card playful-card" 
                        >
                          <div className="card-top">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="card-tag" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>✅ PUBLISHED</span>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button 
                                  className="icon-btn-tool" 
                                  style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--white)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  title="Move to Drafts"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'draft' })
                                    });
                                    fetchSessions();
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
                                </button>
                                <button 
                                  className="icon-btn-tool" 
                                  style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--white)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  title="Archive course"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'archived' })
                                    });
                                    fetchSessions();
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                                </button>
                                <button 
                                  className="icon-btn-tool danger" 
                                  style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.05)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  title="Delete Course"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTargetSession(sess);
                                  }}
                                >
                                  <IconTrash style={{ width: '14px', height: '14px', pointerEvents: 'none' }} />
                                </button>
                              </div>
                            </div>
                            <h3 
                              className="card-title" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleResumeSession(sess)}
                            >
                              {sess.title || sess.prompt}
                            </h3>

                            {/* Dynamic Tech Hashtags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {getCourseTags(sess).slice(0, 3).map((tag, tIdx) => (
                                <span key={tIdx} className="persona-section-tag"># {tag}</span>
                              ))}
                            </div>

                            {/* Progress Indicator — Clean & Informative */}
                            <div style={{ marginTop: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '5px' }}>
                                <span>STEP 8 • COMPLETED</span>
                                <span style={{ color: '#10b981', fontWeight: 800 }}>100%</span>
                              </div>
                              <div className="session-mini-progress" style={{ height: '6px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                                <div 
                                  className="session-mini-bar" 
                                  style={{ 
                                    width: '100%', 
                                    background: '#10b981',
                                    height: '100%'
                                  }} 
                                />
                              </div>
                            </div>
                          </div>

                          <div className="card-bottom" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <IconClock style={{ width: '13px', height: '13px' }} /> {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Active'}
                            </span>
                            <button 
                              className="action-btn" 
                              onClick={() => handleResumeSession(sess)}
                              style={{ 
                                padding: '8px 18px',
                                justifyContent: 'center', 
                                background: 'var(--surface-2)', 
                                color: 'var(--navy)', 
                                border: '1px solid var(--border-color)',
                                fontWeight: 700,
                                borderRadius: '10px'
                              }}
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. ARCHIVED CURRICULUM */}
                {(libraryFilterTab === 'all' || libraryFilterTab === 'archived') && archivedList.length > 0 && (
                  <div className="library-section" style={{ marginTop: wipList.length > 0 || pubList.length > 0 ? '30px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="library-section-title-wrap">
                        <span className="title-vertical-bar gold" style={{ background: '#64748b' }}></span>
                        <h3 className="library-section-title">ARCHIVED CURRICULUM ({archivedList.length})</h3>
                      </div>
                      {renderPagination(archivedPage, totalArchivedPages, setArchivedPage)}
                    </div>

                    <div className="elice-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                      {paginatedArchivedList.map((sess) => (
                        <div 
                          key={sess.session_id} 
                          className="elice-course-card playful-card" 
                          style={{ opacity: 0.9 }}
                        >
                          <div className="card-top">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="card-tag" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>📦 ARCHIVED</span>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button 
                                  className="icon-btn-tool" 
                                  style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', border: '1px solid #bbf7d0', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  title="Restore to Published"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'completed' })
                                    });
                                    fetchSessions();
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                                </button>
                                <button 
                                  className="icon-btn-tool danger" 
                                  style={{ width: '30px', height: '30px', minWidth: '30px', minHeight: '30px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.05)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  title="Delete Permanently"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTargetSession(sess);
                                  }}
                                >
                                  <IconTrash style={{ width: '14px', height: '14px', pointerEvents: 'none' }} />
                                </button>
                              </div>
                            </div>
                            <h3 
                              className="card-title" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleResumeSession(sess)}
                            >
                              {sess.title || sess.prompt}
                            </h3>

                            {/* Dynamic Tech Hashtags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {getCourseTags(sess).slice(0, 3).map((tag, tIdx) => (
                                <span key={tIdx} className="persona-section-tag"># {tag}</span>
                              ))}
                            </div>
                          </div>

                          <div className="card-bottom" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <IconClock style={{ width: '13px', height: '13px' }} /> {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Active'}
                            </span>
                            <button 
                              className="action-btn" 
                              onClick={() => handleResumeSession(sess)}
                              style={{ 
                                padding: '8px 18px',
                                justifyContent: 'center', 
                                background: 'var(--surface-2)', 
                                color: 'var(--navy)', 
                                border: '1px solid var(--border-color)',
                                fontWeight: 700,
                                borderRadius: '10px'
                              }}
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
