import React, { useState, useEffect } from 'react';
import { ContentRenderer } from '../common/ContentRenderer';

function SectionOverview({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, renderAIActionBar, checkCanEdit }) {
  return (
    <div id="step7-sec-overview" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Lesson Overview</h3>
        {editingSection === 'overview' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('overview', editingText)}>Save</button>
            <button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button>
          </div>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Overview')) return; setEditingSection('overview'); setEditingText(c.overview || ''); }}>Edit</button>
        )}
      </div>
      {editingSection === 'overview' ? (
        <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
      ) : (
        <ContentRenderer text={c.overview} />
      )}
      {renderAIActionBar && renderAIActionBar('overview', c.overview)}
    </div>
  );
}

function SectionLearningOutcomes({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, checkCanEdit }) {
  return (
    <div id="step7-sec-learning_outcomes" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Learning Outcomes</h3>
        {editingSection === 'learning_outcomes' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('learning_outcomes', editingText.split('\n').filter(Boolean))}>Save</button>
            <button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button>
          </div>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Learning Outcomes')) return; setEditingSection('learning_outcomes'); setEditingText((c.learning_outcomes || []).join('\n')); }}>Edit</button>
        )}
      </div>
      {editingSection === 'learning_outcomes' ? (
        <div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Enter one learning outcome per line:</p>
          <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="One outcome per line..." />
        </div>
      ) : (
        <ul className="outcome-list">
          {(c.learning_outcomes || []).map((item, idx) => (
            <li key={idx}><span className="outcome-dot" />{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionCoreContent({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, renderAIActionBar, checkCanEdit }) {
  return (
    <div id="step7-sec-core_content" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Core Technical Material</h3>
        {editingSection === 'core_content' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('core_content', editingText)}>Save</button>
            <button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button>
          </div>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Core Content')) return; setEditingSection('core_content'); setEditingText(c.core_content || ''); }}>Edit</button>
        )}
      </div>
      {editingSection === 'core_content' ? (
        <textarea className="prompt-textarea" style={{ minHeight: '240px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
      ) : (
        <ContentRenderer text={c.core_content} />
      )}
      {renderAIActionBar && renderAIActionBar('core_content', c.core_content)}
    </div>
  );
}

function SectionExercises({ c, editingSection, setEditingSection, handleSaveManualEdit, checkCanEdit }) {
  const [exercisesList, setExercisesList] = useState([]);

  useEffect(() => {
    if (editingSection === 'exercises') {
      setExercisesList(Array.isArray(c.exercises) ? JSON.parse(JSON.stringify(c.exercises)) : []);
    }
  }, [editingSection, c.exercises]);

  const updateItem = (idx, field, val) => {
    setExercisesList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const addExercise = () => {
    setExercisesList(prev => [
      ...prev,
      { title: `Exercise ${prev.length + 1}`, instruction: 'Complete the exercise steps described here.', difficulty: 'Easy', code_template: '// Write solution here\n' }
    ]);
  };

  const removeExercise = (idx) => {
    setExercisesList(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div id="step7-sec-exercises" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Hands-On Exercises</h3>
        {editingSection === 'exercises' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('exercises', exercisesList)}>Save All</button>
            <button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button>
          </div>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Hands-On Exercises')) return; setEditingSection('exercises'); }}>Edit</button>
        )}
      </div>

      {editingSection === 'exercises' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {exercisesList.map((ex, idx) => (
            <div key={idx} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Exercise Title"
                  value={ex.title || ''}
                  onChange={(e) => updateItem(idx, 'title', e.target.value)}
                  style={{ flex: 1, fontWeight: 700, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
                <select
                  value={ex.difficulty || 'Easy'}
                  onChange={(e) => updateItem(idx, 'difficulty', e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff', fontSize: '0.82rem' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeExercise(idx)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                  title="Remove exercise"
                >
                  ✕
                </button>
              </div>
              <textarea
                placeholder="Exercise Instructions & Objectives..."
                value={ex.instruction || ex.description || ''}
                onChange={(e) => updateItem(idx, 'instruction', e.target.value)}
                style={{ width: '100%', minHeight: '70px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}
              />
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Starter Code Template (Optional):</span>
                <textarea
                  placeholder="// Starter code..."
                  value={ex.code_template || ex.code || ''}
                  onChange={(e) => updateItem(idx, 'code_template', e.target.value)}
                  style={{ width: '100%', minHeight: '60px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.82rem', marginTop: '4px' }}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addExercise}
            className="ai-pill-btn"
            style={{ alignSelf: 'flex-start', background: '#eff6ff', color: 'var(--blue)', border: '1px solid #bfdbfe', padding: '6px 14px', fontWeight: 700 }}
          >
            + Add Exercise
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(c.exercises || []).map((ex, idx) => {
            const textDesc = ex.instruction || ex.description || (typeof ex === 'string' ? ex : '');
            return (
              <div key={idx} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--navy)' }}>Exercise {idx + 1}: {ex.title || 'Practice Exercise'}</strong>
                  {ex.difficulty && (
                    <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: 700, border: '1px solid #bbf7d0' }}>{ex.difficulty}</span>
                  )}
                </div>
                {textDesc && <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6' }}>{textDesc}</p>}
                {(ex.code_template || ex.code) && <pre className="code-block" style={{ marginTop: '10px' }}>{ex.code_template || ex.code}</pre>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionQuizzes({ c, editingSection, setEditingSection, handleSaveManualEdit, checkCanEdit }) {
  const [quizzesList, setQuizzesList] = useState([]);

  useEffect(() => {
    if (editingSection === 'quizzes') {
      const initial = Array.isArray(c.quizzes) ? JSON.parse(JSON.stringify(c.quizzes)) : [];
      setQuizzesList(initial);
    }
  }, [editingSection, c.quizzes]);

  const updateQuiz = (idx, field, val) => {
    setQuizzesList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const updateOption = (qIdx, optIdx, val) => {
    setQuizzesList(prev => {
      const copy = [...prev];
      const opts = [...(copy[qIdx].options || copy[qIdx].choices || [])];
      opts[optIdx] = val;
      copy[qIdx].options = opts;
      return copy;
    });
  };

  const addOption = (qIdx) => {
    setQuizzesList(prev => {
      const copy = [...prev];
      const opts = [...(copy[qIdx].options || copy[qIdx].choices || [])];
      opts.push(`Option ${opts.length + 1}`);
      copy[qIdx].options = opts;
      return copy;
    });
  };

  const addQuiz = () => {
    setQuizzesList(prev => [
      ...prev,
      {
        question: `New Question ${prev.length + 1}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: 'Option A',
        explanation: 'Explanation for correct answer.'
      }
    ]);
  };

  const removeQuiz = (idx) => {
    setQuizzesList(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div id="step7-sec-quizzes" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Assessment Quiz</h3>
        {editingSection === 'quizzes' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('quizzes', quizzesList)}>Save All</button>
            <button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button>
          </div>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Quiz')) return; setEditingSection('quizzes'); }}>Edit</button>
        )}
      </div>

      {editingSection === 'quizzes' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {quizzesList.map((q, idx) => {
            const opts = Array.isArray(q.options) ? q.options : (q.choices || []);
            return (
              <div key={idx} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>Question {idx + 1}:</strong>
                  <button
                    type="button"
                    onClick={() => removeQuiz(idx)}
                    style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
                    title="Remove question"
                  >
                    ✕ Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Question text..."
                  value={q.question || ''}
                  onChange={(e) => updateQuiz(idx, 'question', e.target.value)}
                  style={{ width: '100%', fontWeight: 600, padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
                
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Choices & Correct Answer:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {opts.map((opt, oIdx) => (
                      <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="radio"
                          name={`correct-ans-${idx}`}
                          checked={opt === q.answer}
                          onChange={() => updateQuiz(idx, 'answer', opt)}
                          title="Set as correct answer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                        />
                        {opt === q.answer && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>✓ Correct</span>}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(idx)}
                      style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--blue)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', marginTop: '2px' }}
                    >
                      + Add Choice
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Explanation for answer (optional)..."
                  value={q.explanation || ''}
                  onChange={(e) => updateQuiz(idx, 'explanation', e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem', fontStyle: 'italic' }}
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={addQuiz}
            className="ai-pill-btn"
            style={{ alignSelf: 'flex-start', background: '#eff6ff', color: 'var(--blue)', border: '1px solid #bfdbfe', padding: '6px 14px', fontWeight: 700 }}
          >
            + Add Question
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(Array.isArray(c.quizzes) ? c.quizzes : []).map((q, idx) => (
            <div key={idx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <strong>Q{idx + 1}: {q.question || 'Quiz Question'}</strong>
              <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '8px' }}>
                {(Array.isArray(q.options) ? q.options : (q.choices || [])).map((opt, oIdx) => (
                  <li key={oIdx} style={{ padding: '4px 0', fontSize: '0.88rem', color: opt === q.answer ? '#059669' : 'var(--text-main)', fontWeight: opt === q.answer ? 700 : 400 }}>
                    {opt === q.answer ? '✅ ' : '• '}{opt}
                  </li>
                ))}
              </ul>
              {q.explanation && (
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreatorView({
  activeLessonContent = {},
  sectionOrder = [],
  editingSection,
  setEditingSection,
  editingText,
  setEditingText,
  handleSaveManualEdit,
  renderAIActionBar,
  checkCanEdit,
  toast
}) {
  const DEFAULT_ORDER = [
    { type: 'overview', title: 'Lesson Overview' },
    { type: 'learning_outcomes', title: 'Learning Outcomes' },
    { type: 'core_content', title: 'Core Technical Material' },
    { type: 'exercises', title: 'Hands-On Exercises' },
    { type: 'quizzes', title: 'Assessment Quiz' }
  ];
  
  const listToRender = sectionOrder && sectionOrder.length > 0 ? sectionOrder : DEFAULT_ORDER;

  const RENDERERS = {
    overview: (props) => <SectionOverview {...props} />,
    outcomes: (props) => <SectionLearningOutcomes {...props} />,
    learning_outcomes: (props) => <SectionLearningOutcomes {...props} />,
    core_content: (props) => <SectionCoreContent {...props} />,
    exercises: (props) => <SectionExercises {...props} />,
    quiz: (props) => <SectionQuizzes {...props} />,
    quizzes: (props) => <SectionQuizzes {...props} />
  };

  const sharedProps = {
    c: activeLessonContent,
    editingSection, setEditingSection,
    editingText, setEditingText,
    handleSaveManualEdit,
    renderAIActionBar,
    checkCanEdit,
    toast
  };

  return (
    <>
      {listToRender.map((sec) => {
        const typeKey = sec.type === 'outcomes' ? 'learning_outcomes' : sec.type === 'quiz' ? 'quizzes' : sec.type;
        const renderer = RENDERERS[typeKey] || RENDERERS[sec.type];

        if (renderer) {
          return (
            <React.Fragment key={sec.type || sec.id}>
              {renderer(sharedProps)}
            </React.Fragment>
          );
        }

        // Custom section rendering in exact sectionOrder position
        const rawContent = activeLessonContent[sec.type];
        const secContent = (rawContent && typeof rawContent === 'string' && !rawContent.includes('is not generated yet'))
          ? rawContent
          : (typeof rawContent === 'object' ? rawContent : `This section provides comprehensive guidelines, architectural principles, and practical strategies for **${sec.title}**. Learners will explore core concepts, industry use-cases, and implementation patterns necessary for real-world application.`);
        
        let cleanContent = secContent;
        if (typeof cleanContent === 'string') {
          const escapedTitle = sec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          cleanContent = cleanContent.replace(new RegExp(`^#{1,6}\\s*${escapedTitle}\\s*\\n*`, 'i'), '').trim();
        }

        const isEditing = editingSection === sec.type;
        const domId = sec.type === 'outcomes' ? 'learning_outcomes' : sec.type === 'quiz' ? 'quizzes' : sec.type;

        return (
          <div key={sec.type || sec.id} id={`step7-sec-${domId}`} className="content-block" style={{ scrollMarginTop: '110px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{sec.title}</h3>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit(sec.type, editingText)}>Save</button>
                  <button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button>
                </div>
              ) : (
                <button className="ai-pill-btn edit" onClick={() => { setEditingSection(sec.type); setEditingText(typeof cleanContent === 'string' ? cleanContent : JSON.stringify(cleanContent, null, 2)); }}>Edit</button>
              )}
            </div>
            {isEditing ? (
              <textarea 
                className="prompt-textarea" 
                style={{ minHeight: '150px' }} 
                value={editingText} 
                onChange={(e) => setEditingText(e.target.value)} 
              />
            ) : (
              <ContentRenderer text={cleanContent} />
            )}
            {renderAIActionBar && renderAIActionBar(sec.type, cleanContent)}
          </div>
        );
      })}
    </>
  );
}
