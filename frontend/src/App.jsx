import React, { useState, useEffect, useRef } from 'react';

const API_BASE = '/api/v1';

// ── Layout & Pages ──
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { CourseLibrary } from './pages/CourseLibrary';
import { WizardPage } from './pages/WizardPage';
import { DeleteCourseModal } from './components/modals/DeleteCourseModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// ── Custom Hooks / Controllers ──
import { useToast } from './hooks/useToast';
import { useAuthUser } from './hooks/useAuthUser';
import { useCourseWizard } from './hooks/useCourseWizard';
import { useCourseExport } from './hooks/useCourseExport';

export default function App() {
  // ── Navigation State ──
  const [currentView, setCurrentView] = useState('landing');
  const [currentStep, setCurrentStep] = useState('dashboard');

  // ── Toast System ──
  const { toasts, toast } = useToast();

  // ── Auth Hook ──
  const auth = useAuthUser({ toast, setCurrentView });

  // ── Shared ref for setPptxDataByLesson (breaks circular dependency) ──
  const setPptxDataByLessonRef = useRef(null);

  // ── Course Export, PPTX & History Controller ──
  const exports = useCourseExport({
    sessionId: null, // will be set via wizard after init
    currentStep,
    activeRole: null,
    activeLessonId: null,
    courseData: null,
    setCourseData: null,
    toast,
    checkCanEdit: null,
    setPptxDataByLessonRef,
  });

  // ── Course Wizard Controller ──
  const wizard = useCourseWizard({ 
    toast, 
    setCurrentView, 
    currentView, 
    currentStep, 
    setCurrentStep, 
    setPptxDataByLesson: setPptxDataByLessonRef,
  });

  // ── Sync wizard state to exports ──
  useEffect(() => {
    if (exports.setWizardState) {
      exports.setWizardState({
        sessionId: wizard.sessionId,
        activeRole: wizard.activeRole,
        activeLessonId: wizard.activeLessonId,
        courseData: wizard.courseData,
        setCourseData: wizard.setCourseData,
        checkCanEdit: wizard.checkCanEdit,
      });
    }
  }, [wizard.sessionId, wizard.activeRole, wizard.activeLessonId, wizard.courseData]);

  // ── Browser History Integration ──
  const isPopStateRef = useRef(false);

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ currentView: 'landing', currentStep: 'dashboard', sessionId: null }, '');
    }

    const handlePopState = (event) => {
      if (event.state) {
        isPopStateRef.current = true;
        if (event.state.currentView) setCurrentView(event.state.currentView);
        if (event.state.currentStep) setCurrentStep(event.state.currentStep);
        if (event.state.sessionId !== undefined) wizard.setSessionId(event.state.sessionId);
      } else {
        isPopStateRef.current = true;
        setCurrentView('landing');
        setCurrentStep('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    const stateObj = { currentView, currentStep, sessionId: wizard.sessionId };
    if (
      !window.history.state ||
      window.history.state.currentView !== currentView ||
      window.history.state.currentStep !== currentStep ||
      window.history.state.sessionId !== wizard.sessionId
    ) {
      window.history.pushState(stateObj, '', window.location.pathname + window.location.search);
    }
  }, [currentView, currentStep, wizard.sessionId]);

  return (
    <div className="app-container">
      <input 
        type="file" 
        ref={wizard.fileInputRef} 
        onChange={currentStep === 'dashboard' ? wizard.handleFileSelect : wizard.handleFileUpload} 
        style={{ display: 'none' }} 
        accept=".pdf,.docx,.txt" 
      />

      {/* ── Top Header Navigation ── */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        requireAuth={auth.requireAuth}
        currentUser={auth.currentUser}
        setCurrentUser={auth.setCurrentUser}
        showUserDropdown={auth.showUserDropdown}
        setShowUserDropdown={auth.setShowUserDropdown}
        setShowMyCourses={wizard.setShowMyCourses}
        setSessionId={wizard.setSessionId}
        setPromptText={wizard.setPromptText}
        setProposals={wizard.setProposals}
        setStructure={wizard.setStructure}
        setCourseData={wizard.setCourseData}
        setUploadedFileName={wizard.setUploadedFileName}
        setPendingFile={wizard.setPendingFile}
        sessionId={wizard.sessionId}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        API_BASE={API_BASE}
        fetchSessions={wizard.fetchSessions}
        resetWizardState={wizard.resetWizardState}
        toast={toast}
      />

      {/* ── Main Content Router ── */}
      <div
        key={currentView}
        className={`main-content page-transition ${currentView === 'landing' ? 'landing-mode' : ''}`}
      >

        {/* ── Cinematic Landing Page ── */}
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={(view) => {
              if (view === 'wizard') { 
                if (wizard.resetWizardState) wizard.resetWizardState();
                setCurrentView('wizard'); 
                setCurrentStep('dashboard'); 
              } else {
                setCurrentView(view);
              }
            }}
            requireAuth={auth.requireAuth}
          />
        )}

        {/* ── Standalone Login & Sign Up View ── */}
        {(currentView === 'login' || currentView === 'signup') && (
          <AuthPage
            currentView={currentView}
            setCurrentView={setCurrentView}
            handleAuthSubmit={auth.handleAuthSubmit}
            authName={auth.authName}
            setAuthName={auth.setAuthName}
            authEmail={auth.authEmail}
            setAuthEmail={auth.setAuthEmail}
            authPassword={auth.authPassword}
            setAuthPassword={auth.setAuthPassword}
            showAuthPassword={auth.showAuthPassword}
            setShowAuthPassword={auth.setShowAuthPassword}
            authRole={auth.authRole}
            setAuthRole={auth.setAuthRole}
            authLoading={auth.authLoading}
          />
        )}

        {/* ── Home Page View ── */}
        {currentView === 'home' && (
          <ErrorBoundary name="HomePage">
            <HomePage
              greeting={auth.greeting}
              sessionsList={wizard.sessionsList}
              handleResumeSession={(sess) => wizard.handleResumeSession(sess, setPptxDataByLessonRef)}
              selectedTopicCategory={wizard.selectedTopicCategory}
              setSelectedTopicCategory={wizard.setSelectedTopicCategory}
              setPromptText={wizard.setPromptText}
              setCurrentView={setCurrentView}
              setCurrentStep={setCurrentStep}
              toast={toast}
            />
          </ErrorBoundary>
        )}

        {/* ── Courses Page View (Course Library Layout) ── */}
        {currentView === 'courses' && (
          <ErrorBoundary name="CourseLibrary">
            <CourseLibrary
              setCurrentView={setCurrentView}
              setCurrentStep={setCurrentStep}
              librarySearchQuery={wizard.librarySearchQuery}
              setLibrarySearchQuery={wizard.setLibrarySearchQuery}
              libraryFilterTab={wizard.libraryFilterTab}
              setLibraryFilterTab={wizard.setLibraryFilterTab}
              librarySelectedTag={wizard.librarySelectedTag}
              setLibrarySelectedTag={wizard.setLibrarySelectedTag}
              libraryPubPage={wizard.libraryPubPage}
              setLibraryPubPage={wizard.setLibraryPubPage}
              sessionsList={wizard.sessionsList}
              fetchSessions={wizard.fetchSessions}
              API_BASE={API_BASE}
              setDeleteTargetSession={wizard.setDeleteTargetSession}
              handleResumeSession={(sess) => wizard.handleResumeSession(sess, setPptxDataByLessonRef)}
              resetWizardState={wizard.resetWizardState}
            />
          </ErrorBoundary>
        )}

        {/* ── Wizard Flow View ── */}
        {currentView === 'wizard' && (
          <ErrorBoundary name="WizardPage">
            <WizardPage
              wizard={wizard}
              exports={exports}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              toast={toast}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Global Delete Confirmation Modal Popup */}
      <DeleteCourseModal
        deleteTargetSession={wizard.deleteTargetSession}
        setDeleteTargetSession={wizard.setDeleteTargetSession}
        API_BASE={API_BASE}
        fetchSessions={wizard.fetchSessions}
        toast={toast}
      />

      {/* Global Toast Notifications Container */}
      {toasts && toasts.length > 0 && (
        <div className="toast-container" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {toasts.map(t => (
            <div key={t.id} className={`toast-item toast-${t.type}`} style={{ padding: '12px 18px', borderRadius: '8px', background: t.type === 'error' ? '#ef4444' : t.type === 'warning' ? '#f59e0b' : t.type === 'success' ? '#10b981' : '#3b82f6', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '0.9rem', fontWeight: 500 }}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}