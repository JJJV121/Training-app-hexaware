import React, { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignmentService';
import CodingWorkspace from './CodingWorkspace';

export default function Assignment({ courseDayId, userId, isUnlocked = true, onBackToCourse }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [questionsMap, setQuestionsMap] = useState({}); // assignmentId -> array of 3 questions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Coding practice state
  const [activeTestAssignment, setActiveTestAssignment] = useState(null);
  const [testPhase, setTestPhase] = useState('intro'); // 'intro' | 'testing' | 'result'
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [codeAnswersMap, setCodeAnswersMap] = useState({}); // questionIdx -> user code
  const [languageMap, setLanguageMap] = useState({});
  const [runResultsMap, setRunResultsMap] = useState({}); // questionIdx -> test cases run result
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [questionStatuses, setQuestionStatuses] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [remainingSec, setRemainingSec] = useState(null); // No timer for assignments
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');

  const [showEndModal, setShowEndModal] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const isEndingTestRef = React.useRef(false);

  // MCQ selection state for Type 1 Assignment Q&A
  const [mcqAnswersMap, setMcqAnswersMap] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [githubUrls, setGithubUrls] = useState({});
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);

  useEffect(() => {
    if (!courseDayId || !isUnlocked) {
      setLoading(false);
      setAssignments([]);
      setSubmissions([]);
      return;
    }

    const loadModuleData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [assignedList, submissionList] = await Promise.all([
          assignmentService.getAvailableAssignments(courseDayId),
          assignmentService.getMySubmissions().catch(() => [])
        ]);

        const currentAssignments = assignedList || [];
        setAssignments(currentAssignments);
        setSubmissions(submissionList || []);

        const questionsTemp = {};
        for (const task of currentAssignments) {
          try {
            const qList = await assignmentService.getAssignmentQuestions(task.id);
            questionsTemp[task.id] = qList || [];
          } catch (qErr) {
            console.error(`Failed to load questions for assignment ${task.id}:`, qErr);
            questionsTemp[task.id] = [];
          }
        }
        setQuestionsMap(questionsTemp);

      } catch (err) {
        if (err.response && err.response.status === 403) {
          setIsLocked(true);
        } else {
          console.error("Assignment loading issue:", err);
          if (assignments.length === 0) {
            setError("No active assignments scheduled for this day.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadModuleData();
  }, [courseDayId, isUnlocked]);

  const handleStartTest = (task) => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
    setActiveTestAssignment(task);
    setTestPhase('testing');
    setActiveQuestionIdx(0);
    setRemainingSec(null);
    setBookmarked({});
    setShowWarning(false);
    setWarningMsg('');

    const questions = questionsMap[task.id] || [];
    const record = submissions.find(s => s.assignment_id === task.id);
    let savedAnswers = {};
    if (record?.submission_text) {
      try {
        savedAnswers = JSON.parse(record.submission_text)?.answers || {};
      } catch {
        savedAnswers = {};
      }
    }

    const initialCodes = {};
    const initialLangs = {};
    const statuses = {};
    questions.forEach((q, idx) => {
      const saved = savedAnswers[String(q.id)] || savedAnswers[q.id];
      initialLangs[idx] = saved?.language || q.language || q.allowed_language || 'java';
      initialCodes[idx] = saved?.code || q.starter_code || '';
      statuses[q.id] = saved?.code ? 'saved' : (idx === 0 ? 'skipped' : 'not_viewed');
    });
    setLanguageMap(initialLangs);
    setCodeAnswersMap(initialCodes);
    setQuestionStatuses(statuses);
  };

  // Timer logic removed for assignments per requirements

  const handleRunCode = async (qIdx) => {
    const questions = questionsMap[activeTestAssignment.id] || [];
    const q = questions[qIdx];
    if (!q) return;

    const currentCode = codeAnswersMap[qIdx] || '';
    const language = languageMap[qIdx] || q.language || q.allowed_language || 'java';
    try {
      setIsRunningCode(true);
      const result = await assignmentService.runAssignmentCode(activeTestAssignment.id, q.id, currentCode, language);
      setRunResultsMap(prev => ({ ...prev, [qIdx]: result }));
    } catch (err) {
      setRunResultsMap(prev => ({ ...prev, [qIdx]: { status: 'ERROR', output: err.response?.data?.detail || 'Code execution failed.' } }));
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleConfirmEndTest = async () => {
    if (!activeTestAssignment || isEndingTestRef.current) return;
    isEndingTestRef.current = true;
    setShowEndModal(false);
    setIsEvaluating(true);

    try {
      const questions = questionsMap[activeTestAssignment.id] || [];
      const answersPayload = {};

      questions.forEach((q, idx) => {
        answersPayload[String(q.id)] = {
          code: codeAnswersMap[idx] || q.starter_code || '',
          language: languageMap[idx] || q.language || q.allowed_language || 'java'
        };
      });

      const result = await assignmentService.submitAssignmentAnswers(
        activeTestAssignment.id,
        answersPayload,
        userId || 1
      );

      setFinalEvaluation(result);
      setTestPhase('result');

      const updatedSubmissions = await assignmentService.getMySubmissions().catch(() => []);
      setSubmissions(updatedSubmissions || []);
    } catch (err) {
      alert("Error evaluating test submission. Please check connection.");
    } finally {
      setIsEvaluating(false);
      isEndingTestRef.current = false;
    }
  };

  useEffect(() => {
    if (testPhase !== 'testing') return undefined;

    const handleVisibilityChange = () => {
      if (document.hidden && !isEndingTestRef.current) {
        setWarningMsg("⚠️ TAB SWITCH DETECTED: You have been auto-submitted for switching tabs.");
        setShowWarning(true);
        void handleConfirmEndTest();
      }
    };

    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (!isFS && !isEndingTestRef.current) {
        setWarningMsg("⚠️ FULLSCREEN EXIT DETECTED: You must maintain full screen during the assignment.");
        setShowWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [testPhase, activeTestAssignment]);

  const handleSaveCurrentCode = async () => {
    if (!activeTestAssignment) return;
    const questions = questionsMap[activeTestAssignment.id] || [];
    const q = questions[activeQuestionIdx];
    if (!q) return;
    try {
      setIsSavingCode(true);
      await assignmentService.saveAssignmentCode(
        activeTestAssignment.id,
        q.id,
        codeAnswersMap[activeQuestionIdx] || '',
        languageMap[activeQuestionIdx] || q.language || 'java'
      );
      setQuestionStatuses((prev) => ({ ...prev, [q.id]: 'saved' }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to save code to the server.');
    } finally {
      setIsSavingCode(false);
    }
  };

  const handleSelectMcq = (assignmentId, questionId, optionIdx) => {
    setMcqAnswersMap(prev => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || {}),
        [questionId]: optionIdx
      }
    }));
  };

  const handleSubmitMcq = async (assignmentId) => {
    const userAnswers = mcqAnswersMap[assignmentId] || {};
    try {
      setIsEvaluating(true);
      const result = await assignmentService.submitAssignmentAnswers(
        assignmentId,
        userAnswers,
        userId || 1
      );
      setFinalEvaluation(result);
      setTestPhase('result');

      const updatedSubmissions = await assignmentService.getMySubmissions().catch(() => []);
      setSubmissions(updatedSubmissions || []);
    } catch (err) {
      alert("Error submitting assignment.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getAssignmentType = (task) => String(task.assignment_type || '').toUpperCase();

  const [submissionUrls, setSubmissionUrls] = useState({});

  const handleViewAttachment = async (task) => {
    if (attachmentUrls[task.id]) return;

    try {
      const blob = await assignmentService.downloadAssignment(task.id);
      const url = URL.createObjectURL(blob);
      setAttachmentUrls(prev => ({ ...prev, [task.id]: url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load the assignment PDF.');
    }
  };

  const handleViewSubmission = async (record) => {
    if (submissionUrls[record.id]) {
      setSubmissionUrls(prev => ({ ...prev, [record.id]: null }));
      return;
    }

    try {
      const blob = await assignmentService.downloadSubmission(record.id);
      const url = URL.createObjectURL(blob);
      setSubmissionUrls(prev => ({ ...prev, [record.id]: url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load your submitted solution.');
    }
  };

  const handleSubmitDocumentAssignment = async (task) => {
    const assignmentType = getAssignmentType(task);
    const file = selectedFiles[task.id];
    const githubUrl = (githubUrls[task.id] || '').trim();

    if (assignmentType === 'NON_CODING' && !file) {
      setError('Select your solution PDF before submitting.');
      return;
    }
    if ((assignmentType === 'CASE_STUDY' || assignmentType === 'PROJECT') && !githubUrl) {
      setError('Enter the GitHub repository URL before submitting.');
      return;
    }

    try {
      setSubmittingAssignmentId(task.id);
      setError(null);
      await assignmentService.submitAssignmentSubmission(task.id, file, githubUrl);
      const updatedSubmissions = await assignmentService.getMySubmissions().catch(() => []);
      setSubmissions(updatedSubmissions || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to submit this assignment.');
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  if (loading) return <div style={styles.stateBox}>Loading assignment module...</div>;
  if (!courseDayId) return <div style={styles.stateBox}>Select a Day Plan to view assignments.</div>;

  if (isLocked) {
    return (
      <div style={styles.lockedBox}>
        <h4>Assignments Locked</h4>
        <p>Complete prerequisite activities for this day to unlock assignments.</p>
      </div>
    );
  }

  if (error) return <div style={{ ...styles.stateBox, color: '#ef4444' }}>{error}</div>;
  if (assignments.length === 0) return <div style={styles.stateBox}>No assignments are scheduled for this day.</div>;

  // ==========================================
  // PHASE 3: RESULT PAGE
  // ==========================================
  if (testPhase === 'result' && finalEvaluation) {
    const isPassed = finalEvaluation.percentage >= 75.0;
    return (
      <div style={styles.resultContainer}>
        {showWarning && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#b91c1c', fontWeight: '600' }}>
            <span>{warningMsg}</span>
            <button onClick={() => setShowWarning(false)} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '700' }}>✕</button>
          </div>
        )}
        <div style={{ ...styles.resultHeader, backgroundColor: isPassed ? '#15803d' : '#b91c1c' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>{isPassed ? '🎉' : '⚠️'}</div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
            {isPassed ? 'TEST COMPLETED' : 'REVISION RECOMMENDED'}
          </h2>
          <p style={{ opacity: 0.9, marginTop: '4px' }}>
            {finalEvaluation.feedback}
          </p>
        </div>

        <div style={styles.resultStatsRow}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Score</span>
            <span style={styles.statVal}>{finalEvaluation.score} / {finalEvaluation.total_marks}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Percentage</span>
            <span style={styles.statVal}>{finalEvaluation.percentage}%</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Pass Threshold</span>
            <span style={styles.statVal}>75%</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Status</span>
            <span style={{ ...styles.statVal, color: isPassed ? '#16a34a' : '#dc2626' }}>
              {isPassed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        </div>

        <div style={styles.breakdownSection}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b' }}>Question & 10 Test Cases Breakdown</h3>
          {finalEvaluation.details?.map((dt, idx) => (
            <div key={idx} style={styles.breakdownRow}>
              <div>
                <strong>Question {idx + 1}: {dt.question}</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{dt.explanation}</p>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '12px',
                backgroundColor: dt.is_correct ? '#dcfce7' : '#fee2e2',
                color: dt.is_correct ? '#15803d' : '#991b1b'
              }}>
                {dt.is_correct ? 'Passed (10/10 Test Cases)' : `Partial (${dt.passed_test_cases || 0}/10 Test Cases)`}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button
            onClick={() => {
              setTestPhase('intro');
              if (onBackToCourse) onBackToCourse();
            }}
            style={styles.backToCourseBtn}
          >
            ← BACK TO COURSE MODULE
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: CODING ASSIGNMENT PRACTICE INTERFACE
  // ==========================================
  if (testPhase === 'testing' && activeTestAssignment) {
    const questions = questionsMap[activeTestAssignment.id] || [];
    const workspaceQuestions = questions.map((q) => {
      const lang = q.language || q.allowed_language || 'java';
      return {
        id: q.id,
        title: q.title,
        problemStatement: q.problem_statement || q.question,
        inputFormat: q.input_format,
        outputFormat: q.output_format,
        constraints: q.constraints,
        sampleInput: q.sample_input,
        sampleOutput: q.sample_output,
        marks: Math.round((activeTestAssignment.total_marks || 100) / Math.max(questions.length, 1)),
        languages: [{ id: lang, name: lang.toUpperCase() }],
      };
    });
    const currentQ = questions[activeQuestionIdx] || {};
    let userName = 'Trainee';
    try {
      userName = JSON.parse(localStorage.getItem('user') || '{}').name || 'Trainee';
    } catch {
      userName = 'Trainee';
    }

    return (
      <>
        {showWarning && (
          <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 999999, background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#b91c1c', fontWeight: '700', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>{warningMsg}</span>
            <button onClick={() => setShowWarning(false)} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '800' }}>✕</button>
          </div>
        )}
        <CodingWorkspace
        title={activeTestAssignment.title}
        sectionLabel={`Section 1/1 | Coding (${questions.length})`}
        userName={userName}
        userRoll={String(userId || '')}
        remainingSeconds={remainingSec}
        questions={workspaceQuestions}
        currentIndex={activeQuestionIdx}
        onSelectQuestion={(idx) => {
          const prevQ = questions[activeQuestionIdx];
          if (prevQ && questionStatuses[prevQ.id] === 'not_viewed') {
            setQuestionStatuses((prev) => ({ ...prev, [prevQ.id]: 'skipped' }));
          }
          setActiveQuestionIdx(idx);
          const nextQ = questions[idx];
          if (nextQ && questionStatuses[nextQ.id] === 'not_viewed') {
            setQuestionStatuses((prev) => ({ ...prev, [nextQ.id]: 'skipped' }));
          }
        }}
        code={codeAnswersMap[activeQuestionIdx] || ''}
        language={languageMap[activeQuestionIdx] || currentQ.language || 'java'}
        onCodeChange={(value) => {
          setCodeAnswersMap({ ...codeAnswersMap, [activeQuestionIdx]: value });
          if (currentQ.id) {
            setQuestionStatuses((prev) => ({
              ...prev,
              [currentQ.id]: value.trim().length > 0 ? 'answered' : 'skipped',
            }));
          }
        }}
        onLanguageChange={(lang) => setLanguageMap({ ...languageMap, [activeQuestionIdx]: lang })}
        onClear={() => setCodeAnswersMap({ ...codeAnswersMap, [activeQuestionIdx]: currentQ.starter_code || '' })}
        onRun={() => handleRunCode(activeQuestionIdx)}
        onSaveCode={handleSaveCurrentCode}
        onSubmitTest={handleConfirmEndTest}
        onNext={() => setActiveQuestionIdx((idx) => Math.min(idx + 1, questions.length - 1))}
        runResult={runResultsMap[activeQuestionIdx]}
        isRunning={isRunningCode}
        isSaving={isSavingCode}
        isSubmitting={isEvaluating}
        statuses={questionStatuses}
        bookmarked={bookmarked}
        onToggleBookmark={(qId) => setBookmarked((prev) => ({ ...prev, [qId]: !prev[qId] }))}
        watermark={`${userId || ''}04035`}
      />
      </>
    );
  }

  // ==========================================
  // PHASE 1: ASSIGNMENT INTRODUCTION CARD (MATCHING REFERENCE UI)
  // ==========================================
  return (
    <div className="assignment-panel" style={styles.container}>
      {/* ASSIGNMENT HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: '1px solid #334155'
      }}>
        <div>
          <span style={{ background: '#3563e9', color: '#ffffff', fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Day Assignment
          </span>
          <h3 style={{ margin: '10px 0 4px 0', fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
            Complete the assignments listed for this training day.
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
            Use the submission method specified by each assignment type.
          </p>
        </div>
      </div>

      {assignments.map(task => {
        const record = submissions.find(s => s.assignment_id === task.id);
        const questions = questionsMap[task.id] || [];
        const assignmentType = getAssignmentType(task);
        const isCoding = assignmentType === 'CODING';
        const isDocumentAssignment = ['NON_CODING', 'CASE_STUDY', 'PROJECT'].includes(assignmentType);

        return (
          <div key={task.id} style={styles.introCard}>
            <div style={styles.introTopBar}>
              <h3 style={styles.introTitle}>{task.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => alert(task.instructions || 'Practice this assignment and submit your completed code when ready.')} style={styles.instructionsLinkBtn}>
                  View Instructions
                </button>
                {isCoding && (
                  <button onClick={() => handleStartTest(task)} style={styles.takeTestPrimaryBtn}>
                    Start Test
                  </button>
                )}
              </div>
            </div>

            <div style={styles.overviewNavRow}>
              <span style={styles.activeTabPill}>Overview</span>
              <span style={styles.attemptCounterBadge}>
                📝 Attempts: {record ? '01 / 01' : '00 / 01'}
              </span>
            </div>

            <div style={styles.startDeadlineBanner}>
              Start Before: 31 Dec 26 | 11:59 PM (GMT +05:30)
            </div>

            <table style={styles.overviewTable}>
              <thead>
                <tr>
                  <th style={styles.th}>SNo</th>
                  <th style={styles.th}>Assignment / Problem Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Marks</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isCoding && questions.length > 0 ? (
                  questions.map((q, idx) => (
                    <tr key={q.id || idx}>
                      <td style={styles.td}>{idx + 1}</td>
                      <td style={styles.td}>{q.title}</td>
                      <td style={styles.td}>CODING</td>
                      <td style={styles.td}>{q.marks || Math.round((task.total_marks || 100) / questions.length)}</td>
                      <td style={styles.td}>
                        {record ? (
                          <span style={styles.statusSubmitted}>✓ Submitted</span>
                        ) : (
                          <span style={styles.statusPending}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={styles.td}>1</td>
                    <td style={styles.td}>{task.title}</td>
                    <td style={styles.td}>{assignmentType}</td>
                    <td style={styles.td}>{task.total_marks}</td>
                    <td style={styles.td}>
                      {record ? (
                        <span style={styles.statusSubmitted}>✓ Submitted</span>
                      ) : (
                        <span style={styles.statusPending}>Pending</span>
                      )}
                    </td>
                  </tr>
                )}
                <tr style={{ fontWeight: '700', backgroundColor: '#f8fafc' }}>
                  <td style={styles.td}></td>
                  <td style={styles.td}>Total</td>
                  <td style={styles.td}>{isCoding ? `${questions.length} Coding Problems` : '1 Activity'}</td>
                  <td style={styles.td}>{task.total_marks}</td>
                  <td style={styles.td}>
                    {record ? (
                      <span style={{ color: '#16a34a', fontWeight: '700' }}>Completed</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>In Progress</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {isDocumentAssignment && (
              <div style={styles.documentAssignmentContainer}>
                {/* Question PDF Card */}
                {task.attachment_path && (
                  <div style={styles.attachmentCard}>
                    <div style={styles.attachmentHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>📄</span>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>Assignment Question PDF</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Review the problem statement before uploading your solution</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (attachmentUrls[task.id]) {
                            setAttachmentUrls(prev => ({ ...prev, [task.id]: null }));
                          } else {
                            handleViewAttachment(task);
                          }
                        }}
                        style={styles.viewPdfBtn}
                      >
                        {attachmentUrls[task.id] ? ' Hide Question PDF' : '👁 View Question PDF'}
                      </button>
                    </div>
                    {attachmentUrls[task.id] && (
                      <div style={styles.pdfContainer}>
                        <iframe title={`${task.title} question PDF`} src={attachmentUrls[task.id]} style={styles.pdfFrame} />
                      </div>
                    )}
                  </div>
                )}

                {/* Submission Card */}
                <div style={styles.submissionCard}>
                  <div style={styles.submissionHeader}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📤</span>
                      {assignmentType === 'NON_CODING'
                        ? 'Solution Upload'
                        : 'GitHub Repository Submission'}
                    </h4>
                    {record && (
                      <span style={styles.submittedBadge}>
                        ✓ Submitted
                      </span>
                    )}
                  </div>

                  {record && (
                    <div style={styles.submittedInfoBox}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#15803d', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                            Assignment Submitted Successfully
                          </div>

                          {record.submission_path && (
                            <div style={styles.submittedDetailRow}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
                                <span style={styles.fileNameBadge}>
                                  📄 Submitted Solution PDF
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleViewSubmission(record)}
                                  style={styles.viewSubmissionBtn}
                                >
                                  {submissionUrls[record.id] ? ' Hide My Submission' : '👁 View My Submission'}
                                </button>
                              </div>
                              {submissionUrls[record.id] && (
                                <div style={styles.pdfContainer}>
                                  <iframe title="My Submitted Solution PDF" src={submissionUrls[record.id]} style={styles.pdfFrame} />
                                </div>
                              )}
                            </div>
                          )}

                          {record.github_url && (
                            <div style={styles.submittedDetailRow}>
                              <strong style={{ color: '#334155' }}>Repository URL: </strong>
                              <a href={record.github_url} target="_blank" rel="noopener noreferrer" style={styles.githubLink}>
                                🔗 {record.github_url}
                              </a>
                            </div>
                          )}

                          {record.submitted_at && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                              Submitted on: {new Date(record.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          )}
                        </div>

                        {record.marks !== null && record.marks !== undefined && (
                          <div style={styles.scoreCardBadge}>
                            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: '700' }}>Grade</span>
                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#2563eb' }}>{record.marks} / {task.total_marks}</span>
                          </div>
                        )}
                      </div>

                      {record.feedback && (
                        <div style={styles.feedbackBox}>
                          <strong>Trainer Feedback:</strong> {record.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Form */}
                  <div style={{ marginTop: record ? '16px' : '12px' }}>
                    {record && (
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '10px' }}>
                        Want to update your submission? Select a new file below:
                      </div>
                    )}

                    {assignmentType === 'NON_CODING' ? (
                      <div style={styles.fileUploadWrapper}>
                        <label htmlFor={`file-input-${task.id}`} style={styles.customFileLabel}>
                          <span>📁</span>
                          <span>{selectedFiles[task.id] ? selectedFiles[task.id].name : 'Choose PDF File'}</span>
                        </label>
                        <input
                          id={`file-input-${task.id}`}
                          type="file"
                          accept="application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSelectedFiles(prev => ({ ...prev, [task.id]: file }));
                          }}
                        />

                        {selectedFiles[task.id] && (
                          <div style={styles.selectedFileChip}>
                            <span>📄 {selectedFiles[task.id].name} ({Math.round(selectedFiles[task.id].size / 1024)} KB)</span>
                            <button
                              type="button"
                              onClick={() => setSelectedFiles(prev => ({ ...prev, [task.id]: null }))}
                              style={styles.clearFileBtn}
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="url"
                        value={githubUrls[task.id] || ''}
                        onChange={(e) => setGithubUrls(prev => ({ ...prev, [task.id]: e.target.value }))}
                        placeholder="https://github.com/your-name/repository"
                        style={styles.githubInput}
                      />
                    )}

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleSubmitDocumentAssignment(task)}
                        style={styles.takeTestPrimaryBtn}
                        disabled={submittingAssignmentId === task.id || (assignmentType === 'NON_CODING' && !selectedFiles[task.id] && !record)}
                      >
                        {submittingAssignmentId === task.id
                          ? 'Submitting...'
                          : record
                          ? 'Re-submit Assignment'
                          : 'Submit Assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '12px'
  },
  introCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
  },
  introTopBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  introTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a'
  },
  instructionsLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px'
  },
  takeTestPrimaryBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
  },
  overviewNavRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
    marginBottom: '16px'
  },
  activeTabPill: {
    color: '#2563eb',
    fontWeight: '700',
    borderBottom: '2px solid #2563eb',
    paddingBottom: '10px',
    fontSize: '14px'
  },
  attemptCounterBadge: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  startDeadlineBanner: {
    textAlign: 'center',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  overviewTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
  },
  th: {
    backgroundColor: '#f1f5f9',
    textAlign: 'left',
    padding: '12px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#334155',
    borderBottom: '1px solid #cbd5e1'
  },
  td: {
    padding: '12px',
    fontSize: '13px',
    color: '#334155',
    borderBottom: '1px solid #e2e8f0'
  },
  practiceViewport: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 99999,
    backgroundColor: '#0f172a',
    overflowY: 'auto',
    padding: '24px',
    boxSizing: 'border-box',
    color: '#ffffff'
  },
  practiceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: '16px 20px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  practiceTag: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '4px',
    letterSpacing: '1px'
  },
  timerBadge: {
    backgroundColor: '#334155',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px'
  },
  reEnterFsBtn: {
    backgroundColor: '#d97706',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer'
  },
  endTestHeaderBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  proctorAlertBar: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px'
  },
  dismissAlertBtn: {
    backgroundColor: '#991b1b',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer'
  },
  questionTabsRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  qTabBtn: {
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  qTabActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff'
  },
  testWorkspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    alignItems: 'start'
  },
  problemCard: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderRadius: '8px',
    padding: '20px',
    maxHeight: 'calc(100vh - 180px)',
    overflowY: 'auto'
  },
  langPill: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '4px'
  },
  problemStatementText: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#334155'
  },
  formatBox: {
    backgroundColor: '#f8fafc',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#475569',
    marginTop: '8px'
  },
  constraintsBox: {
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #2563eb',
    padding: '10px',
    fontSize: '12px',
    color: '#475569',
    marginTop: '12px'
  },
  testCasesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  testCaseRow: {
    backgroundColor: '#f1f5f9',
    padding: '8px 12px',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#334155'
  },
  editorCard: {
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 180px)'
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  runCodeBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 16px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  codeTextarea: {
    width: '100%',
    minHeight: '380px',
    height: '100%',
    backgroundColor: '#0f172a',
    color: '#38bdf8',
    fontFamily: 'monospace',
    fontSize: '13px',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '12px',
    boxSizing: 'border-box'
  },
  runResultBox: {
    marginTop: '12px',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '13px',
    color: '#0f172a'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '440px',
    width: '90%'
  },
  modalCancelBtn: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  modalConfirmBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  resultContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0'
  },
  resultHeader: {
    color: '#ffffff',
    textAlign: 'center',
    padding: '32px',
    borderRadius: '12px',
    marginBottom: '24px'
  },
  resultStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center'
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '4px'
  },
  statVal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a'
  },
  breakdownSection: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '20px'
  },
  breakdownRow: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '8px'
  },
  backToCourseBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  mcqQuestionCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px'
  },
  mcqOptionLabel: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '10px 14px',
    cursor: 'pointer'
  },
  githubInput: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    margin: '12px 0',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '14px'
  },
  pdfFrame: {
    display: 'block',
    width: '100%',
    height: '480px',
    border: 'none'
  },
  pdfContainer: {
    marginTop: '16px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1'
  },
  documentAssignmentContainer: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  attachmentCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
  },
  attachmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  viewPdfBtn: {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  submissionCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
  },
  submissionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  submittedBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontWeight: '700',
    fontSize: '12px',
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid #bbf7d0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  statusSubmitted: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: '13px'
  },
  statusPending: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: '13px'
  },
  submittedInfoBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '16px'
  },
  submittedDetailRow: {
    fontSize: '14px',
    color: '#1e293b',
    marginTop: '6px'
  },
  fileNameBadge: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    padding: '3px 10px',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    color: '#0f172a',
    display: 'inline-block'
  },
  viewSubmissionBtn: {
    backgroundColor: '#ffffff',
    color: '#15803d',
    border: '1px solid #86efac',
    borderRadius: '6px',
    padding: '5px 12px',
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  },
  githubLink: {
    color: '#2563eb',
    fontWeight: '600',
    textDecoration: 'none'
  },
  scoreCardBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    padding: '8px 14px',
    borderRadius: '8px'
  },
  feedbackBox: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px dashed #bbf7d0',
    fontSize: '13px',
    color: '#166534'
  },
  fileUploadWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '8px'
  },
  customFileLabel: {
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1.5px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  selectedFileChip: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  clearFileBtn: {
    background: 'none',
    border: 'none',
    color: '#1e40af',
    cursor: 'pointer',
    fontWeight: '800',
    padding: 0,
    fontSize: '13px'
  },
  stateBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px'
  },
  lockedBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748b',
    border: '1px dashed #cbd5e1',
    borderRadius: '8px'
  }
};
