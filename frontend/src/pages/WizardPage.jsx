import React from 'react';
import { defaultSections } from '../constants/defaultSections';
import { StepProgressBar } from '../components/common/StepProgressBar';
import { Step1Prompt } from '../components/wizard/Step1Prompt';
import { Step2ContextConfig } from '../components/wizard/Step2ContextConfig';
import { Step3Grounding } from '../components/wizard/Step3Grounding';
import { Step4Proposals } from '../components/wizard/Step4Proposals';
import { Step5Structure } from '../components/wizard/Step5Structure';
import { Step6Review } from '../components/wizard/Step6Review';
import { Step7Generating } from '../components/wizard/Step7Generating';
import { Step8Generated } from '../components/wizard/Step8Generated';
import { ExportModal } from '../components/modals/ExportModal';
import { VersionHistoryModal } from '../components/modals/VersionHistoryModal';

const API_BASE = '/api/v1';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Wizard Component Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: '600px', margin: '40px auto', background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚠️</span>
          <h3 style={{ color: 'var(--navy)', marginBottom: '8px', fontSize: '1.25rem', fontWeight: 800 }}>Something went wrong loading this step</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="action-btn" onClick={() => this.setState({ hasError: false })}>
              🔄 Retry Step
            </button>
            <button className="file-upload-btn" onClick={() => window.location.reload()}>
              🏠 Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WizardPage({ wizard, exports, currentStep, setCurrentStep, toast }) {
  return (
    <ErrorBoundary>
      <StepProgressBar currentStep={currentStep} onStepClick={(stepKey) => setCurrentStep(stepKey)} />

      {wizard.isLoading && currentStep === 'dashboard' ? (
        <div className="magic-progress-container">
          <div className="magic-orb-container playful-card">
            <div className="sparkle-orbit">
              <span className="sparkle-particle p1">✨</span>
              <span className="sparkle-particle p2">⚡</span>
              <span className="sparkle-particle p3">🌟</span>
              <span className="sparkle-particle p4">🔮</span>
            </div>
            <div className="magic-icon-star-spin">
              <svg width="40" height="40" fill="none" stroke="var(--gold)" strokeWidth="2.5" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
          </div>

          <h1 className="magic-title">Crafting Your Curriculum Magic...</h1>
          <p className="magic-subtext">
            Our AI agents are sculpting technical foundations, learning outcomes, and persona guides in real time!
          </p>

          <div className="progress-step-list">
            {[
              { id: 1, name: "TECHNICAL FOUNDATIONS", desc: "Analyzing tech stack, libraries & frameworks" },
              { id: 2, name: "EDUCATIONAL GROUNDING", desc: "Setting prerequisites & out-of-scope boundaries" },
              { id: 3, name: "DIRECTIONAL PROPOSALS", desc: "Structuring practical, recommended & advanced tracks" },
              { id: 4, name: "CURRICULUM OUTLINE", desc: "Building 3-POV persona guides (Creator, Student, Educator)" }
            ].map((step) => {
              const isActive = wizard.agentProgressStage === step.id;
              const isCompleted = wizard.agentProgressStage > step.id;
              return (
                <div 
                  key={step.id} 
                  className={`progress-step-item playful-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className={`step-badge-number ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}>
                      {isCompleted ? '✓' : step.id}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span className="progress-step-name">{step.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.desc}</span>
                    </div>
                  </div>

                  <div className="progress-step-status-wrap">
                    {isActive ? (
                      <span className="status-pill processing">
                        <span className="pulse-dot"></span>
                        Processing...
                      </span>
                    ) : isCompleted ? (
                      <span className="status-pill completed">✓ Done</span>
                    ) : (
                      <span className="status-pill pending">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="loading-trivia-card playful-card">
            <div className="trivia-badge">💡 DID YOU KNOW?</div>
            <p className="trivia-text">
              "AI-assisted project-based learning improves knowledge retention by up to <strong>74%</strong> compared to traditional lecture formats!"
            </p>
          </div>

          <div className="elice-footer" style={{ width: '100%', maxWidth: '460px', marginTop: '30px' }}>
            <span>&copy; {new Date().getFullYear()} Curricula AI. All rights reserved.</span>
            <button className="feedback-btn" onClick={() => toast.info('Thank you for your feedback!')}>Send Feedback</button>
          </div>
        </div>
      ) : (
        <>
          {/* STEP 1: DASHBOARD */}
          {currentStep === 'dashboard' && (
            <Step1Prompt
              promptText={wizard.promptText}
              setPromptText={wizard.setPromptText}
              pendingFile={wizard.pendingFile}
              setPendingFile={wizard.setPendingFile}
              isLoading={wizard.isLoading}
              handleFileUploadClick={wizard.handleFileUploadClick}
              handleStartSession={wizard.handleStartSession}
              isAgentMode={wizard.isAgentMode}
              setIsAgentMode={wizard.setIsAgentMode}
              selectedTopicCategory={wizard.selectedTopicCategory}
              setSelectedTopicCategory={wizard.setSelectedTopicCategory}
            />
          )}

          {/* STEP 2: CONTEXT CONFIG */}
          {!wizard.showMyCourses && currentStep === 'context' && (
            <Step2ContextConfig
              promptText={wizard.promptText}
              techTags={wizard.techTags}
              allSuggestedTags={wizard.allSuggestedTags}
              toggleTag={wizard.toggleTag}
              newTag={wizard.newTag}
              setNewTag={wizard.setNewTag}
              handleAddCustomTag={wizard.handleAddCustomTag}
              configLessons={wizard.configLessons}
              setConfigLessons={wizard.setConfigLessons}
              configDuration={wizard.configDuration}
              setConfigDuration={wizard.setConfigDuration}
              activeFileName={wizard.activeFileName}
              handleRemoveAttachedFile={wizard.handleRemoveAttachedFile}
              insertMarkdown={wizard.insertMarkdown}
              showHeadingDropdown={wizard.showHeadingDropdown}
              setShowHeadingDropdown={wizard.setShowHeadingDropdown}
              applyHeading={wizard.applyHeading}
              showTablePicker={wizard.showTablePicker}
              setShowTablePicker={wizard.setShowTablePicker}
              hoverGrid={wizard.hoverGrid}
              setHoverGrid={wizard.setHoverGrid}
              insertTable={wizard.insertTable}
              isPreviewMode={wizard.isPreviewMode}
              setIsPreviewMode={wizard.setIsPreviewMode}
              showCatalog={wizard.showCatalog}
              setShowCatalog={wizard.setShowCatalog}
              handleFileUploadClick={wizard.handleFileUploadClick}
              subjectContext={wizard.subjectContext}
              setSubjectContext={wizard.setSubjectContext}
              contextTextareaRef={wizard.contextTextareaRef}
              setCurrentStep={setCurrentStep}
              handleJumpToReview={wizard.handleJumpToReview}
              canJumpToReview={wizard.canJumpFromConfig}
              handleGenerateProposals={wizard.handleGenerateProposals}
              isLoading={wizard.isLoading}
            />
          )}

          {/* STEP 3: GROUNDING */}
          {!wizard.showMyCourses && currentStep === 'grounding' && (
            <Step3Grounding
              prerequisites={wizard.prerequisites}
              setPrerequisites={wizard.setPrerequisites}
              boundaries={wizard.boundaries}
              setBoundaries={wizard.setBoundaries}
              learningOutcomes={wizard.learningOutcomes}
              setLearningOutcomes={wizard.setLearningOutcomes}
              handleAutoSuggestGrounding={wizard.handleAutoSuggestGrounding}
              loadingField={wizard.loadingField}
              setCurrentStep={setCurrentStep}
              handleJumpToReview={wizard.handleJumpToReview}
              canJumpToReview={wizard.canJumpFromGrounding}
              handleSaveGrounding={wizard.handleSaveGrounding}
              isLoading={wizard.isLoading}
            />
          )}

          {/* STEP 4: PROPOSALS */}
          {!wizard.showMyCourses && currentStep === 'proposal' && (
            <Step4Proposals
              proposals={wizard.proposals}
              selectedProposalId={wizard.selectedProposalId}
              handleSelectProposal={wizard.handleSelectProposal}
              isLoading={wizard.isLoading}
              setCurrentStep={setCurrentStep}
              handleJumpToReview={wizard.handleJumpToReview}
              canJumpToReview={wizard.canJumpFromProposal}
            />
          )}

          {/* STEP 5: STRUCTURE */}
          {!wizard.showMyCourses && currentStep === 'structure' && (
            <Step5Structure
              promptText={wizard.promptText}
              promptExpanded={wizard.promptExpanded}
              setPromptExpanded={wizard.setPromptExpanded}
              structure={wizard.structure}
              setStructure={wizard.setStructure}
              selectedStructureLessonId={wizard.selectedStructureLessonId}
              setSelectedStructureLessonId={wizard.setSelectedStructureLessonId}
              draggingIdx={wizard.draggingIdx}
              setDraggingIdx={wizard.setDraggingIdx}
              dragOverIdx={wizard.dragOverIdx}
              setDragOverIdx={wizard.setDragOverIdx}
              moveLesson={wizard.moveLesson}
              deleteLesson={wizard.deleteLesson}
              addLesson={wizard.addLesson}
              activeStructureRole={wizard.activeStructureRole}
              setActiveStructureRole={wizard.setActiveStructureRole}
              moveSection={wizard.moveSection}
              setNewSectionRole={wizard.setNewSectionRole}
              setIsAddSectionModalOpen={wizard.setIsAddSectionModalOpen}
              isAddSectionModalOpen={wizard.isAddSectionModalOpen}
              newSectionRole={wizard.newSectionRole}
              newSectionTitle={wizard.newSectionTitle}
              setNewSectionTitle={wizard.setNewSectionTitle}
              newSectionInstruction={wizard.newSectionInstruction}
              setNewSectionInstruction={wizard.setNewSectionInstruction}
              defaultSections={defaultSections}
              sessionId={wizard.sessionId}
              API_BASE={API_BASE}
              setCurrentStep={setCurrentStep}
              handleJumpToReview={wizard.handleJumpToReview}
              canJumpToReview={wizard.canJumpFromStructure}
              isLoading={wizard.isLoading}
              setIsLoading={wizard.setIsLoading}
              toast={toast}
            />
          )}

          {/* STEP 6: REVIEW */}
          {!wizard.showMyCourses && currentStep === 'review' && (
            <Step6Review
              promptText={wizard.promptText}
              promptExpanded={wizard.promptExpanded}
              setPromptExpanded={wizard.setPromptExpanded}
              activeFileName={wizard.activeFileName}
              handleRemoveAttachedFile={wizard.handleRemoveAttachedFile}
              subjectContext={wizard.subjectContext}
              techTags={wizard.techTags}
              prerequisites={wizard.prerequisites}
              boundaries={wizard.boundaries}
              learningOutcomes={wizard.learningOutcomes}
              structure={wizard.structure}
              defaultSections={defaultSections}
              handleTriggerGeneration={wizard.handleTriggerGeneration}
              isLoading={wizard.isLoading}
              setCurrentStep={setCurrentStep}
            />
          )}

          {/* STEP 7: GENERATING */}
          {!wizard.showMyCourses && currentStep === 'generating' && (
            <Step7Generating
              promptText={wizard.promptText}
              promptExpanded={wizard.promptExpanded}
              setPromptExpanded={wizard.setPromptExpanded}
              courseData={wizard.courseData}
              setCourseData={wizard.setCourseData}
              setActiveLessonId={wizard.setActiveLessonId}
              setCurrentStep={setCurrentStep}
              API_BASE={API_BASE}
              sessionId={wizard.sessionId}
              generationProgress={wizard.generationProgress}
              setGenerationProgress={wizard.setGenerationProgress}
              generationStatusText={wizard.generationStatusText}
              structure={wizard.structure}
              currentGeneratingLessonIdx={wizard.currentGeneratingLessonIdx}
              setCurrentGeneratingLessonIdx={wizard.setCurrentGeneratingLessonIdx}
              activeRole={wizard.activeRole}
              setActiveRole={wizard.setActiveRole}
              activeSubSection={wizard.activeSubSection}
              setActiveSubSection={wizard.setActiveSubSection}
              isAIWandOpen={wizard.isAIWandOpen}
              setIsAIWandOpen={wizard.setIsAIWandOpen}
              setIsWandProcessing={wizard.setIsWandProcessing}
              fetchHistory={exports.fetchHistory}
              setIsHistoryOpen={exports.setIsHistoryOpen}
              checkCanEdit={wizard.checkCanEdit}
              editingSection={wizard.editingSection}
              setEditingSection={wizard.setEditingSection}
              editingText={wizard.editingText}
              setEditingText={wizard.setEditingText}
              handleSaveManualEdit={wizard.handleSaveManualEdit}
              renderAIActionBar={wizard.renderAIActionBar}
              renderCustomSections={wizard.renderCustomSections}
              toast={toast}
            />
          )}

          {/* STEP 8: GENERATED COURSE */}
          {!wizard.showMyCourses && currentStep === 'generated' && wizard.courseData && (
            <Step8Generated
              courseData={wizard.courseData}
              goToDashboard={wizard.goToDashboard}
              openPov={wizard.openPov}
              setOpenPov={wizard.setOpenPov}
              activeRole={wizard.activeRole}
              setActiveRole={wizard.setActiveRole}
              activeLessonId={wizard.activeLessonId}
              setActiveLessonId={wizard.setActiveLessonId}
              isPptxPage={exports.isPptxPage}
              setIsPptxPage={exports.setIsPptxPage}
              pptxDataByLesson={exports.pptxDataByLesson}
              activePptxLessonId={exports.activePptxLessonId}
              setActivePptxLessonId={exports.setActivePptxLessonId}
              pptxSlideIndex={exports.pptxSlideIndex}
              setPptxSlideIndex={exports.setPptxSlideIndex}
              handleGenerateLessonPptx={exports.handleGenerateLessonPptx}
              pptxLoading={exports.pptxLoading}
              handleDownloadLessonPptx={exports.handleDownloadLessonPptx}
              pptxData={exports.pptxData}
              pptxLayout={exports.pptxLayout}
              setPptxLayout={exports.setPptxLayout}
              currentPptxSlides={exports.currentPptxSlides}
              currentPptxSlide={exports.currentPptxSlide}
              setExportFormat={exports.setExportFormat}
              setIsExportModalOpen={exports.setIsExportModalOpen}
              sessionId={wizard.sessionId}
              API_BASE={API_BASE}
              pdfZoom={exports.pdfZoom}
              pdfBlobUrl={exports.pdfBlobUrl}
            />
          )}

          {/* Export Hub Modal */}
          <ExportModal
            isExportModalOpen={exports.isExportModalOpen}
            setIsExportModalOpen={exports.setIsExportModalOpen}
            exportFormat={exports.exportFormat}
            setExportFormat={exports.setExportFormat}
            exportRole={exports.exportRole}
            setExportRole={exports.setExportRole}
            isExporting={exports.isExporting}
            handleExport={exports.handleExport}
          />

          {/* Version History Modal */}
          <VersionHistoryModal
            isHistoryOpen={exports.isHistoryOpen}
            setIsHistoryOpen={exports.setIsHistoryOpen}
            historyLoading={exports.historyLoading}
            historyList={exports.historyList}
            handleRestoreHistory={exports.handleRestoreHistory}
          />
        </>
      )}
    </ErrorBoundary>
  );
}
