import React, { useState, useEffect } from 'react';
import { IconPlus } from '../icons/Icons';
import { ContentRenderer } from '../common/ContentRenderer';
import { CreatorView } from '../views/CreatorView';
import { StudentView } from '../views/StudentView';
import { EducatorView } from '../views/EducatorView';

function SlideGenerationLoader({ lessonTitle }) {
  const [progress, setProgress] = useState(18);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: "Analyzing Lesson Concept & Keywords", desc: "Structuring pedagogical depth and slide hierarchy" },
    { title: "Composing 6 High-Impact Slide Types", desc: "Title, Agenda, Outcomes, Core Theory, Code, Narration" },
    { title: "Styling 3 Themes (Corporate, Creative, Clean)", desc: "Applying color palettes, typography, and contrast tokens" },
    { title: "Writing Full Educator Narration Script", desc: "Creating word-by-word spoken notes for instructors" }
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev < 40) return prev + 3.5;
        if (prev < 75) return prev + 2;
        if (prev < 90) return prev + 0.6;
        return Math.min(prev + 0.15, 95);
      });
    }, 350);

    const stepTimer = setInterval(() => {
      setActiveStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2400);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, []);

  const slidePreviews = [
    { id: 1, type: "Title Slide", icon: "🏷️", desc: "Cover, Title & Subtitle", bg: "linear-gradient(135deg, #1e293b, #0f172a)" },
    { id: 2, type: "Agenda / TOC", icon: "📑", desc: "Key Topic Breakdown", bg: "linear-gradient(135deg, #1e3a5f, #0f172a)" },
    { id: 3, type: "Learning Goals", icon: "🎯", desc: "Core Competencies", bg: "linear-gradient(135deg, #14324f, #0c2035)" },
    { id: 4, type: "Technical Deep-Dive", icon: "💡", desc: "Architectures & Workflows", bg: "linear-gradient(135deg, #1f2d3d, #111827)" },
    { id: 5, type: "Interactive Sandbox", icon: "💻", desc: "Code Snippet & Exercises", bg: "linear-gradient(135deg, #182635, #0a101d)" },
    { id: 6, type: "Speaker Script", icon: "🎙️", desc: "Educator Voiceover Notes", bg: "linear-gradient(135deg, #2a203c, #130f1e)" },
  ];

  return (
    <div style={{ padding: '24px 16px', maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
      {/* Top Floating Magic Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 22px', background: 'rgba(233, 178, 89, 0.15)', border: '1.5px solid var(--gold)', borderRadius: '30px', marginBottom: '18px', boxShadow: '0 4px 14px rgba(233, 178, 89, 0.25)' }}>
        <span className="hourglass-animated" style={{ fontSize: '1.25rem' }}>⏳</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', letterSpacing: '0.04em' }}>
          AI PRESENTATION STUDIO ACTIVE
        </span>
        <span className="spin" style={{ display: 'inline-block', fontSize: '0.95rem' }}>✨</span>
      </div>

      {/* Main Title & Subtitle */}
      <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--navy)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
        Generating Your Lesson Slide Deck
      </h2>
      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
        Creating multi-theme interactive slides and full educator narration notes for: <br />
        <strong style={{ color: 'var(--navy)', fontWeight: 800 }}>{lessonTitle}</strong>
      </p>

      {/* Live Animated Progress Bar Card */}
      <div style={{ background: 'var(--white)', padding: '18px 24px', borderRadius: '16px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-md)', marginBottom: '24px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="spin">⚡</span> {steps[activeStep]?.title}
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--blue)' }}>
            {Math.round(progress)}%
          </span>
        </div>

        <div style={{ width: '100%', height: '10px', background: 'var(--surface-3)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--gold) 0%, var(--blue) 50%, #6366f1 100%)',
              borderRadius: '999px',
              transition: 'width 0.35s ease',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
            }}
          />
        </div>
        <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {steps[activeStep]?.desc}
        </div>
      </div>

      {/* 6 Mini Slide Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {slidePreviews.map((slide, idx) => {
          const isCompiling = activeStep === Math.min(idx, steps.length - 1);
          const isDone = activeStep > Math.min(idx, steps.length - 1);
          return (
            <div
              key={slide.id}
              style={{
                background: slide.bg,
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'left',
                color: '#fff',
                border: isCompiling ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.14)',
                boxShadow: isCompiling ? '0 8px 24px rgba(233, 178, 89, 0.35)' : '0 4px 12px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                transform: isCompiling ? 'translateY(-2px)' : 'none'
              }}
            >
              {isCompiling && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--gold)' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{slide.icon}</span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isDone ? 'rgba(34, 197, 94, 0.25)' : isCompiling ? 'rgba(233, 178, 89, 0.3)' : 'rgba(255,255,255,0.1)',
                  color: isDone ? '#4ade80' : isCompiling ? 'var(--gold)' : 'rgba(255,255,255,0.6)'
                }}>
                  {isDone ? '✓ READY' : isCompiling ? '⚡ COMPILING' : `SLIDE 0${slide.id}`}
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {slide.type}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                {slide.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reassurance Footer Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 20px', background: 'rgba(72, 107, 245, 0.08)', borderRadius: '12px', border: '1px solid rgba(72, 107, 245, 0.2)', fontSize: '0.82rem', color: 'var(--navy)', fontWeight: 600 }}>
        <span style={{ fontSize: '1.1rem' }}>💡</span>
        <span>Slides include 3 interchangeable themes: <strong>Corporate Bold</strong>, <strong>Creative Dark</strong>, and <strong>Clean Minimal</strong>.</span>
      </div>
    </div>
  );
}

export function Step8Generated({
  courseData,
  goToDashboard,
  openPov,
  setOpenPov,
  activeRole,
  setActiveRole,
  activeLessonId,
  setActiveLessonId,
  isPptxPage,
  setIsPptxPage,
  pptxDataByLesson,
  activePptxLessonId,
  setActivePptxLessonId,
  pptxSlideIndex,
  setPptxSlideIndex,
  pdfBlobUrl,
  handleGenerateLessonPptx,
  pptxLoading,
  handleDownloadLessonPptx,
  pptxData,
  pptxLayout,
  setPptxLayout,
  currentPptxSlides,
  currentPptxSlide,
  setExportFormat,
  setIsExportModalOpen,
  sessionId,
  API_BASE,
  pdfZoom
}) {
  return (
    <div>
      <div className="header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: 'var(--navy)', fontWeight: 800 }}>Your Course is Ready!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Generation complete. All content units and assets are ready for download.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="action-btn" onClick={goToDashboard}><IconPlus /> New Course</button>
        </div>
      </div>

      <div className="structure-split-layout" style={{ display: 'grid', gridTemplateColumns: '1.1fr 2.5fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Column: Assets Checklist Sidebar */}
        <div className="assets-checklist-sidebar">
          <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '4px' }}>Assets Checklist</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Preview and download generated documents.
          </p>

          {['creator', 'student', 'educator'].map((role) => {
            const isExpanded = openPov === role;
            const roleLabel = role === 'creator' ? 'Creator PDF' : role === 'student' ? 'Student PDF' : 'Educator PDF';
            const roleIcon = role === 'creator' ? '🎨' : role === 'student' ? '🎓' : '🏫';
            
            return (
              <div key={role} className="assets-menu-group">
                <button
                  type="button"
                  className={`assets-group-header-accordion ${isExpanded ? 'active' : ''}`}
                  onClick={() => {
                    const nextPov = isExpanded ? null : role;
                    setOpenPov(nextPov);
                    if (nextPov) {
                      setActiveRole(nextPov);
                      if (courseData.lessons?.length > 0 && !activeLessonId) {
                        setActiveLessonId(courseData.lessons[0].id);
                      }
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.05rem' }}>{roleIcon}</span>
                    <span>{roleLabel}</span>
                  </div>
                  <span className="assets-group-badge">
                    {courseData.lessons?.length || 0} lessons
                  </span>
                </button>

                {isExpanded && (
                  <div className="assets-accordion-content">
                    {courseData.lessons?.map((lesson, idx) => (
                      <button
                        key={`${role}-${lesson.id}`}
                        className={`assets-lesson-btn ${activeRole === role && activeLessonId === lesson.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveRole(role);
                          setActiveLessonId(lesson.id);
                          setIsPptxPage(false);
                        }}
                      >
                        <span style={{ fontWeight: 700 }}>L0{idx + 1}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lesson.title.replace(/^Lesson\s*\d+\s*[:\-\.]*\s*/i, '')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="assets-menu-group">
            <button
              type="button"
              className={`assets-group-header-accordion ${openPov === 'pptx' ? 'active' : ''}`}
              onClick={() => {
                const nextPov = openPov === 'pptx' ? null : 'pptx';
                setOpenPov(nextPov);
                if (nextPov) {
                  setIsPptxPage(true);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.05rem' }}>📊</span>
                <span>Lesson Slides</span>
              </div>
              <span className="assets-group-badge">
                {Object.keys(pptxDataByLesson).length} generated
              </span>
            </button>

            {openPov === 'pptx' && (
              <div className="assets-accordion-content">
                {courseData.lessons?.map((lesson, idx) => {
                  const lessonPptx = pptxDataByLesson[lesson.id];
                  const isActive = activePptxLessonId === lesson.id;
                  const hasPptx = !!lessonPptx;
                  return (
                    <div
                      key={`pptx-${lesson.id}`}
                      className={`assets-lesson-btn ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActivePptxLessonId(lesson.id);
                        setIsPptxPage(true);
                        setPptxSlideIndex(0);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 12px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: hasPptx ? 'var(--green)' : 'var(--text-secondary)' }}>
                          {hasPptx ? '✓' : `L0${idx + 1}`}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{lesson.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {!hasPptx && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateLessonPptx(lesson.id);
                            }}
                            disabled={pptxLoading}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'var(--navy)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: pptxLoading ? 'wait' : 'pointer' }}
                          >
                            {pptxLoading && activePptxLessonId === lesson.id ? (
                              <span className="hourglass-animated" style={{ fontSize: '0.85rem' }}>⏳</span>
                            ) : (
                              '⚡'
                            )}
                          </button>
                        )}
                        {hasPptx && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadLessonPptx(lesson.id);
                            }}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'var(--green)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            📥
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Document Viewer OR PPT Page */}
        {isPptxPage && (
          <div style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--surface-1)', overflow: 'hidden' }}>
            {/* 1. Active PPT Loading Screen */}
            {pptxLoading && activePptxLessonId && (
              <SlideGenerationLoader 
                lessonTitle={courseData.lessons?.find(l => l.id === activePptxLessonId)?.title || 'Selected Lesson'} 
              />
            )}

            {/* 2. Ready to Generate (Not Loading, No Data Yet) */}
            {!pptxData && !pptxLoading && activePptxLessonId && (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                <h3 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Lesson Slide Generator</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                  {courseData.lessons?.find(l => l.id === activePptxLessonId)?.title || 'Selected Lesson'}
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Click below to generate presentation slides for this lesson.</p>
                <button onClick={() => handleGenerateLessonPptx(activePptxLessonId)} disabled={pptxLoading}
                  style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--navy), var(--blue))', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(26,32,64,0.3)' }}>
                  ⚡ Generate Slides for This Lesson
                </button>
              </div>
            )}

            {/* 3. Empty State (No Lesson Selected) */}
            {!pptxData && !pptxLoading && !activePptxLessonId && (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                <h3 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Lesson Slide Generator</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Select a lesson from the sidebar to generate slides.</p>
              </div>
            )}
            {pptxData && (
              <>
                {/* PPT Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>Layout:</span>
                    <select value={pptxLayout} onChange={e => { setPptxLayout(e.target.value); setPptxSlideIndex(0); }}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', background: 'var(--surface-1)', color: 'var(--navy)' }}>
                      <option value="layout_1">Layout 1 — Corporate Bold</option>
                      <option value="layout_2">Layout 2 — Creative</option>
                      <option value="layout_3">Layout 3 — Clean Minimal</option>
                    </select>
                    {activePptxLessonId && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px', padding: '4px 8px', background: 'var(--surface-1)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        {courseData.lessons?.find(l => l.id === activePptxLessonId)?.title || 'Lesson'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleDownloadLessonPptx(activePptxLessonId)}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--navy)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                      📥 Download
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', overflow: 'hidden' }}>
                <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <button onClick={() => setPptxSlideIndex(i => Math.max(0, i - 1))} disabled={pptxSlideIndex === 0}
                      style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: pptxSlideIndex === 0 ? '#333' : 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: pptxSlideIndex === 0 ? 'not-allowed' : 'pointer' }}>
                      ◀ Prev
                    </button>
                    <span style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 600 }}>Slide {pptxSlideIndex + 1} / {currentPptxSlides.length}</span>
                    <button onClick={() => setPptxSlideIndex(i => Math.min(currentPptxSlides.length - 1, i + 1))} disabled={pptxSlideIndex >= currentPptxSlides.length - 1}
                      style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: pptxSlideIndex >= currentPptxSlides.length - 1 ? '#333' : 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: pptxSlideIndex >= currentPptxSlides.length - 1 ? 'not-allowed' : 'pointer' }}>
                      Next ▶
                    </button>
                  </div>
                  {currentPptxSlide && (() => {
                    const stripMarkdown = (str) => {
                      if (!str) return '';
                      return String(str)
                        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                        .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
                        .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
                        .replace(/`([^`]+)`/g, '$1')
                        .replace(/^\s*#{1,6}\s*/g, '')
                        .replace(/^\s*[\-\*\•]\s*/g, '')
                        .trim();
                    };

                    const theme = pptxData.layouts?.[pptxLayout]?.theme || {};
                    const isLayout1 = pptxLayout === 'layout_1';
                    const isLayout2 = pptxLayout === 'layout_2';
                    const isLayout3 = pptxLayout === 'layout_3';
                    const bgColor = isLayout3 ? '#ffffff' : isLayout2 ? '#141e32' : theme.primary || '#1a202c';
                    const textColor = isLayout3 ? theme.text || '#1a202c' : '#fff';
                    const accentColor = theme.accent || '#d69e2e';
                    return (
                      <div style={{
                          background: bgColor,
                          borderRadius: '8px',
                          padding: '24px 32px',
                          height: '360px',
                          width: '640px',
                          maxWidth: '100%',
                          margin: '0 auto',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          position: 'relative',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                          userSelect: 'none'
                      }}>
                        {isLayout2 && <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: accentColor, opacity: 0.15 }}></div>}
                        {isLayout3 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: accentColor }}></div>}
                        {currentPptxSlide.type === 'title' && (
                          <div style={{ textAlign: 'center' }}>
                            {isLayout1 && <div style={{ width: '100%', height: '4px', background: accentColor, position: 'absolute', top: 0, left: 0 }}></div>}
                            <h1 style={{ color: textColor, fontSize: '2rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripMarkdown(currentPptxSlide.title)}</h1>
                            {currentPptxSlide.subtitle && (
                              <>
                                <div style={{ width: isLayout3 ? '60px' : '80px', height: isLayout3 ? '2px' : '4px', background: accentColor, margin: '0 auto 14px', borderRadius: '2px' }}></div>
                                <p style={{ color: accentColor, fontSize: '1.05rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripMarkdown(currentPptxSlide.subtitle)}</p>
                              </>
                            )}
                          </div>
                        )}
                        {currentPptxSlide.type === 'toc' && (
                          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h2 style={{ color: textColor, fontSize: '1.45rem', fontWeight: 800, marginBottom: '8px' }}>{stripMarkdown(currentPptxSlide.title)}</h2>
                            <div style={{ width: isLayout3 ? '40px' : '60px', height: isLayout3 ? '2px' : '3px', background: accentColor, marginBottom: '14px', borderRadius: '2px' }}></div>
                            {(currentPptxSlide.items || []).slice(0, 5).map((item, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                {!isLayout3 && <div style={{ width: isLayout2 ? '8px' : '10px', height: isLayout2 ? '8px' : '10px', borderRadius: isLayout2 ? '50%' : '2px', background: accentColor, flexShrink: 0 }}></div>}
                                <p style={{ color: isLayout3 ? (theme.text || '#1a202c') : '#ccc', fontSize: '0.92rem', paddingLeft: isLayout3 ? '12px' : 0, borderLeft: isLayout3 ? `2px solid ${accentColor}` : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{isLayout3 ? `— ${stripMarkdown(item)}` : stripMarkdown(item)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {currentPptxSlide.type === 'lesson_title' && (
                          <div style={{ paddingLeft: isLayout1 ? '16px' : 0, borderLeft: isLayout1 ? `5px solid ${accentColor}` : 'none' }}>
                            {isLayout2 && <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: accentColor, opacity: 0.1 }}></div>}
                            <h2 style={{ color: textColor, fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripMarkdown(currentPptxSlide.title)}</h2>
                            {currentPptxSlide.subtitle && <p style={{ color: accentColor, fontSize: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripMarkdown(currentPptxSlide.subtitle)}</p>}
                            {isLayout3 && <div style={{ width: '50px', height: '2px', background: accentColor, marginTop: '12px' }}></div>}
                          </div>
                        )}
                        {currentPptxSlide.type === 'content' && (
                          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h2 style={{ color: textColor, fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stripMarkdown(currentPptxSlide.title)}</h2>
                            <div style={{ width: isLayout3 ? '30px' : '50px', height: isLayout3 ? '2px' : '3px', background: accentColor, marginBottom: '12px', borderRadius: '2px' }}></div>
                            {(currentPptxSlide.bullets || []).slice(0, 4).map((bullet, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                {!isLayout3 && <div style={{ width: isLayout2 ? '6px' : '8px', height: isLayout2 ? '6px' : '8px', borderRadius: isLayout2 ? '50%' : '2px', background: accentColor, marginTop: '6px', flexShrink: 0 }}></div>}
                                <p style={{ color: isLayout3 ? (theme.text || '#1a202c') : '#ddd', fontSize: '0.88rem', lineHeight: 1.35, paddingLeft: isLayout3 ? '12px' : 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', margin: 0 }}>{isLayout3 ? `— ${stripMarkdown(bullet)}` : stripMarkdown(bullet)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {currentPptxSlide.type === 'code' && (
                          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h2 style={{ color: textColor, fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stripMarkdown(currentPptxSlide.title)}</h2>
                            <pre style={{ background: isLayout3 ? '#f0f0f5' : isLayout2 ? 'rgba(15,25,45,0.8)' : 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', color: isLayout3 ? '#28283c' : '#00c878', fontFamily: 'Courier New, monospace', fontSize: '0.72rem', lineHeight: 1.4, overflow: 'hidden', height: '210px', wordBreak: 'break-all', border: isLayout3 ? '1px solid #d0d0da' : isLayout2 ? `1px solid ${accentColor}40` : 'none', margin: 0 }}>{currentPptxSlide.code}</pre>
                          </div>
                        )}
                        {currentPptxSlide.type === 'end' && (
                          <div style={{ textAlign: 'center' }}>
                            {isLayout2 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '200px', height: '200px', borderRadius: '50%', background: accentColor, opacity: 0.1 }}></div>}
                            <h1 style={{ color: textColor, fontSize: '2.4rem', fontWeight: 800, marginBottom: '10px', position: 'relative' }}>{stripMarkdown(currentPptxSlide.title)}</h1>
                            <div style={{ width: isLayout3 ? '60px' : '80px', height: isLayout3 ? '2px' : '4px', background: accentColor, margin: '0 auto 14px', borderRadius: '2px', position: 'relative' }}></div>
                            <p style={{ color: accentColor, fontSize: '1.05rem', position: 'relative', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stripMarkdown(currentPptxSlide.subtitle)}</p>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: '10px', right: '16px', color: isLayout3 ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600 }}>{pptxSlideIndex + 1}</div>
                      </div>
                    );
                  })()}
                </div>
                {currentPptxSlide && currentPptxSlide.notes && (
                  <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--blue)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🎙️</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--navy)' }}>Educator Narration Script &amp; Speaker Notes</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--blue)' }}>
                        Full Spoken Script
                      </span>
                    </div>
                    <p style={{ color: 'var(--navy-deep, #1e293b)', fontSize: '0.92rem', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                      {currentPptxSlide.notes}
                    </p>
                  </div>
                )}
                </div>
              </>
            )}
          </div>
        )}

        {!isPptxPage && (() => {
          const curLesson = courseData.lessons?.find(l => l.id === activeLessonId) || courseData.lessons?.[0] || {};
          const lessonTitle = curLesson?.title || courseData?.title || 'Machine Learning Essentials';
          const dbSections = curLesson?.sections?.[activeRole] || {};

          const activeLessonContent = {
            ...dbSections,
            overview: dbSections.overview || dbSections.project_brief || `This lesson provides a comprehensive overview and practical foundation for ${lessonTitle}. Students will explore core concepts, industry use-cases, and implementation patterns necessary for real-world projects.`,
            learning_outcomes: dbSections.learning_outcomes?.length > 0 ? dbSections.learning_outcomes : [
              `Master core concepts and architectural components of ${lessonTitle}.`,
              `Implement hands-on code examples and workflows using modern industry standards.`,
              `Apply critical thinking to analyze, debug, and optimize real-world production scenarios.`
            ],
            core_content: dbSections.core_content || dbSections.tech_stack || `### 1. Conceptual Foundations\n${lessonTitle} serves as a key pillar in modern systems engineering. By leveraging structured workflows and robust error handling, developers can ensure high performance and maintainability.\n\n### 2. Practical Implementation\nTo implement ${lessonTitle} effectively, engineers must follow clean architecture patterns and best practices. Below is the step-by-step guidance for applying these techniques in production environments.`,
            exercises: dbSections.exercises?.length > 0 ? dbSections.exercises : [
              { title: `Building ${lessonTitle} Pipeline`, description: `Implement a basic working prototype for ${lessonTitle} using Python/JavaScript. Verify output correctness with unit tests.`, code_template: `// Exercise 1: ${lessonTitle}\nfunction executeTask() {\n  console.log("Running task for ${lessonTitle}...");\n}` }
            ],
            quizzes: dbSections.quizzes || dbSections.quiz || [
              { question: `What is the primary objective of ${lessonTitle}?`, options: [`To establish a robust, scalable technical workflow`, `To bypass security and data validation`, `To reduce code readability`], answer: `To establish a robust, scalable technical workflow`, explanation: `${lessonTitle} focuses on building reliable, industry-standard systems.` }
            ],
            why_this_matters: dbSections.why_this_matters || `Understanding ${lessonTitle} is crucial for career advancement. It bridges theoretical principles with industry-grade implementation strategies.`,
            practice: dbSections.practice?.code_block ? dbSections.practice : {
              code_block: `// Interactive Sandbox for ${lessonTitle}\nfunction main() {\n  console.log("Running ${lessonTitle} sandbox...");\n}\nmain();`,
              interactive_exercise: `Run the sandbox script and extend the function logic for ${lessonTitle}.`,
              checklist: [`Initialize environment`, `Execute main sandbox function`, `Verify console log output`]
            },
            debugging: dbSections.debugging || `### Common Pitfalls & Solutions\n1. **Unhandled Edge Cases:** Validate inputs prior to execution.\n2. **Performance Bottlenecks:** Optimize data structure lookups.`,
            ethics: dbSections.ethics || `### Code Principles & Ethics\nEnsure user data protection, transparency, and compliance with industry security protocols throughout implementation.`,
            facilitator_guide: dbSections.facilitator_guide || `### Educator Instructions\nFacilitate an interactive discussion on ${lessonTitle}. Encourage students to participate in pair-programming exercises.`,
            lesson_plan: dbSections.lesson_plan?.ice_breaker ? dbSections.lesson_plan : {
              ice_breaker: `Ask students: "What real-world applications of ${lessonTitle} have you encountered?"`,
              timing: `Lecture & Demo: 20 mins | Pair Lab: 30 mins | Wrap-up & Q&A: 10 mins`
            },
            rubric: dbSections.rubric?.length > 0 ? dbSections.rubric : [
              { criteria: "Implementation", excellent: "Code runs error-free with optimal logic", good: "Code runs with minor style issues", needs_improvement: "Code contains execution errors" },
              { criteria: "Understanding", excellent: "Demonstrates deep mastery of concepts", good: "Demonstrates basic understanding", needs_improvement: "Lacks core understanding" }
            ],
            discussion_questions: dbSections.discussion_questions?.length > 0 ? dbSections.discussion_questions : [
              `How does ${lessonTitle} improve overall system efficiency?`,
              `What key trade-offs should be considered when deploying this solution to production?`
            ]
          };

          const currentLessonIndex = courseData.lessons?.findIndex(l => l.id === activeLessonId);
          const lessonNumber = (currentLessonIndex !== undefined && currentLessonIndex !== -1) ? currentLessonIndex + 1 : 1;

          return (
            <div>
              {/* Document Viewer Header */}
              <div className="viewer-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
                <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem' }}>
                  Lesson {lessonNumber} of {courseData.lessons?.length || 1} &middot; {curLesson?.title || 'Document Preview'} ({activeRole.toUpperCase()} POV)
                </div>
                <div>
                  <button 
                    className="purple-start-btn" 
                    style={{ fontSize: '0.85rem', padding: '8px 18px', gap: '6px', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)' }} 
                    onClick={() => { setExportFormat('pdf'); setIsExportModalOpen(true); }} 
                    title="Download Options (PDF, Word, MD, HTML, ZIP)"
                  >
                    Download Assets &rarr;
                  </button>
                </div>
              </div>

              {/* Real Native PDF Embed */}
              {sessionId ? (
                <div id="internal-document-container" style={{ background: '#525659', borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '12px', border: '1px solid var(--border-color)', borderTop: 'none', overflow: 'hidden' }}>
                  {(() => {
                    const cleanTitle = (courseData?.title || 'Course').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
                    const embedFilename = `${cleanTitle}_${activeRole.toLowerCase()}.pdf`;
                    const embedSrc = pdfBlobUrl || `${API_BASE}/courses/${sessionId}/export/${embedFilename}?format=pdf&role=${activeRole.toLowerCase()}${activeLessonId ? `&lesson_id=${activeLessonId}` : ''}&disposition=inline#toolbar=1`;
                    
                    return (
                      <embed
                        key={embedSrc}
                        id="pdf-embed"
                        type="application/pdf"
                        src={embedSrc}
                        width="100%"
                        height="850px"
                        style={{
                          border: 'none',
                          borderRadius: '4px',
                          background: '#FFFFFF',
                          display: 'block',
                          transform: `scale(${pdfZoom / 100})`,
                          transformOrigin: 'top center',
                          transition: 'transform 0.15s ease-out'
                        }}
                      />
                    );
                  })()}
                </div>
              ) : (
                <div className="pdf-paper-canvas" style={{ position: 'relative' }}>
                  {/* PDF Header Watermark */}
                  <div className="pdf-header-watermark">
                    <span>Maxy Academy &middot; Curricula AI</span>
                    <span>{courseData.title || 'Practical AI and Regulatory Foundations'}</span>
                  </div>

                  {/* Document Content */}
                  <div className="pdf-body">
                    {/* Title Header */}
                    <div style={{ marginBottom: '30px' }}>
                      <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {activeRole.toUpperCase()} POV MATERIALS
                      </span>
                      <h1 style={{ fontSize: '1.65rem', color: 'var(--navy)', marginTop: '4px', fontWeight: 800 }}>
                        Lesson {lessonNumber}: {(curLesson?.title || '').replace(/^Lesson\s*\d+\s*:\s*/i, '')}
                      </h1>
                    </div>

                    <div className="editor-panel" style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none', minHeight: 'auto' }}>
                      {(() => {
                        const structLesson = (courseData?.structure || []).find(l =>
                          (curLesson?.id && l.id === curLesson.id) ||
                          (curLesson?.order && l.order === curLesson.order) ||
                          (curLesson?.title && (l.title === curLesson.title || l.title?.replace(/^Lesson\s*\d+\s*:\s*/i, '') === curLesson.title?.replace(/^Lesson\s*\d+\s*:\s*/i, '')))
                        );

                        return (
                          <>
                            {/* Creator POV */}
                            {activeRole === 'creator' && (
                              <CreatorView
                                activeLessonContent={activeLessonContent}
                                sectionOrder={structLesson?.sections?.creator || []}
                                checkCanEdit={() => false}
                              />
                            )}

                            {/* Student POV */}
                            {activeRole === 'student' && (
                              <StudentView
                                activeLessonContent={activeLessonContent}
                                sectionOrder={structLesson?.sections?.student || []}
                                checkCanEdit={() => false}
                              />
                            )}

                            {/* Educator POV */}
                            {activeRole === 'educator' && (
                              <EducatorView
                                activeLessonContent={activeLessonContent}
                                sectionOrder={structLesson?.sections?.educator || []}
                                checkCanEdit={() => false}
                              />
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* PDF Footer Page */}
                  <div className="pdf-footer-page">
                    <span>Confidential &middot; For Educational Use Only</span>
                    <span>Page {lessonNumber} of {courseData.lessons?.length || 1}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}