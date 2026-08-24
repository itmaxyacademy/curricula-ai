import React from 'react';

export function Navbar({
  currentView,
  setCurrentView,
  requireAuth,
  currentUser,
  setCurrentUser,
  showUserDropdown,
  setShowUserDropdown,
  setShowMyCourses,
  sessionId,
  generationProgress = 0,
  currentStep,
  setCurrentStep,
  API_BASE,
  fetchSessions,
  resetWizardState,
  toast
}) {
  return (
    <div className="top-header">
      <div 
        className="header-logo-area" 
        onClick={() => currentUser ? setCurrentView('home') : setCurrentView('landing')} 
        style={{ cursor: 'pointer' }}
      >
        <div className="header-logo-mark" style={{ background: 'var(--navy)' }}>
          <img src="/m-logo.png" alt="Maxy" width="36" height="36" style={{ borderRadius: '10px', display: 'block' }} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name" style={{ color: 'var(--navy)' }}>Curricula AI</span>
          <span className="sidebar-logo-byline" style={{ color: 'var(--blue)' }}>by Maxy Academy</span>
        </div>
      </div>

      <div className="header-tabs">
        <button 
          className={`header-tab-btn ${currentView === 'landing' ? 'active' : ''}`}
          onClick={() => setCurrentView('landing')}
        >
          Overview
        </button>
        <button 
          className={`header-tab-btn ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => requireAuth('home', () => { 
            setCurrentView('home'); 
            setShowMyCourses(false); 
            if (fetchSessions) fetchSessions();
          })}
        >
          Home
        </button>
        <button 
          className={`header-tab-btn ${currentView === 'courses' ? 'active' : ''}`}
          onClick={() => requireAuth('courses', () => { 
            if (currentStep === 'generating' && generationProgress < 100 && sessionId && API_BASE) {
              fetch(`${API_BASE}/courses/sessions/${sessionId}/pause`, { method: 'POST' }).catch(() => {});
            }
            setCurrentView('courses'); 
            setShowMyCourses(true); 
            if (fetchSessions) fetchSessions(); 
          })}
        >
          Courses
        </button>
      </div>

      <div className="header-actions">
        <button 
          className="header-create-btn"
          onClick={() => requireAuth('wizard', () => { 
            if (resetWizardState) resetWizardState();
            setCurrentView('wizard'); 
            setCurrentStep('dashboard'); 
            setShowMyCourses(false); 
          })}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Create</span>
        </button>

        {currentUser ? (
          <div style={{ position: 'relative' }}>
            <div 
              className="profile-avatar-circle" 
              style={{ cursor: 'pointer', background: 'var(--navy)', color: 'var(--gold)', fontWeight: 800, border: '2px solid var(--gold)' }} 
              title={currentUser.name}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>

            {showUserDropdown && (
              <div style={{ position: 'absolute', right: 0, top: '48px', background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', boxShadow: 'var(--shadow-lg)', minWidth: '220px', zIndex: 9999 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--navy)', marginBottom: '2px' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{currentUser.email}</div>
                <div style={{ fontSize: '0.72rem', background: '#F1F5F9', color: 'var(--blue)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: 700, marginBottom: '10px' }}>
                  Role: {currentUser.role || 'Creator'}
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '10px' }} />
                <button 
                  style={{ width: '100%', padding: '7px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                  onClick={() => {
                    localStorage.removeItem('curricula_user');
                    setCurrentUser(null);
                    setShowUserDropdown(false);
                    setCurrentView('landing');
                    toast.info("Logged out successfully.");
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            className="btn-secondary"
            style={{ padding: '8px 18px', fontSize: '0.86rem', fontWeight: 800, borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            onClick={() => setCurrentView('login')}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
