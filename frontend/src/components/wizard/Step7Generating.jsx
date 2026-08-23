import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconSpinner, IconCheck, IconChevronLeft, IconChevronRight } from '../icons/Icons';
import { CreatorView } from '../views/CreatorView';
import { StudentView } from '../views/StudentView';
import { EducatorView } from '../views/EducatorView';

export function Step7Generating({
  promptText,
  promptExpanded,
  setPromptExpanded,
  courseData,
  setCourseData,
  setActiveLessonId,
  setCurrentStep,
  API_BASE,
  sessionId,
  generationProgress,
  setGenerationProgress,
  generationStatusText,
  structure,
  currentGeneratingLessonIdx,
  setCurrentGeneratingLessonIdx,
  activeRole,
  setActiveRole,
  activeSubSection,
  setActiveSubSection,
  isAIWandOpen,
  setIsAIWandOpen,
  setIsWandProcessing,
  fetchHistory,
  setIsHistoryOpen,
  checkCanEdit,
  editingSection,
  setEditingSection,
  editingText,
  setEditingText,
  handleSaveManualEdit,
  renderAIActionBar,
  renderCustomSections,
  toast
}) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    setGenerationProgress(0);
    setCurrentStep('review');
    if (toast) toast.info("Generation canceled. Returned to Step 6 Review.");

    // Fire non-blocking cancel request to backend
    fetch(`${API_BASE}/courses/sessions/${sessionId}/cancel`, { method: 'POST' })
      .catch(e => console.warn("Async cancel notice:", e))
      .finally(() => setIsCanceling(false));
  };

  // ── Scroll Spy ──────────────────────────────────────────────────────────────
  const observerRef = useRef(null);

  const scrollCleanupRef = useRef(null);

  const setupScrollSpy = useCallback((secIds) => {
    if (scrollCleanupRef.current) {
      scrollCleanupRef.current();
      scrollCleanupRef.current = null;
    }

    if (!secIds || secIds.length === 0) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const HEADER_OFFSET = 140;
          const elements = secIds
            .map(id => ({ id, el: document.getElementById(`step7-sec-${id}`) }))
            .filter(item => Boolean(item.el));

          if (elements.length > 0) {
            let activeId = elements[0].id;
            for (let i = 0; i < elements.length; i++) {
              const rect = elements[i].el.getBoundingClientRect();
              if (rect.top <= HEADER_OFFSET) {
                activeId = elements[i].id;
              } else {
                break;
              }
            }
            setActiveSubSection(activeId);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Run initial positioning check after DOM paint
    const timer = setTimeout(onScroll, 120);

    window.addEventListener('scroll', onScroll, { passive: true });
    scrollCleanupRef.current = () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [setActiveSubSection]);

  // Re-attach spy whenever role, lesson or structure changes
  useEffect(() => {
    // Build secIds dynamically from the currently rendered sections (including custom sections)
    const structLesson = (structure || [])[currentGeneratingLessonIdx];
    const roleSecs = structLesson?.sections?.[activeRole] || [];
    let secIds;
    if (roleSecs.length > 0) {
      secIds = roleSecs.map(s => {
        return s.type === 'outcomes' || s.type === 'learning_outcomes' ? 'learning_outcomes' :
               s.type === 'quiz' || s.type === 'quizzes' ? 'quizzes' :
               s.type === 'why_matters' || s.type === 'why_this_matters' ? 'why_this_matters' :
               s.type === 'journey' || s.type === 'learning_journey' ? 'journey' :
               s.type === 'facilitator' || s.type === 'facilitator_guide' ? 'facilitator_guide' :
               s.type === 'engagement' || s.type === 'lesson_plan' ? 'lesson_plan' :
               s.type === 'discussion' || s.type === 'discussion_questions' ? 'discussion_questions' :
               s.type === 'practice' ? 'practice' :
               s.type === 'debugging' ? 'debugging' :
               s.type === 'ethics' ? 'ethics' :
               s.type === 'assessment' ? 'assessment' :
               (s.type || s.id);
      });
    } else {
      secIds = activeRole === 'creator'
        ? ['overview', 'learning_outcomes', 'core_content', 'exercises', 'quizzes']
        : activeRole === 'student'
        ? ['why_this_matters', 'journey', 'practice', 'debugging', 'ethics']
        : activeRole === 'educator'
        ? ['facilitator_guide', 'lesson_plan', 'rubric', 'teaching_tips', 'discussion_questions', 'assessment']
        : [];
    }
    setupScrollSpy(secIds);
    return () => { 
      if (scrollCleanupRef.current) {
        scrollCleanupRef.current();
        scrollCleanupRef.current = null;
      }
    };
  }, [activeRole, currentGeneratingLessonIdx, setupScrollSpy]);

  // Keep activeLessonId strictly synchronized with currently selected structure lesson for Edit/Save/AI Actions
  useEffect(() => {
    const structLesson = (structure || [])[currentGeneratingLessonIdx];
    const matchedLesson = courseData?.lessons?.find(l => 
      (structLesson?.id && l.id === structLesson.id) || 
      (structLesson?.title && (l.title === structLesson.title || l.title?.replace(/^Lesson\s*\d+\s*:\s*/i, '') === structLesson.title?.replace(/^Lesson\s*\d+\s*:\s*/i, '')))
    ) || courseData?.lessons?.[currentGeneratingLessonIdx];

    if (matchedLesson?.id && setActiveLessonId) {
      setActiveLessonId(matchedLesson.id);
    }
  }, [currentGeneratingLessonIdx, courseData, structure, setActiveLessonId]);

  return (
    <div>
      <div className="header" style={{ alignItems: 'flex-start', marginBottom: '24px', gap: '16px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Compact short title — use displayTitle (4-6 words) derived from promptText */}
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)', margin: 0, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {(() => {
              const full = (promptText || 'Rapid Prototyping for Real-World Impact').trim();
              const words = full.split(/\s+/);
              return words.slice(0, 7).join(' ') + (words.length > 7 ? '…' : '');
            })()}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.82rem', marginBottom: '8px' }}>Created on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>

          {/* Collapsible Prompt Accordion */}
          {promptText && (
            <div 
              style={{ 
                marginTop: '10px', 
                background: promptExpanded ? 'rgba(72,107,245,0.06)' : 'var(--surface-2)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                overflow: 'hidden', 
                maxWidth: '600px',
                transition: 'all 0.2s ease'
              }}
            >
              <button
                type="button"
                onClick={() => setPromptExpanded(v => !v)}
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '9px 14px', 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--blue)', 
                  fontSize: '0.8rem', 
                  fontWeight: 700 
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  View Original Prompt
                </span>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: promptExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', marginLeft: 'auto', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {promptExpanded && (
                <div 
                  style={{ 
                    padding: '10px 14px 14px', 
                    borderTop: '1px solid var(--border-color)', 
                    fontSize: '0.84rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: 1.6, 
                    fontStyle: 'italic', 
                    maxHeight: '180px', 
                    overflowY: 'auto',
                    background: '#ffffff'
                  }}
                >
                  "{promptText ? promptText.replace(/\[(DOMAIN|INTERACTIVITY|TOOLS REQUIRED|FINAL PROJECT|EXPLICIT OUTLINE):[^\]]*\]\n?/gi, '').trim() : ''}"
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          className="header-create-btn" 
          disabled={generationProgress < 100}
          title={generationProgress < 100 ? `Generation is ${generationProgress}% complete. Please wait…` : 'View your generated course assets'}
          style={{ 
            background: generationProgress < 100 ? 'var(--surface-3)' : 'var(--navy)', 
            color: generationProgress < 100 ? 'var(--text-muted)' : '#fff', 
            padding: '10px 20px', 
            fontSize: '0.88rem', 
            boxShadow: generationProgress < 100 ? 'none' : '0 4px 14px rgba(26, 32, 64, 0.25)', 
            flexShrink: 0, 
            whiteSpace: 'nowrap',
            cursor: generationProgress < 100 ? 'not-allowed' : 'pointer',
            opacity: generationProgress < 100 ? 0.55 : 1,
            transition: 'all 0.25s ease'
          }}
          onClick={() => {
            if (generationProgress < 100) {
              if (toast) toast.warning(`Generation is ${generationProgress}% complete. Please wait until it finishes before proceeding.`);
              return;
            }
            if (courseData) {
              setCurrentStep('generated');
            } else {
              fetch(`${API_BASE}/courses/sessions/${sessionId}`).then(res => res.json()).then(data => {
                setCourseData(data);
                if (data.lessons?.length > 0) setActiveLessonId(data.lessons[0].id);
                setCurrentStep('generated');
              });
            }
          }}
        >
          {generationProgress < 100 ? `⏳ Generating… ${generationProgress}%` : 'Proceed to Assets →'}
        </button>
      </div>

      {/* Live Progress Banner with Animated Progress Bar */}
      <div className="live-status-box" style={{ marginBottom: '24px', background: 'var(--white)', border: generationProgress >= 100 ? '1.5px solid #86EFAC' : '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '18px 24px', boxShadow: 'var(--shadow-sm)' }}>
        <div className="live-status-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="live-status-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, color: 'var(--navy)', fontSize: '0.95rem' }}>
            {generationProgress >= 100 ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#22c55e', color: '#ffffff' }}>
                <IconCheck />
              </span>
            ) : (
              <IconSpinner />
            )}
            <span style={{ color: generationProgress >= 100 ? '#16a34a' : 'var(--navy)' }}>
              {generationProgress >= 100 ? 'GENERATED:' : 'GENERATING:'}
            </span>
            <span style={{ color: generationProgress >= 100 ? '#16a34a' : 'var(--blue)' }}>
              {generationStatusText || 'Assembling Course Content...'}
            </span>
          </div>
          {generationProgress < 100 && (
            <button 
              type="button"
              className="cancel-gen-btn"
              style={{ background: 'transparent', border: '1.5px solid #F87171', color: '#EF4444', fontWeight: 700, padding: '5px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', zIndex: 10 }}
              onClick={() => setShowCancelModal(true)}
            >
              Cancel
            </button>
          )}
        </div>
        
        <div className="progress-bar-container" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="progress-bar-outer" style={{ flex: 1, height: '10px', background: 'var(--surface-3)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div className="progress-bar-inner" style={{ width: `${generationProgress}%`, height: '100%', background: generationProgress >= 100 ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(90deg, var(--navy) 0%, var(--blue) 100%)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: generationProgress >= 100 ? '#16a34a' : 'var(--navy)', minWidth: '42px', textAlign: 'right' }}>{generationProgress}%</span>
        </div>

        {/* Patient Reassurance Notice Banner (Simple & Concise Notice) */}
        {generationProgress < 100 && (
          <div style={{ marginTop: '14px', padding: '10px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#92400E', fontWeight: 600 }}>
            <span style={{ fontSize: '1.05rem' }}>⏳</span>
            <span>
              <strong>Note:</strong> AI course generation is in progress. Please wait patiently while we build your curriculum.
            </span>
          </div>
        )}
      </div>

      {/* Main Content Workspace Box */}
      <div id="step7-main-workspace" style={{ background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)', scrollMarginTop: '80px' }}>
        {/* Lesson Carousel Navigator Slider */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--surface-2)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <button 
            className="library-page-btn playful-card" 
            style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onClick={() => setCurrentGeneratingLessonIdx(Math.max(0, currentGeneratingLessonIdx - 1))}
            disabled={currentGeneratingLessonIdx === 0}
            title="Previous Lesson"
          >
            <IconChevronLeft />
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              LESSON {currentGeneratingLessonIdx + 1} OF {(structure || []).length || 1}
            </span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>
              {(() => {
                const rawTitle = (structure || [])[currentGeneratingLessonIdx]?.title || 'Crafting an Actionable AI Strategy Blueprint';
                return rawTitle.replace(/^Lesson\s*\d+\s*:\s*/i, '');
              })()}
            </h3>
          </div>

          <button 
            className="library-page-btn playful-card" 
            style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onClick={() => setCurrentGeneratingLessonIdx(Math.min(((structure || []).length || 1) - 1, currentGeneratingLessonIdx + 1))}
            disabled={currentGeneratingLessonIdx >= ((structure || []).length || 1) - 1}
            title="Next Lesson"
          >
            <IconChevronRight />
          </button>
        </div>

        {/* Role Selector Tabs (CREATOR, STUDENT, EDUCATOR) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '4px', borderRadius: '9999px', border: '1px solid var(--border-color)', gap: '4px' }}>
            <button 
              className={`tab-btn ${activeRole === 'creator' ? 'active' : ''}`}
              style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { setActiveRole('creator'); setActiveSubSection('all'); }}
            >
              <span>🎨</span> CREATOR
            </button>
            <button 
              className={`tab-btn ${activeRole === 'student' ? 'active' : ''}`}
              style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { setActiveRole('student'); setActiveSubSection('all'); }}
            >
              <span>🎓</span> STUDENT
            </button>
            <button 
              className={`tab-btn ${activeRole === 'educator' ? 'active' : ''}`}
              style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => { setActiveRole('educator'); setActiveSubSection('all'); }}
            >
              <span>🏫</span> EDUCATOR
            </button>
          </div>
        </div>

        {/* Workspace Split Layout */}
        <div className="structure-split-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Side: ON THIS PAGE Sections Navigator (Table of Contents) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'sticky', top: '90px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>ON THIS PAGE</span>
            {(() => {
              // ── Build TOC respecting user-defined section order from structure ──
              const curTocLesson = courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.[0];
              const structTocLesson = (structure || []).find(l => l.id === curTocLesson?.id || l.title === curTocLesson?.title) || (structure || [])[0];
              const structSections = structTocLesson?.sections?.[activeRole] || [];

              // Canonical label map for built-in types
              const LABEL_MAP = {
                overview: 'Lesson Overview',
                outcomes: 'Learning Outcomes', learning_outcomes: 'Learning Outcomes',
                core_content: 'Core Technical Material',
                exercises: 'Hands-On Exercises',
                quiz: 'Assessment Quiz', quizzes: 'Assessment Quiz',
                why_matters: 'Why This Matters', why_this_matters: 'Why This Matters',
                journey: 'Learning Journey',
                practice: 'Hands-on Practice & Application',
                debugging: 'Common Pitfalls & Troubleshooting',
                ethics: 'Professional Ethics & Standards',
                facilitator: 'Facilitator Guide', facilitator_guide: 'Facilitator Guide',
                engagement: 'Engagement Strategies',
                rubric: 'Assessment Rubric',
                assessment: 'Assessment & Homework',
                teaching_tips: 'Teaching Tips',
                discussion: 'Discussion Questions', discussion_questions: 'Discussion Questions',
              };

              // The DOM id prefix mapping (content DOM uses expanded keys)
              const DOM_ID_MAP = {
                outcomes: 'learning_outcomes',
                quiz: 'quizzes',
                why_matters: 'why_this_matters',
                journey: 'journey',
                facilitator: 'facilitator_guide',
                engagement: 'lesson_plan',
                discussion: 'discussion_questions',
              };

              let secList;
              if (structSections.length > 0) {
                // Use structure order; locked sections are built-ins, unlocked are custom
                secList = structSections.map(s => {
                  const domId = s.type === 'outcomes' || s.type === 'learning_outcomes' ? 'learning_outcomes' :
                                s.type === 'quiz' || s.type === 'quizzes' ? 'quizzes' :
                                s.type === 'why_matters' || s.type === 'why_this_matters' ? 'why_this_matters' :
                                s.type === 'journey' || s.type === 'learning_journey' ? 'journey' :
                                s.type === 'facilitator' || s.type === 'facilitator_guide' ? 'facilitator_guide' :
                                s.type === 'engagement' || s.type === 'lesson_plan' ? 'lesson_plan' :
                                s.type === 'discussion' || s.type === 'discussion_questions' ? 'discussion_questions' :
                                s.type === 'practice' ? 'practice' :
                                s.type === 'debugging' ? 'debugging' :
                                s.type === 'ethics' ? 'ethics' :
                                (s.type || s.id);
                  const label = LABEL_MAP[s.type] || s.title || s.type;
                  return { id: domId, title: label };
                });
              } else {
                // Fallback hardcoded order
                secList = activeRole === 'creator' ? [
                  { id: 'overview', title: 'Lesson Overview' },
                  { id: 'learning_outcomes', title: 'Learning Outcomes' },
                  { id: 'core_content', title: 'Core Technical Material' },
                  { id: 'exercises', title: 'Hands-On Exercises' },
                  { id: 'quizzes', title: 'Assessment Quiz' }
                ] : activeRole === 'student' ? [
                  { id: 'why_this_matters', title: 'Why This Matters' },
                  { id: 'journey', title: 'Learning Journey' },
                  { id: 'practice', title: 'Hands-on Practice & Application' },
                  { id: 'debugging', title: 'Common Pitfalls & Troubleshooting' },
                  { id: 'ethics', title: 'Professional Ethics & Standards' }
                ] : activeRole === 'educator' ? [
                  { id: 'facilitator_guide', title: 'Facilitator Guide' },
                  { id: 'lesson_plan', title: 'Lesson Plan & Timing' },
                  { id: 'rubric', title: 'Assessment Rubric' },
                  { id: 'teaching_tips', title: 'Teaching Tips' },
                  { id: 'discussion_questions', title: 'Discussion Questions' },
                  { id: 'assessment', title: 'Assessment & Homework' }
                ] : [];
              }

              return secList.map((sec) => (
                <button
                  key={sec.id}
                  className={`filter-nav-item ${activeSubSection === sec.id ? 'active' : ''}`}
                  style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.85rem', transition: 'all 0.2s ease' }}
                  onClick={() => {
                    setActiveSubSection(sec.id);
                    const el = document.getElementById(`step7-sec-${sec.id}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>{sec.title}</span>
                  </div>
                </button>
              ));
            })()}
          </div>

          {/* Right Side: Interactive Editable Section Viewer Card (Full Document View) */}
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', minHeight: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" fill="none" stroke="var(--navy)" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                  {activeRole === 'creator' ? 'Full Curriculum Specification (Creator View)' : activeRole === 'student' ? 'Student Learning Guide' : 'Educator Facilitator Guide'}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                <button className="icon-btn-tool" title="AI Wand Action" onClick={() => { if (!checkCanEdit('use AI Wand')) return; setIsAIWandOpen(!isAIWandOpen); }}>
                  🪄
                </button>

                {/* AI Wand Action Menu Popover */}
                {isAIWandOpen && (
                  <div style={{ position: 'absolute', top: '40px', right: '40px', width: '220px', background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, padding: '8px 0' }}>
                    <div style={{ padding: '6px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-color)' }}>
                      AI WAND ACTIONS
                    </div>
                    {[
                      { action: 'rewrite', label: '✍️ Rewrite & Refine', desc: 'Improve text clarity & flow' },
                      { action: 'expand', label: '📈 Expand Details', desc: 'Add technical examples' },
                      { action: 'simplify', label: '💡 Simplify Concepts', desc: 'Make easier to understand' }
                    ].map(item => (
                      <button
                        key={item.action}
                        style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'var(--transition-fast)' }}
                        className="filter-tag-pill"
                        onClick={() => {
                          if (!checkCanEdit('use AI Wand')) return;
                          setIsWandProcessing(true);
                          setTimeout(() => {
                            setIsWandProcessing(false);
                            setIsAIWandOpen(false);
                            if (toast) toast.success(`AI Action [${item.label}] completed successfully for this section!`);
                          }, 1200);
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>{item.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                      </button>
                    ))}
                  </div>
                )}

                <button className="icon-btn-tool" title="Version History" onClick={() => { if (!checkCanEdit('view Version History')) return; fetchHistory(); setIsHistoryOpen(true); }}>
                  📜
                </button>
              </div>
            </div>

            {/* Live Rendered Content Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(() => {
                const structTocLesson = (structure || [])[currentGeneratingLessonIdx] || (structure || [])[0];
                const curLesson = courseData?.lessons?.find(l => 
                  (structTocLesson?.id && l.id === structTocLesson.id) ||
                  (structTocLesson?.title && (l.title === structTocLesson.title || l.title?.replace(/^Lesson\s*\d+\s*:\s*/i, '') === structTocLesson.title?.replace(/^Lesson\s*\d+\s*:\s*/i, '')))
                ) || courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.[0];
                const curSecs = curLesson?.sections?.[activeRole] || {};
                const lessonTitle = curLesson?.title || courseData?.title || 'Machine Learning Essentials';

                const activeLessonContent = {
                  ...curSecs,
                  // ── Creator ──
                  overview: curSecs.overview || curSecs.project_brief || `This lesson provides a comprehensive overview and practical foundation for ${lessonTitle}. Students will explore core concepts, industry use-cases, and implementation patterns necessary for real-world projects.`,
                  learning_outcomes: curSecs.learning_outcomes?.length > 0 ? curSecs.learning_outcomes : [
                    `Master core concepts and architectural components of ${lessonTitle}.`,
                    `Implement hands-on code examples and workflows using modern industry standards.`,
                    `Apply critical thinking to analyze, debug, and optimize real-world production scenarios.`
                  ],
                  core_content: curSecs.core_content || curSecs.tech_stack || `### 1. Conceptual Foundations\n${lessonTitle} serves as a key pillar in modern systems engineering.\n\n### 2. Practical Implementation\nFollow clean architecture patterns and best practices for production-grade code.`,
                  exercises: curSecs.exercises?.length > 0 ? curSecs.exercises : [
                    { title: `Building ${lessonTitle} Pipeline`, description: `Implement a basic working prototype using Python/JavaScript.`, code_template: `// Exercise 1: ${lessonTitle}\nfunction executeTask() {\n  console.log("Running task...");\n}` }
                  ],
                  quizzes: curSecs.quizzes || curSecs.quiz || [
                    { question: `What is the primary objective of ${lessonTitle}?`, options: [`To establish a robust, scalable technical workflow`, `To bypass security and data validation`, `To reduce code readability`], answer: `To establish a robust, scalable technical workflow` }
                  ],
                  // ── Student ──
                  why_this_matters: curSecs.why_this_matters || curSecs.why_matters || `Understanding ${lessonTitle} is crucial for career advancement. It bridges theoretical principles with industry-grade implementation strategies.`,
                  practice: curSecs.practice?.code_block ? curSecs.practice : {
                    code_block: `// Interactive Sandbox for ${lessonTitle}\nfunction main() {\n  console.log("Running ${lessonTitle} sandbox...");\n}\nmain();`,
                    interactive_exercise: `Run the sandbox script and extend the function logic for ${lessonTitle}.`,
                    checklist: [`Initialize environment`, `Execute main sandbox function`, `Verify console log output`]
                  },
                  debugging: curSecs.debugging || `### Common Pitfalls & Solutions\n1. **Unhandled Edge Cases:** Validate inputs prior to execution.\n2. **Performance Bottlenecks:** Optimize data structure lookups.`,
                  ethics: curSecs.ethics || `### Code Principles & Ethics\nEnsure user data protection, transparency, and compliance with industry security protocols throughout implementation.`,
                  // ── Educator ──
                  facilitator_guide: curSecs.facilitator_guide || `### Educator Instructions\nFacilitate an interactive discussion on ${lessonTitle}. Encourage students to participate in pair-programming exercises.`,
                  lesson_plan: curSecs.lesson_plan?.ice_breaker ? curSecs.lesson_plan : {
                    ice_breaker: `Ask students: "What real-world applications of ${lessonTitle} have you encountered?"`,
                    timing: `Lecture & Demo: 20 mins | Pair Lab: 30 mins | Wrap-up & Q&A: 10 mins`
                  },
                  // Normalize rubrics → rubric (AI may return either key)
                  rubric: (curSecs.rubric?.length > 0 ? curSecs.rubric : curSecs.rubrics?.length > 0 ? curSecs.rubrics : null) || [
                    { criteria: "Implementation", excellent: "Code runs error-free with optimal logic", good: "Code runs with minor style issues", needs_improvement: "Code contains execution errors" },
                    { criteria: "Understanding", excellent: "Demonstrates deep mastery of concepts", good: "Demonstrates basic understanding", needs_improvement: "Lacks core understanding" }
                  ],
                  discussion_questions: curSecs.discussion_questions?.length > 0 ? curSecs.discussion_questions : [
                    `How does ${lessonTitle} improve overall system efficiency?`,
                    `What key trade-offs should be considered when deploying this solution to production?`
                  ],
                  teaching_tips: curSecs.teaching_tips?.length > 0 ? curSecs.teaching_tips : [
                    `For struggling students, pair them up in peer programming sessions.`,
                    `Use live demos to illustrate complex concepts.`
                  ],
                  assessment: curSecs.assessment || `Ask students to extend the practice code block and document their solution approach.`
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Creator POV Workspace (Full Document View) */}
                    {activeRole === 'creator' && (
                      <CreatorView
                        activeLessonContent={activeLessonContent}
                        sectionOrder={structTocLesson?.sections?.creator || []}
                        editingSection={editingSection}
                        setEditingSection={setEditingSection}
                        editingText={editingText}
                        setEditingText={setEditingText}
                        handleSaveManualEdit={handleSaveManualEdit}
                        renderAIActionBar={renderAIActionBar}
                        checkCanEdit={checkCanEdit}
                        toast={toast}
                        renderCustomSections={renderCustomSections}
                      />
                    )}

                    {/* Student POV Workspace (Full Document View) */}
                    {activeRole === 'student' && (
                      <StudentView
                        activeLessonContent={activeLessonContent}
                        sectionOrder={structTocLesson?.sections?.student || []}
                        editingSection={editingSection}
                        setEditingSection={setEditingSection}
                        editingText={editingText}
                        setEditingText={setEditingText}
                        handleSaveManualEdit={handleSaveManualEdit}
                        renderAIActionBar={renderAIActionBar}
                        checkCanEdit={checkCanEdit}
                        toast={toast}
                        renderCustomSections={renderCustomSections}
                      />
                    )}

                    {/* Educator POV Workspace (Full Document View) */}
                    {activeRole === 'educator' && (
                      <EducatorView
                        activeLessonContent={activeLessonContent}
                        sectionOrder={structTocLesson?.sections?.educator || []}
                        editingSection={editingSection}
                        setEditingSection={setEditingSection}
                        editingText={editingText}
                        setEditingText={setEditingText}
                        handleSaveManualEdit={handleSaveManualEdit}
                        renderAIActionBar={renderAIActionBar}
                        checkCanEdit={checkCanEdit}
                        toast={toast}
                        renderCustomSections={renderCustomSections}
                      />
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* In-App Cancel Confirmation Modal via Portal */}
      {showCancelModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(15, 23, 42, 0.7)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 99999999 
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !isCanceling) setShowCancelModal(false); }}
        >
          <div 
            style={{ 
              background: '#ffffff', 
              padding: '36px 32px', 
              borderRadius: '24px', 
              maxWidth: '440px', 
              width: '90%', 
              textAlign: 'center', 
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', 
              border: '1px solid rgba(226, 232, 240, 0.9)',
              animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)' }}>
              <svg width="28" height="28" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.02em' }}>
              Cancel Course Generation?
            </h3>
            
            <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to stop generating? Content generated so far will be saved and you will return to <strong>Step 6 Review</strong> to adjust your configuration.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button"
                style={{ 
                  flex: 1, 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  background: '#ffffff', 
                  color: '#475569', 
                  border: '1px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
                onClick={() => setShowCancelModal(false)}
                disabled={isCanceling}
              >
                Keep Generating
              </button>
              <button 
                type="button"
                style={{ 
                  flex: 1, 
                  padding: '12px 18px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                  color: '#ffffff', 
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: isCanceling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
                }}
                onClick={handleConfirmCancel}
                disabled={isCanceling}
              >
                {isCanceling ? <IconSpinner /> : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
