import React, { useState, useEffect, useCallback, useRef } from 'react';
import { defaultSections, mergeSections } from '../constants/defaultSections';
import { AIActionBar, CustomSectionsList } from '../components/views/CourseEditorComponents';

const API_BASE = '/api/v1';

export function useCourseWizard({ toast, setCurrentView, currentView, currentStep, setCurrentStep, setPptxDataByLesson }) {
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('wizard_session_id') || null);
  const [isLoading, setIsLoading] = useState(false);
  const [agentProgressStage, setAgentProgressStage] = useState(1);
  const [activeSidebarNav, setActiveSidebarNav] = useState('create');

  const [promptText, setPromptText] = useState('');
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState('agent');
  const [sessionsList, setSessionsList] = useState([]);
  const [showMyCourses, setShowMyCourses] = useState(false);

  // Persist sessionId to sessionStorage for refresh recovery
  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('wizard_session_id', sessionId);
    } else {
      sessionStorage.removeItem('wizard_session_id');
    }
  }, [sessionId]);

  // ── Course Library Filters & Pagination ──
  const [libraryFilterTab, setLibraryFilterTab] = useState('all');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [librarySelectedTag, setLibrarySelectedTag] = useState('All Tags');
  const [libraryWipPage, setLibraryWipPage] = useState(1);
  const [libraryPubPage, setLibraryPubPage] = useState(1);
  const [selectedTopicCategory, setSelectedTopicCategory] = useState('All Categories');

  // ── Context & Config ──
  const DEFAULT_CANDIDATE_TAGS = [];
  const [techTags, setTechTags] = useState([]);
  const [allSuggestedTags, setAllSuggestedTags] = useState([]);
  const [newTag, setNewTag] = useState('');

  const toggleTag = (tag) => {
    if (techTags.includes(tag)) {
      setTechTags(techTags.filter(t => t !== tag));
    } else {
      setTechTags([...techTags, tag]);
    }
  };

  const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    const minorWords = new Set(['and', 'or', 'the', 'a', 'an', 'in', 'on', 'of', 'for', 'with', 'at', 'by', 'to']);
    return str
      .trim()
      .split(/\s+/)
      .map((word, index) => {
        const lower = word.toLowerCase();
        if (index > 0 && minorWords.has(lower)) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(' ');
  };

  const handleAddCustomTag = (e) => {
    if (e?.key && e.key !== 'Enter') return;
    const raw = (newTag || '').trim();
    if (!raw) return;

    // Filter out spam (single chars, repeated letters like 'aaaaa', or punctuation only)
    if (raw.length < 2 || /^(.)\1+$/.test(raw) || !/[a-zA-Z0-9]/.test(raw)) {
      if (toast) toast.warning('Please enter a valid skill or concept tag.');
      return;
    }

    const formatted = toTitleCase(raw);
    if (formatted) {
      if (!allSuggestedTags.includes(formatted)) {
        setAllSuggestedTags(prev => [...prev, formatted]);
      }
      if (!techTags.includes(formatted)) {
        setTechTags(prev => [...prev, formatted]);
      }
      setNewTag('');
    }
  };

  const [configLessons, setConfigLessons] = useState(5);
  const [configDuration, setConfigDuration] = useState(60);
  const [configDifficulty, setConfigDifficulty] = useState('Beginner');
  const [configAudience, setConfigAudience] = useState('Student');
  const [subjectContext, setSubjectContext] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const activeFileName = uploadedFileName || pendingFile?.name || (() => {
    if (subjectContext) {
      const match = subjectContext.match(/Context from Uploaded File \(([^)]+)\)/);
      if (match) return match[1];
    }
    return '';
  })();

  const handleRemoveAttachedFile = async () => {
    setPendingFile(null);
    setUploadedFileName('');
    
    // Clean document context mention from subjectContext state
    setSubjectContext(prev => {
      if (!prev) return '';
      return prev.replace(/=== Context from (?:Reference Document|Uploaded File) [^=]+===\n[\s\S]*?(?=\n\n|$)/gi, '').trim();
    });

    if (sessionId) {
      try {
        await fetch(`${API_BASE}/courses/sessions/${sessionId}/documents`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete document from session:', err);
      }
    }
    if (toast) toast.info("Attached reference document removed.");
  };

  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ r: 2, c: 2 });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const contextTextareaRef = useRef(null);

  const insertMarkdown = (prefix, suffix = '') => {
    if (!contextTextareaRef.current) {
      setSubjectContext(prev => prev + prefix + suffix);
      return;
    }
    const el = contextTextareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    setSubjectContext(before + prefix + selected + suffix + after);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  const applyHeading = (level) => {
    setShowHeadingDropdown(false);
    const hashes = '#'.repeat(level);
    insertMarkdown(`\n${hashes} `, '');
  };

  const insertTable = (rows, cols) => {
    setShowTablePicker(false);
    let tableMd = '\n';
    tableMd += '| ' + Array.from({ length: cols }).map((_, c) => `Header ${c + 1}`).join(' | ') + ' |\n';
    tableMd += '| ' + Array.from({ length: cols }).map(() => '---').join(' | ') + ' |\n';
    for (let r = 0; r < rows; r++) {
      tableMd += '| ' + Array.from({ length: cols }).map((_, c) => `Cell ${r + 1}-${c + 1}`).join(' | ') + ' |\n';
    }
    tableMd += '\n';
    insertMarkdown(tableMd, '');
  };

  // ── Grounding ──
  const [prerequisites, setPrerequisites] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [newPrereq, setNewPrereq] = useState('');
  const [newBoundary, setNewBoundary] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  // ── Proposals ──
  const [proposals, setProposals] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [lastSavedConfigHash, setLastSavedConfigHash] = useState(null);

  // ── Structure ──
  const [structure, setStructure] = useState([]);
  const [activeStructureRole, setActiveStructureRole] = useState('creator');
  const [selectedStructureLessonId, setSelectedStructureLessonId] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionInstruction, setNewSectionInstruction] = useState('');
  const [newSectionRole, setNewSectionRole] = useState('creator');

  // ── Modals & Popups ──
  const [deleteTargetSession, setDeleteTargetSession] = useState(null);

  // ── Generation ──
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [currentGeneratingLessonIdx, setCurrentGeneratingLessonIdx] = useState(0);

  // ── Generated Course ──
  const [courseData, setCourseData] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeRole, setActiveRole] = useState('creator');
  const [openPov, setOpenPov] = useState('creator');
  const [activeSubSection, setActiveSubSection] = useState('overview');

  // ── Interactive AI Toolbar ──
  const [sectionLoading, setSectionLoading] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isAIWandOpen, setIsAIWandOpen] = useState(false);
  const [isWandProcessing, setIsWandProcessing] = useState(false);
  const [loadingField, setLoadingField] = useState(null);

  const checkCanEdit = (actionName = 'this action') => {
    if (generationProgress < 100) {
      toast.warning(`Please wait for generation to complete (100%) before you can ${actionName}.`);
      return false;
    }
    return true;
  };

  const handleAIAction = async (sectionType, action, params = {}) => {
    // If user is currently in edit mode on this section, confirm before overwriting
    if (editingSection === sectionType) {
      const ok = window.confirm(`You are currently editing this section. Running AI ${action} will overwrite your unsaved edits. Continue?`);
      if (!ok) return;
    }
    setSectionLoading(prev => ({ ...prev, [sectionType]: true }));

    try {
      const res = await fetch(`${API_BASE}/lessons/${activeLessonId}/sections/ai-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          section_type: sectionType,
          action,
          params
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedVal = JSON.parse(data.content);
        const updatedCourse = { ...courseData };
        const lIdx = updatedCourse.lessons.findIndex(l => l.id === activeLessonId);
        if (lIdx !== -1) {
          updatedCourse.lessons[lIdx].sections[activeRole][sectionType] = updatedVal;
          setCourseData(updatedCourse);
        }
      } else {
        toast.error('AI Action failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error running AI Action.');
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  const handleSaveManualEdit = async (sectionType, newContent) => {
    setSectionLoading(prev => ({ ...prev, [sectionType]: true }));
    try {
      const res = await fetch(`${API_BASE}/lessons/${activeLessonId}/sections/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          section_type: sectionType,
          content: newContent
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedVal = JSON.parse(data.content);
        const updatedCourse = { ...courseData };
        const lIdx = updatedCourse.lessons.findIndex(l => l.id === activeLessonId);
        if (lIdx !== -1) {
          updatedCourse.lessons[lIdx].sections[activeRole][sectionType] = updatedVal;
          setCourseData(updatedCourse);
        }
        setEditingSection(null);
      } else {
        toast.error('Failed to save manual edits.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving manual edits.');
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  // ── Load sessions list ──
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/courses/sessions`);
      if (res.ok) setSessionsList(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const completedToastSessionRef = useRef(null);

  // ── Real-Time SSE Stream & Polling generation progress ──
  useEffect(() => {
    if (currentStep !== 'generating' || !sessionId) return;

    let eventSource = null;
    let fallbackInterval = null;

    const handleProgressUpdate = async (data) => {
      const isCompleted = data.status === 'completed' || data.progress >= 100;
      
      if (data.progress !== undefined) {
        setGenerationProgress(isCompleted ? 100 : data.progress);
      }
      
      const canonicalStatusText = isCompleted
        ? 'Generation completed! Review and edit your content below.'
        : (data.status_text || '');
        
      if (canonicalStatusText) {
        setGenerationStatusText(canonicalStatusText);
      }

      if (isCompleted) {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      }

      try {
        const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
        if (res.ok) {
          const sessData = await res.json();
          if (sessData.lessons && sessData.lessons.length > 0) {
            setCourseData(sessData);
            if (!activeLessonId) setActiveLessonId(sessData.lessons[0].id);
          }
          if (sessData.status === 'completed' || isCompleted || sessData.step === 'generated') {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
            if (fallbackInterval) {
              clearInterval(fallbackInterval);
              fallbackInterval = null;
            }
            setCourseData(sessData);
            if (sessData.lessons?.length > 0) setActiveLessonId(sessData.lessons[0].id);
            setGenerationProgress(100);
            setGenerationStatusText('Generation completed! Review and edit your content below.');
            if (sessData.pptx_by_lesson && setPptxDataByLesson?.current) {
              setPptxDataByLesson.current(sessData.pptx_by_lesson);
            }
            if (completedToastSessionRef.current !== sessionId) {
              completedToastSessionRef.current = sessionId;
              toast.success("Generation completed! Review & edit your course material below, or click 'Proceed to Assets' when ready.");
              fetchSessions();
            }
          } else if (data.status === 'canceled') {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            setCurrentStep('review');
          } else if (data.status === 'error') {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            toast.error(data.status_text || 'Generation encountered an error');
            setCurrentStep('review');
          }
        }
      } catch { /* ignore */ }
    };

    try {
      eventSource = new EventSource(`${API_BASE}/courses/sessions/${sessionId}/stream-progress`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleProgressUpdate(data);
        } catch { /* ignore */ }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!fallbackInterval) {
          fallbackInterval = setInterval(async () => {
            try {
              const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/progress`);
              if (res.ok) {
                const data = await res.json();
                handleProgressUpdate(data);
              }
            } catch { /* ignore */ }
          }, 2000);
        }
      };
    } catch { /* ignore */ }

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [currentStep, sessionId, activeLessonId, fetchSessions, setCurrentStep, toast]);

  // ── File upload refs & handlers ──
  const fileInputRef = useRef(null);

  const handleFileUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const MAX_FILE_SIZE_MB = 10;

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller document.`);
      event.target.value = '';
      return;
    }
    if (activeFileName) {
      const confirmReplace = window.confirm(`Replacing attached document "${activeFileName}" with "${file.name}". Continue?`);
      if (!confirmReplace) {
        event.target.value = '';
        return;
      }
    }
    setPendingFile(file);
    setUploadedFileName(file.name);
    event.target.value = '';
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller document.`);
      event.target.value = '';
      return;
    }
    if (activeFileName) {
      const confirmReplace = window.confirm(`Replacing attached document "${activeFileName}" with "${file.name}". Continue?`);
      if (!confirmReplace) {
        event.target.value = '';
        return;
      }
    }

    if (!sessionId) {
      setPendingFile(file);
      setUploadedFileName(file.name);
      event.target.value = '';
      toast.success(`Attached reference document: ${file.name}`);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE}/sessions/${sessionId}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const fname = uploadData.filename || uploadData.document_filename || file.name;
        setUploadedFileName(fname);
        if (uploadData.subject_context) {
          setSubjectContext(uploadData.subject_context);
        }
        if (uploadData.tech_tags && Array.isArray(uploadData.tech_tags)) {
          setTechTags(prev => Array.from(new Set([...prev, ...uploadData.tech_tags])));
        }
        toast.success(`Successfully uploaded reference document: ${fname}`);
      } else {
        const errJson = await uploadRes.json().catch(() => ({}));
        toast.error(errJson.detail || 'Failed to upload document.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error uploading document.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const uploadPendingFile = async (sessId) => {
    if (!pendingFile || !sessId) return;
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      const uploadRes = await fetch(`${API_BASE}/sessions/${sessId}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const fname = uploadData.filename || uploadData.document_filename || pendingFile.name;
        setUploadedFileName(fname);
        if (uploadData.subject_context) {
          setSubjectContext(uploadData.subject_context);
        }
        if (uploadData.tech_tags && Array.isArray(uploadData.tech_tags)) {
          setTechTags(prev => Array.from(new Set([...prev, ...uploadData.tech_tags])));
        }
      }
    } catch (err) {
      console.error('Failed to upload pending file:', err);
    } finally {
      setPendingFile(null);
    }
  };

  // ── Step 1: Create Session ──
  const handleStartSession = async (promptVal) => {
    const textToSubmit = promptVal || promptText;
    if (!textToSubmit.trim()) {
      toast.warning('Please enter a course topic/prompt first.');
      return;
    }
    setIsLoading(true);
    setAgentProgressStage(1);
    setProposals([]);
    setSelectedProposalId(null);
    setStructure([]);
    setCourseData(null);
    setPrerequisites([]);
    setBoundaries([]);
    setLearningOutcomes([]);
    setUploadedFileName('');
    try {
      const res = await fetch(`${API_BASE}/courses/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: textToSubmit }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setPromptText(textToSubmit);
        const loadedTech = data.tech_tags || [];
        setTechTags(loadedTech);
        setAllSuggestedTags(data.all_suggested_tags || loadedTech);
        setConfigLessons(data.config?.lessons_count || 5);
        setConfigDuration(data.config?.duration || 60);
        setConfigDifficulty(data.config?.difficulty || 'Beginner');
        setConfigAudience(data.config?.target_audience || 'Student');
        const cleanContext = (data.subject_context || '').replace(/\[(DOMAIN|INTERACTIVITY|TOOLS REQUIRED|FINAL PROJECT|EXPLICIT OUTLINE):[^\]]*\]\n?/gi, '').trim();
        setSubjectContext(cleanContext);
        const initialConfigHash = JSON.stringify({
          techTags: Array.from(new Set(loadedTech || [])).sort(),
          configDifficulty: data.config?.difficulty || 'Beginner',
          configAudience: data.config?.target_audience || 'Student',
          configLessons: Number(data.config?.lessons_count || 5),
          configDuration: Number(data.config?.duration || 60),
          subjectContext: (cleanContext || '').trim().replace(/\s+/g, ' '),
        });
        setLastSavedConfigHash(initialConfigHash);
        setCurrentView('wizard');
        fetchSessions();

        await uploadPendingFile(data.session_id);

        if (isAgentMode === 'agent') {
          await runAgentPipeline(data.session_id, data);
        } else {
          setCurrentStep('context');
          setIsLoading(false);
        }
      } else {
        toast.error('Failed to start session.');
        setIsLoading(false);
      }
    } catch {
      toast.error('Error contacting API server. Is the backend running?');
      setIsLoading(false);
    }
  };

  const runAgentPipeline = async (sessId, sessionData) => {
    try {
      setAgentProgressStage(1);
      await fetch(`${API_BASE}/courses/sessions/${sessId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessons_count: sessionData.config?.lessons_count || 5,
          duration: sessionData.config?.duration || 60,
          difficulty: sessionData.config?.difficulty || 'Beginner',
          target_audience: sessionData.config?.target_audience || 'Student',
          subject_context: sessionData.subject_context || '',
          tech_tags: sessionData.tech_tags || [],
        }),
      });

      setAgentProgressStage(2);
      const propRes = await fetch(`${API_BASE}/courses/sessions/${sessId}/proposals/generate`, {
        method: 'POST'
      });
      if (!propRes.ok) throw new Error('Failed to generate proposals');
      const propData = await propRes.json();
      setProposals(propData.proposals || []);

      setAgentProgressStage(3);
      const selRes = await fetch(`${API_BASE}/courses/sessions/${sessId}/proposals/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_proposal_id: 2 })
      });
      if (!selRes.ok) throw new Error('Failed to select proposal');
      const selData = await selRes.json();
      setSelectedProposalId(2);

      const sessRes = await fetch(`${API_BASE}/courses/sessions/${sessId}`);
      if (sessRes.ok) {
        const fullSess = await sessRes.json();
        setPrerequisites(fullSess.prerequisites || []);
        setBoundaries(fullSess.out_of_scope || []);
        setLearningOutcomes(fullSess.learning_outcomes || []);
      }

      setAgentProgressStage(4);
      const structRes = await fetch(`${API_BASE}/courses/sessions/${sessId}/structure/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: selData.structure || [] })
      });
      if (!structRes.ok) throw new Error('Failed to save structure');
      const newStruct = (selData.structure || []).map(lesson => ({
        ...lesson,
        sections: mergeSections(lesson.sections)
      }));
      setStructure(newStruct);
      if (newStruct.length > 0) {
        setSelectedStructureLessonId(newStruct[0].id);
      }

      setCurrentStep('review');
      fetchSessions();
    } catch (err) {
      console.error(err);
      toast.error('Agent pipeline failed: ' + err.message);
      setCurrentStep('context');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProposals = async () => {
    setIsLoading(true);
    const currentConfigHash = JSON.stringify({
      techTags: Array.from(new Set(techTags || [])).sort(),
      configDifficulty,
      configAudience,
      configLessons: Number(configLessons),
      configDuration: Number(configDuration),
      subjectContext: (subjectContext || '').trim().replace(/\s+/g, ' '),
    });

    try {
      if (sessionId) {
        await fetch(`${API_BASE}/courses/sessions/${sessionId}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessons_count: configLessons,
            duration: configDuration,
            difficulty: configDifficulty,
            target_audience: configAudience,
            subject_context: subjectContext,
            tech_tags: techTags,
          }),
        });

        if (lastSavedConfigHash !== null && lastSavedConfigHash !== currentConfigHash) {
          const refreshRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding/refresh`, {
            method: 'POST'
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setPrerequisites(refreshData.prerequisites || []);
            setBoundaries(refreshData.out_of_scope || []);
            setLearningOutcomes(refreshData.learning_outcomes || []);
            setProposals([]);
            setStructure([]);
            setSelectedProposalId(null);
          }
        }
      }
      setLastSavedConfigHash(currentConfigHash);
      setCurrentStep('grounding');
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGrounding = async () => {
    setIsLoading(true);
    try {
      if (sessionId) {
        const gRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tech_tags: techTags,
            prerequisites,
            out_of_scope: boundaries,
            learning_outcomes: learningOutcomes,
            target_audience: configAudience,
          }),
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.prerequisites) setPrerequisites(gData.prerequisites);
          if (gData.out_of_scope) setBoundaries(gData.out_of_scope);
          if (gData.learning_outcomes) setLearningOutcomes(gData.learning_outcomes);
        }
      }

      if (proposals.length === 0 && sessionId) {
        const genRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/generate`, {
          method: 'POST',
        });
        if (genRes.ok) {
          const genData = await genRes.json();
          setProposals(genData.proposals || []);
        } else {
          toast.warning('Grounding saved, but failed to generate proposals.');
        }
      }
      setCurrentStep('proposal');
    } catch (err) {
      console.error('Error saving grounding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSuggestGrounding = async (field, currentList, setter) => {
    setLoadingField(field);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_type: field,
          existing_items: (currentList || []).filter(Boolean)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          const newList = [...currentList, data.suggestion];
          setter(newList);
          if (sessionId) {
            fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tech_tags: techTags,
                prerequisites: field === 'prerequisites' ? newList : prerequisites,
                out_of_scope: field === 'out_of_scope' ? newList : boundaries,
                learning_outcomes: field === 'learning_outcomes' ? newList : learningOutcomes,
                target_audience: configAudience,
              })
            }).catch(err => console.warn('Auto-save grounding notice:', err));
          }
        }
      } else {
        toast.error('Failed to generate suggestions.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingField(null);
    }
  };

  const handleSelectProposal = async (propId) => {
    if (selectedProposalId === propId && structure.length > 0) {
      setCurrentStep('structure');
      return;
    }
    setSelectedProposalId(propId);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_proposal_id: propId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedProposalId(propId);
        const newStruct = (data.structure || []).map(lesson => ({
          ...lesson,
          sections: mergeSections(lesson.sections)
        }));
        setStructure(newStruct);
        if (newStruct.length > 0) {
          setSelectedStructureLessonId(newStruct[0].id);
        }
        setCurrentStep('structure');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerGeneration = async () => {
    if (courseData?.lessons?.length > 0) {
      if (toast) toast.info("Regenerating course. Previous partial or edited content will be overwritten.");
    }

    setIsLoading(true);
    completedToastSessionRef.current = null;
    try {
      if (sessionId && structure && structure.length > 0) {
        const structRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessons: structure })
        }).catch(err => console.warn('Pre-generation structure save notice:', err));
        if (structRes && structRes.ok) {
          const structData = await structRes.json().catch(() => ({}));
          if (structData.structure) {
            setStructure(structData.structure);
          }
        }
      }
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/content/generate`, {
        method: 'POST',
      });
      if (res.ok) {
        setGenerationProgress(5);
        setGenerationStatusText('Preparing generation pipeline...');
        setCurrentStep('generating');
      } else {
        const errData = await res.json().catch(() => ({}));
        if (toast) toast.error(errData.detail || 'Failed to start generation pipeline. Please check backend server.');
      }
    } catch (err) {
      console.error('Trigger generation error:', err);
      if (toast) toast.error('Connection error starting generation. Please ensure Python backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJumpToReview = async () => {
    if (!sessionId) return;
    // Fix 1: If proposals & structure already exist, skip regeneration and go directly to review
    if (proposals.length > 0 && structure.length > 0) {
      setCurrentStep('review');
      return;
    }

    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/courses/sessions/${sessionId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessons_count: configLessons,
          duration: configDuration,
          difficulty: configDifficulty,
          target_audience: configAudience,
          subject_context: subjectContext,
        }),
      });

      const propRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/generate`, {
        method: 'POST',
      });
      if (!propRes.ok) throw new Error('Failed to generate proposals');
      const propData = await propRes.json();
      const firstProposalId = propData.proposals?.[0]?.id || 1;

      const selRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_proposal_id: firstProposalId })
      });
      if (!selRes.ok) throw new Error('Failed to select proposal');
      const selData = await selRes.json();

      const structRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: selData.structure || [] })
      });
      if (!structRes.ok) throw new Error('Failed to save structure');

      const sessRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
      if (sessRes.ok) {
        const fullSess = await sessRes.json();
        setPrerequisites(fullSess.prerequisites || []);
        setBoundaries(fullSess.out_of_scope || []);
        setLearningOutcomes(fullSess.learning_outcomes || []);
        setProposals(fullSess.proposals || []);
        setSelectedProposalId(fullSess.selected_proposal_id);
        const newStruct = (fullSess.structure || []).map(lesson => ({
          ...lesson,
          sections: mergeSections(lesson.sections)
        }));
        setStructure(newStruct);
      }

      setCurrentStep('review');
    } catch (err) {
      console.error(err);
      alert('Failed to quickly prepare review: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = async (sess, setPptxDataByLesson) => {
    setIsLoading(true);
    setCurrentView('wizard');
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sess.session_id}`);
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setPromptText(data.prompt || '');
        const loadedTech = data.tech_tags || [];
        setTechTags(loadedTech);
        setAllSuggestedTags(data.all_suggested_tags && data.all_suggested_tags.length > 0 ? data.all_suggested_tags : Array.from(new Set([...loadedTech, ...DEFAULT_CANDIDATE_TAGS])));
        setConfigLessons(data.config?.lessons_count || 5);
        setConfigDuration(data.config?.duration || 60);
        setConfigDifficulty(data.config?.difficulty || 'Beginner');
        setConfigAudience(data.config?.target_audience || 'Student');
        setSubjectContext(data.subject_context || '');
        setUploadedFileName(data.document_filename || '');
        setPrerequisites(data.prerequisites || []);
        setBoundaries(data.out_of_scope || []);
        setLearningOutcomes(data.learning_outcomes || []);
        setProposals(data.proposals || []);
        setSelectedProposalId(data.selected_proposal_id || null);
        const newStruct = (data.structure || []).map(lesson => ({
          ...lesson,
          sections: mergeSections(lesson.sections)
        }));
        setStructure(newStruct);
        if (newStruct.length > 0) {
          setSelectedStructureLessonId(newStruct[0].id);
        }
        if (data.pptx_by_lesson && setPptxDataByLesson?.current) {
          setPptxDataByLesson.current(data.pptx_by_lesson);
        }
        setLastSavedConfigHash(JSON.stringify({
          techTags: loadedTech,
          configDifficulty: data.config?.difficulty || 'Beginner',
          configAudience: data.config?.target_audience || 'Student',
          configLessons: data.config?.lessons_count || 5,
          configDuration: data.config?.duration || 60,
          subjectContext: data.subject_context || '',
        }));

        if (data.status === 'completed' && data.lessons?.length > 0) {
          setCourseData(data);
          setActiveLessonId(data.lessons[0].id);
          setCurrentStep('generated');
        } else if (data.status === 'generating' || data.status === 'queued' || data.status === 'paused' || data.step === 'generating') {
          setGenerationProgress(data.progress || 10);
          setGenerationStatusText(data.status_text || 'Resuming generation from last lesson...');
          setCurrentStep('generating');
          // Trigger resume on backend to continue from the last uncompleted lesson
          fetch(`${API_BASE}/courses/sessions/${data.session_id}/content/generate`, { method: 'POST' }).catch(() => {});
        } else {
          const stepMap = { context: 'context', grounding: 'grounding', proposal: 'proposal', structure: 'structure', review: 'review', generated: 'review' };
          setCurrentStep(stepMap[data.step] || 'context');
        }
        setShowMyCourses(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const moveLesson = (index, direction) => {
    const updated = [...structure];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    [updated[index], updated[targetIdx]] = [updated[targetIdx], updated[index]];
    updated.forEach((item, idx) => { item.order = idx + 1; });
    setStructure(updated);
  };

  const deleteLesson = (index) => {
    const updated = structure.filter((_, idx) => idx !== index);
    updated.forEach((item, idx) => { item.order = idx + 1; });
    setStructure(updated);
  };

  const addLesson = () => {
    const newId = Date.now();
    setStructure([...structure, { 
      id: newId, 
      title: 'New Lesson Module', 
      order: structure.length + 1,
      sections: JSON.parse(JSON.stringify(defaultSections))
    }]);
    if (!selectedStructureLessonId) {
      setSelectedStructureLessonId(newId);
    }
  };

  const moveSection = (lessonId, roleKey, fromIdx, toIdx) => {
    const updated = structure.map(lesson => {
      const lSecs = lesson.sections ? JSON.parse(JSON.stringify(lesson.sections)) : JSON.parse(JSON.stringify(defaultSections));
      const sections = [...(lSecs[roleKey] || [])];
      if (fromIdx >= 0 && toIdx >= 0 && fromIdx < sections.length && toIdx < sections.length) {
        const [moved] = sections.splice(fromIdx, 1);
        sections.splice(toIdx, 0, moved);
        lSecs[roleKey] = sections;
      }
      return { ...lesson, sections: lSecs };
    });
    setStructure(updated);
  };

  const resetWizardState = () => {
    setSessionId(null);
    setPromptText('');
    setPromptExpanded(false);
    setTechTags([]);
    setAllSuggestedTags([]);
    setNewTag('');
    setConfigLessons(5);
    setConfigDuration(60);
    setConfigDifficulty('Beginner');
    setConfigAudience('Student');
    setSubjectContext('');
    setPendingFile(null);
    setUploadedFileName('');
    setPrerequisites([]);
    setBoundaries([]);
    setLearningOutcomes([]);
    setProposals([]);
    setSelectedProposalId(null);
    setLastSavedConfigHash(null);
    setStructure([]);
    setSelectedStructureLessonId(null);
    setCourseData(null);
    setActiveLessonId(null);
    setCurrentGeneratingLessonIdx(0);
    setGenerationProgress(0);
    setGenerationStatusText('');
    setEditingSection(null);
    setEditingText('');
    setShowMyCourses(false);
    completedToastSessionRef.current = null;
  };

  const goToDashboard = () => {
    resetWizardState();
    setCurrentView('home');
    setCurrentStep('dashboard');
  };

  // ── Render Helpers ──
  const renderAIActionBar = (sectionType, currentVal, customSaveHandler = null) => {
    return (
      <AIActionBar
        sectionType={sectionType}
        currentVal={currentVal}
        customSaveHandler={customSaveHandler}
        sectionLoading={sectionLoading}
        editingSection={editingSection}
        setEditingSection={setEditingSection}
        editingText={editingText}
        setEditingText={setEditingText}
        checkCanEdit={checkCanEdit}
        handleAIAction={handleAIAction}
        handleSaveManualEdit={handleSaveManualEdit}
      />
    );
  };

  const renderCustomSections = () => {
    return (
      <CustomSectionsList
        courseData={courseData}
        currentGeneratingLessonIdx={currentGeneratingLessonIdx}
        activeRole={activeRole}
        structure={structure}
        editingSection={editingSection}
        setEditingSection={setEditingSection}
        editingText={editingText}
        setEditingText={setEditingText}
        renderAIActionBar={renderAIActionBar}
      />
    );
  };

  return {
    sessionId, setSessionId,
    isLoading, setIsLoading,
    agentProgressStage, setAgentProgressStage,
    activeSidebarNav, setActiveSidebarNav,
    promptText, setPromptText,
    promptExpanded, setPromptExpanded,
    isAgentMode, setIsAgentMode,
    sessionsList, setSessionsList,
    showMyCourses, setShowMyCourses,
    libraryFilterTab, setLibraryFilterTab,
    librarySearchQuery, setLibrarySearchQuery,
    librarySelectedTag, setLibrarySelectedTag,
    libraryWipPage, setLibraryWipPage,
    libraryPubPage, setLibraryPubPage,
    selectedTopicCategory, setSelectedTopicCategory,
    techTags, setTechTags,
    allSuggestedTags, setAllSuggestedTags,
    newTag, setNewTag,
    toggleTag, handleAddCustomTag,
    configLessons, setConfigLessons,
    configDuration, setConfigDuration,
    configDifficulty, setConfigDifficulty,
    configAudience, setConfigAudience,
    subjectContext, setSubjectContext,
    pendingFile, setPendingFile,
    uploadedFileName, setUploadedFileName,
    activeFileName, handleRemoveAttachedFile,
    showHeadingDropdown, setShowHeadingDropdown,
    showTablePicker, setShowTablePicker,
    hoverGrid, setHoverGrid,
    isPreviewMode, setIsPreviewMode,
    showCatalog, setShowCatalog,
    contextTextareaRef,
    insertMarkdown, applyHeading, insertTable,
    prerequisites, setPrerequisites,
    boundaries, setBoundaries,
    learningOutcomes, setLearningOutcomes,
    newPrereq, setNewPrereq,
    newBoundary, setNewBoundary,
    newOutcome, setNewOutcome,
    proposals, setProposals,
    selectedProposalId, setSelectedProposalId,
    lastSavedConfigHash, setLastSavedConfigHash,
    structure, setStructure,
    activeStructureRole, setActiveStructureRole,
    selectedStructureLessonId, setSelectedStructureLessonId,
    draggingIdx, setDraggingIdx,
    dragOverIdx, setDragOverIdx,
    isAddSectionModalOpen, setIsAddSectionModalOpen,
    newSectionTitle, setNewSectionTitle,
    newSectionInstruction, setNewSectionInstruction,
    newSectionRole, setNewSectionRole,
    deleteTargetSession, setDeleteTargetSession,
    generationProgress, setGenerationProgress,
    generationStatusText, setGenerationStatusText,
    currentGeneratingLessonIdx, setCurrentGeneratingLessonIdx,
    courseData, setCourseData,
    activeLessonId, setActiveLessonId,
    activeRole, setActiveRole,
    openPov, setOpenPov,
    activeSubSection, setActiveSubSection,
    sectionLoading, setSectionLoading,
    editingSection, setEditingSection,
    editingText, setEditingText,
    isAIWandOpen, setIsAIWandOpen,
    isWandProcessing, setIsWandProcessing,
    loadingField,
    fileInputRef,
    handleFileUploadClick, handleFileSelect, handleFileUpload,
    handleStartSession, handleGenerateProposals, handleSaveGrounding,
    handleAutoSuggestGrounding, handleSelectProposal, handleTriggerGeneration,
    handleJumpToReview, handleResumeSession,
    moveLesson, deleteLesson, addLesson, moveSection,
    goToDashboard,
    resetWizardState,
    checkCanEdit, handleAIAction, handleSaveManualEdit,
    renderAIActionBar, renderCustomSections,
    fetchSessions
  };
}
