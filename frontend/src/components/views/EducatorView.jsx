import React, { useState, useEffect } from 'react';
import { ContentRenderer } from '../common/ContentRenderer';

export function EducatorView({
  activeLessonContent,
  sectionOrder = [],
  editingSection,
  setEditingSection,
  editingText,
  setEditingText,
  handleSaveManualEdit,
  renderAIActionBar,
  toast,
  renderCustomSections,
  checkCanEdit
}) {
  const [lessonPlanForm, setLessonPlanForm] = useState({ ice_breaker: '', timing: '' });
  const [rubricRows, setRubricRows] = useState([]);

  useEffect(() => {
    if (editingSection === 'lesson_plan') {
      const lp = activeLessonContent.lesson_plan || {};
      setLessonPlanForm({
        ice_breaker: lp.ice_breaker || '',
        timing: lp.timing || ''
      });
    }
    if (editingSection === 'rubric') {
      const r = Array.isArray(activeLessonContent.rubric) ? JSON.parse(JSON.stringify(activeLessonContent.rubric)) : [];
      setRubricRows(r);
    }
  }, [editingSection, activeLessonContent.lesson_plan, activeLessonContent.rubric]);

  const handleSaveLessonPlan = () => {
    handleSaveManualEdit('lesson_plan', lessonPlanForm);
  };

  const handleSaveRubric = () => {
    handleSaveManualEdit('rubric', rubricRows);
  };

  const updateRubricRow = (idx, field, val) => {
    setRubricRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const addRubricRow = () => {
    setRubricRows(prev => [
      ...prev,
      { criteria: 'New Criteria', excellent: 'Mastery demonstrated', good: 'Competence demonstrated', needs_improvement: 'Requires revision' }
    ]);
  };

  const removeRubricRow = (idx) => {
    setRubricRows(prev => prev.filter((_, i) => i !== idx));
  };

  const DEFAULT_ORDER = [
    { type: 'facilitator_guide', title: 'Facilitator Guide', locked: true },
    { type: 'lesson_plan', title: 'Lesson Plan & Timing', locked: true },
    { type: 'rubric', title: 'Assessment Rubric', locked: true },
    { type: 'teaching_tips', title: 'Teaching Tips', locked: true },
    { type: 'discussion_questions', title: 'Discussion Questions', locked: true },
    { type: 'assessment', title: 'Assessment & Homework', locked: true }
  ];
  const listToRender = sectionOrder && sectionOrder.length > 0 ? sectionOrder : DEFAULT_ORDER;

  const renderSection = (sec) => {
    const type = sec.type === 'facilitator' ? 'facilitator_guide' : sec.type === 'discussion' ? 'discussion_questions' : sec.type === 'engagement' ? 'lesson_plan' : sec.type;

    if (type === 'facilitator_guide') return (
      <div key="facilitator_guide" id="step7-sec-facilitator_guide" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Facilitator Guide</h3>
          {editingSection === 'facilitator_guide' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('facilitator_guide', editingText)}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Facilitator Guide')) return; setEditingSection('facilitator_guide'); setEditingText(activeLessonContent.facilitator_guide || ''); }}>Edit</button>)}
        </div>
        {editingSection === 'facilitator_guide' ? (<textarea className="prompt-textarea" style={{ minHeight: '150px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />) : (<ContentRenderer text={activeLessonContent.facilitator_guide} />)}
        {renderAIActionBar && renderAIActionBar('facilitator_guide', activeLessonContent.facilitator_guide)}
      </div>
    );

    if (type === 'lesson_plan') return (
      <div key="lesson_plan" id="step7-sec-lesson_plan" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Lesson Plan &amp; Timing</h3>
          {editingSection === 'lesson_plan' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={handleSaveLessonPlan}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Lesson Plan')) return; setEditingSection('lesson_plan'); }}>Edit</button>)}
        </div>
        {editingSection === 'lesson_plan' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)' }}>🧊 Ice Breaker Activity:</label><textarea className="prompt-textarea" style={{ minHeight: '70px', marginTop: '4px' }} value={lessonPlanForm.ice_breaker} onChange={(e) => setLessonPlanForm(prev => ({ ...prev, ice_breaker: e.target.value }))} placeholder="Ice breaker prompt or activity..." /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)' }}>⏱ Timing &amp; Session Duration:</label><input type="text" value={lessonPlanForm.timing} onChange={(e) => setLessonPlanForm(prev => ({ ...prev, timing: e.target.value }))} placeholder="e.g. 10m Opening | 35m Practice | 15m Q&A" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '4px', fontSize: '0.88rem' }} /></div>
          </div>
        ) : (
          <div className="lesson-plan-grid">
            <div className="lesson-plan-card"><h4>🧊 Ice Breaker</h4><p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.ice_breaker || 'No ice breaker prompt defined.'}</p></div>
            <div className="lesson-plan-card"><h4>⏱ Timing Allocation</h4><p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.timing || '60 mins total duration'}</p></div>
          </div>
        )}
      </div>
    );

    if (type === 'rubric') return (
      <div key="rubric" id="step7-sec-rubric" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Grading Rubric</h3>
          {editingSection === 'rubric' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={handleSaveRubric}>Save All</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Rubric')) return; setEditingSection('rubric'); }}>Edit</button>)}
        </div>
        {editingSection === 'rubric' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rubricRows.map((row, idx) => (
              <div key={idx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input type="text" placeholder="Criteria Name" value={row.criteria || ''} onChange={(e) => updateRubricRow(idx, 'criteria', e.target.value)} style={{ fontWeight: 700, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', flex: 1, marginRight: '10px' }} />
                  <button type="button" onClick={() => removeRubricRow(idx)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>✕ Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green)' }}>Excellent (A):</label><textarea value={row.excellent || ''} onChange={(e) => updateRubricRow(idx, 'excellent', e.target.value)} style={{ width: '100%', minHeight: '50px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', marginTop: '2px' }} /></div>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-orange)' }}>Good (B):</label><textarea value={row.good || ''} onChange={(e) => updateRubricRow(idx, 'good', e.target.value)} style={{ width: '100%', minHeight: '50px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', marginTop: '2px' }} /></div>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-red)' }}>Needs Improvement:</label><textarea value={row.needs_improvement || ''} onChange={(e) => updateRubricRow(idx, 'needs_improvement', e.target.value)} style={{ width: '100%', minHeight: '50px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem', marginTop: '2px' }} /></div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addRubricRow} className="ai-pill-btn" style={{ alignSelf: 'flex-start', background: '#eff6ff', color: 'var(--blue)', border: '1px solid #bfdbfe', padding: '6px 14px', fontWeight: 700 }}>+ Add Criteria</button>
          </div>
        ) : (
          <table className="rubric-table">
            <thead><tr><th>Criteria</th><th>Excellent</th><th>Good</th><th>Needs Improvement</th></tr></thead>
            <tbody>{(Array.isArray(activeLessonContent.rubric) ? activeLessonContent.rubric : []).map((row, idx) => (<tr key={idx}><td>{row.criteria}</td><td style={{ color: 'var(--accent-green)' }}>{row.excellent}</td><td style={{ color: 'var(--accent-orange)' }}>{row.good}</td><td style={{ color: 'var(--accent-red)' }}>{row.needs_improvement}</td></tr>))}</tbody>
          </table>
        )}
      </div>
    );

    if (type === 'teaching_tips') return activeLessonContent.teaching_tips?.length > 0 ? (
      <div key="teaching_tips" id="step7-sec-teaching_tips" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <h3 style={{ marginBottom: '10px' }}>💡 Teaching Tips</h3>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeLessonContent.teaching_tips.map((tip, idx) => (<li key={idx} style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{tip}</li>))}
        </ul>
      </div>
    ) : null;

    if (type === 'discussion_questions') return (
      <div key="discussion_questions" id="step7-sec-discussion_questions" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Discussion Questions</h3>
          {editingSection === 'discussion_questions' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('discussion_questions', editingText.split('\n').filter(Boolean))}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Discussion Questions')) return; setEditingSection('discussion_questions'); setEditingText(Array.isArray(activeLessonContent.discussion_questions) ? activeLessonContent.discussion_questions.join('\n') : String(activeLessonContent.discussion_questions || '')); }}>Edit</button>)}
        </div>
        {editingSection === 'discussion_questions' ? (<div><p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Enter one question per line:</p><textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="One question per line..." /></div>) : (<ol className="discussion-list">{(Array.isArray(activeLessonContent.discussion_questions) ? activeLessonContent.discussion_questions : (typeof activeLessonContent.discussion_questions === 'string' ? [activeLessonContent.discussion_questions] : [])).map((item, idx) => (<li key={idx}>{item}</li>))}</ol>)}
      </div>
    );

    if (type === 'assessment') return activeLessonContent.assessment ? (
      <div key="assessment" id="step7-sec-assessment" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>📝 Assessment &amp; Homework</h3>
          {editingSection === 'assessment' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('assessment', editingText)}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Assessment')) return; setEditingSection('assessment'); setEditingText(activeLessonContent.assessment || ''); }}>Edit</button>)}
        </div>
        {editingSection === 'assessment' ? (<textarea className="prompt-textarea" style={{ minHeight: '100px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />) : (<div style={{ padding: '14px 18px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--blue)', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-main)' }}>{activeLessonContent.assessment}</div>)}
      </div>
    ) : null;

    // Custom unlocked sections
    if (!sec.locked) {
      const rawContent = activeLessonContent[sec.type];
      const secContent = (rawContent && typeof rawContent === 'string' && !rawContent.includes('is not generated yet')) ? rawContent : (typeof rawContent === 'object' && rawContent !== null ? rawContent : `This section provides detailed instructional support for **${sec.title}**.`);
      
      let cleanContent = secContent;
      if (typeof cleanContent === 'string') {
        const escapedTitle = sec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleanContent = cleanContent.replace(new RegExp(`^#{1,6}\\s*${escapedTitle}\\s*\\n*`, 'i'), '').trim();
      }

      const isEditing = editingSection === sec.type;
      return (
        <div key={sec.type} id={`step7-sec-${sec.type}`} className="content-block" style={{ scrollMarginTop: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>{sec.title}</h3>
            {isEditing ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit(sec.type, editingText)}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { setEditingSection(sec.type); setEditingText(typeof cleanContent === 'string' ? cleanContent : JSON.stringify(cleanContent, null, 2)); }}>Edit</button>)}
          </div>
          {isEditing ? (<textarea className="prompt-textarea" style={{ minHeight: '150px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />) : (<ContentRenderer text={cleanContent} />)}
          {renderAIActionBar && renderAIActionBar(sec.type, cleanContent)}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {listToRender.map((sec) => <React.Fragment key={sec.type || sec.id}>{renderSection(sec)}</React.Fragment>)}
    </>
  );
}

