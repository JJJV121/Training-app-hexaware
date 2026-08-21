import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { assignmentService } from '../services/assignmentService';
import Icon from './Icon';

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
  const [runResultsMap, setRunResultsMap] = useState({}); // questionIdx -> test cases run result
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [showEndModal, setShowEndModal] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState(null);

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
          assignmentService.getMySubmissions()
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
          setError("Unable to process assignment pipeline. Check network connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadModuleData();
  }, [courseDayId, isUnlocked]);

  const handleStartTest = (task) => {
    setActiveTestAssignment(task);
    setTestPhase('testing');
    setActiveQuestionIdx(0);

    const questions = questionsMap[task.id] || [];
    const initialCodes = {};
    questions.forEach((q, idx) => {
      initialCodes[idx] = q.starter_code || '';
    });
    setCodeAnswersMap(initialCodes);
  };

  const handleRunCode = async (qIdx) => {
    const questions = questionsMap[activeTestAssignment.id] || [];
    const q = questions[qIdx];
    if (!q) return;

    const currentCode = codeAnswersMap[qIdx] || '';
    const testCases = q.test_cases || [];
    const tcCount = testCases.length || 10;
    
    try {
      const result = await assignmentService.runAssignmentCode(activeTestAssignment.id, q.id, currentCode, q.language || q.allowed_language || 'java');
      setRunResultsMap(prev => ({ ...prev, [qIdx]: result }));
    } catch (err) {
      setRunResultsMap(prev => ({ ...prev, [qIdx]: { status: 'ERROR', output: err.response?.data?.detail || 'Code execution failed.' } }));
    }
  };

  const handleConfirmEndTest = async () => {
    setShowEndModal(false);
    setIsEvaluating(true);

    try {
      const questions = questionsMap[activeTestAssignment.id] || [];
      const answersPayload = {};

      questions.forEach((q, idx) => {
        answersPayload[String(q.id)] = {
          code: codeAnswersMap[idx] || q.starter_code || ''
        };
      });

      const result = await assignmentService.submitAssignmentAnswers(
        activeTestAssignment.id,
        answersPayload,
        userId || 1
      );

      setFinalEvaluation(result);
      setTestPhase('result');

      const updatedSubmissions = await assignmentService.getMySubmissions();
      setSubmissions(updatedSubmissions || []);
    } catch (err) {
      alert("Error evaluating test submission. Please check connection.");
    } finally {
      setIsEvaluating(false);
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

      const updatedSubmissions = await assignmentService.getMySubmissions();
      setSubmissions(updatedSubmissions || []);
    } catch (err) {
      alert("Error submitting assignment.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getAssignmentType = (task) => String(task.assignment_type || '').toUpperCase();

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
      const updatedSubmissions = await assignmentService.getMySubmissions();
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
    const currentQ = questions[activeQuestionIdx] || {};
    const testCases = currentQ.test_cases || [];
    const runRes = runResultsMap[activeQuestionIdx];
    const completedCount = Object.keys(codeAnswersMap).filter(k => codeAnswersMap[k] && codeAnswersMap[k].trim().length > 10).length;

    console.log("ASSIGNMENT QUESTIONS:", {
      assignmentId: activeTestAssignment.id,
      questionCount: questions.length,
      questions
    });
    console.log("CURRENT QUESTION:", {
      id: currentQ.id,
      title: currentQ.title,
      problemStatement: currentQ.problem_statement,
      inputFormat: currentQ.input_format,
      outputFormat: currentQ.output_format,
      constraints: currentQ.constraints,
      sampleInput: currentQ.sample_input,
      sampleOutput: currentQ.sample_output,
      testCaseCount: currentQ.test_cases?.length
    });


    return (
      <div style={styles.practiceViewport}>
        <div style={styles.practiceHeader}>
          <div>
            <span style={styles.practiceTag}>CODING ASSIGNMENT PRACTICE</span>
            <h3 style={{ margin: '4px 0 0 0', color: '#ffffff', fontSize: '16px' }}>{activeTestAssignment.title}</h3>
          </div>

          <button
            onClick={() => setShowEndModal(true)}
            style={styles.endTestHeaderBtn}
          >
            END PRACTICE
          </button>
        </div>

        {/* QUESTION NAVIGATION TABS */}
        <div style={styles.questionTabsRow}>
          {questions.map((q, idx) => {
            const hasCode = codeAnswersMap[idx] && codeAnswersMap[idx].trim().length > 10;
            return (
              <button
                key={idx}
                onClick={() => setActiveQuestionIdx(idx)}
                style={{
                  ...styles.qTabBtn,
                  ...(activeQuestionIdx === idx ? styles.qTabActive : {})
                }}
              >
                Question {idx + 1} {hasCode ? '✓' : ''}
              </button>
            );
          })}
        </div>

        {/* CODING TEST WORKSPACE */}
        <div style={styles.testWorkspaceGrid}>
          {/* LEFT: PROBLEM STATEMENT & 10 TEST CASES */}
          <div style={{ ...styles.problemCard, maxHeight: '600px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                Question {activeQuestionIdx + 1}: {currentQ.title || `Coding Challenge #${activeQuestionIdx + 1}`}
              </h4>
              <span style={styles.langPill}>Language: {currentQ.language?.toUpperCase() || 'JAVA'}</span>
            </div>

            {currentQ.problem_statement && (
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '13px', color: '#1e293b' }}>Problem Statement</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
                  {currentQ.problem_statement}
                </p>
              </div>
            )}

            {currentQ.input_format && (
              <div style={styles.formatBox}>
                <strong>Input Format:</strong>
                <div style={{ marginTop: '2px', fontFamily: 'monospace', fontSize: '12px' }}>{currentQ.input_format}</div>
              </div>
            )}

            {currentQ.output_format && (
              <div style={styles.formatBox}>
                <strong>Output Format:</strong>
                <div style={{ marginTop: '2px', fontFamily: 'monospace', fontSize: '12px' }}>{currentQ.output_format}</div>
              </div>
            )}

            {currentQ.constraints && currentQ.constraints.trim() !== '' && (
              <div style={styles.constraintsBox}>
                <strong>Constraints:</strong>
                <div style={{ marginTop: '2px', fontFamily: 'monospace', fontSize: '12px' }}>{currentQ.constraints}</div>
              </div>
            )}

            {currentQ.sample_input && (
              <div style={{ ...styles.formatBox, backgroundColor: '#f1f5f9' }}>
                <strong>Sample Input:</strong>
                <pre style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', color: '#0f172a' }}>
                  {currentQ.sample_input}
                </pre>
              </div>
            )}

            {currentQ.sample_output && (
              <div style={{ ...styles.formatBox, backgroundColor: '#f1f5f9' }}>
                <strong>Sample Output:</strong>
                <pre style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', color: '#0f172a' }}>
                  {currentQ.sample_output}
                </pre>
              </div>
            )}

            {currentQ.explanation && (
              <div style={{ ...styles.formatBox, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                <strong>Explanation:</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#1e40af' }}>
                  {currentQ.explanation}
                </p>
              </div>
            )}

            <h5 style={{ margin: '16px 0 8px 0', fontSize: '13px', color: '#334155', fontWeight: '700' }}>
              10 Evaluation Test Cases:
            </h5>
            <div style={styles.testCasesList}>
              {testCases.map((tc, tcIdx) => (
                <div key={tc.id || tcIdx} style={styles.testCaseRow}>
                  <span>
                    Test Case #{tc.id || tcIdx + 1}{' '}
                    {tc.is_hidden ? '(Hidden Evaluation Case)' : `(Input: ${tc.input || 'Sample Input'})`}
                  </span>
                  <span style={{ fontSize: '11px', color: tc.is_hidden ? '#64748b' : '#2563eb', fontWeight: '600' }}>
                    {tc.is_hidden ? '🔒 Hidden' : '👁️ Visible / Sample'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: MONACO/CODE EDITOR & RUN ENGINE */}
          <div style={styles.editorCard}>
            <div style={styles.editorHeader}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                Code Editor ({currentQ.language || currentQ.allowed_language || 'java'})
              </span>
              <button
                onClick={() => handleRunCode(activeQuestionIdx)}
                style={styles.runCodeBtn}
              >
                ▶ Run Code
              </button>
            </div>

            <Editor
              height="420px"
              language={(currentQ.language || currentQ.allowed_language || 'java').toLowerCase()}
              theme="vs-dark"
              value={codeAnswersMap[activeQuestionIdx] || ''}
              onChange={(value) => setCodeAnswersMap({ ...codeAnswersMap, [activeQuestionIdx]: value || '' })}
              options={{ minimap: { enabled: false }, automaticLayout: true, fontSize: 14, wordWrap: 'on' }}
            />

            {runRes && (
              <div style={{
                ...styles.runResultBox,
                backgroundColor: runRes.passed === runRes.total ? '#f0fdf4' : '#eff6ff',
                borderColor: runRes.passed === runRes.total ? '#86efac' : '#bfdbfe'
              }}>
                <strong>Test Evaluation Result:</strong> {runRes.passed_tests ?? runRes.passed ?? 0} / {runRes.total_tests ?? runRes.total ?? testCases.length} Test Cases ({runRes.status}). {runRes.output || ''}
              </div>
            )}
          </div>
        </div>

        {/* CONFIRMATION END TEST MODAL */}
        {showEndModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Confirm End Test</h3>
                <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
                Submit your current practice answers and view the marks obtained.
              </p>
              <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px', color: '#334155' }}>
                <strong>Questions Attempted:</strong> {completedCount} / {questions.length} Questions
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowEndModal(false)} style={styles.modalCancelBtn}>CANCEL</button>
                <button onClick={handleConfirmEndTest} style={styles.modalConfirmBtn} disabled={isEvaluating}>
                  {isEvaluating ? "Evaluating..." : "VIEW MARKS"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Questions</th>
                  <th style={styles.th}>Duration (Min)</th>
                  <th style={styles.th}>Marks</th>
                </tr>
              </thead>
              <tbody>
                {isCoding ? (
                  <>
                    <tr>
                      <td style={styles.td}>1</td>
                      <td style={styles.td}>{task.title} — Part 1</td>
                      <td style={styles.td}>1</td>
                      <td style={styles.td}>10</td>
                      <td style={styles.td}>30</td>
                    </tr>
                    <tr>
                      <td style={styles.td}>2</td>
                      <td style={styles.td}>{task.title} — Part 2</td>
                      <td style={styles.td}>1</td>
                      <td style={styles.td}>10</td>
                      <td style={styles.td}>35</td>
                    </tr>
                    <tr>
                      <td style={styles.td}>3</td>
                      <td style={styles.td}>{task.title} — Part 3</td>
                      <td style={styles.td}>1</td>
                      <td style={styles.td}>10</td>
                      <td style={styles.td}>35</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td style={styles.td}>1</td>
                    <td style={styles.td}>Knowledge Assessment Q&A</td>
                    <td style={styles.td}>3</td>
                    <td style={styles.td}>15</td>
                    <td style={styles.td}>{task.total_marks}</td>
                  </tr>
                )}
                <tr style={{ fontWeight: '700', backgroundColor: '#f8fafc' }}>
                  <td style={styles.td}></td>
                  <td style={styles.td}>Total</td>
                  <td style={styles.td}>{questions.length || 3}</td>
                  <td style={styles.td}>30</td>
                  <td style={styles.td}>{task.total_marks}</td>
                </tr>
              </tbody>
            </table>

            {isDocumentAssignment && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>
                  {assignmentType === 'NON_CODING' ? 'Question PDF and solution upload' : assignmentType === 'CASE_STUDY' ? 'Case study PDF and GitHub submission' : 'Project requirement PDF and GitHub submission'}
                </h4>
                {task.attachment_path && (
                  <>
                    <button type="button" onClick={() => handleViewAttachment(task)} style={styles.instructionsLinkBtn}>View Question PDF</button>
                    {attachmentUrls[task.id] && <iframe title={`${task.title} question PDF`} src={attachmentUrls[task.id]} style={styles.pdfFrame} />}
                  </>
                )}
                {assignmentType === 'NON_CODING' ? (
                  <input type="file" accept="application/pdf" onChange={(e) => setSelectedFiles(prev => ({ ...prev, [task.id]: e.target.files?.[0] || null }))} />
                ) : (
                  <input type="url" value={githubUrls[task.id] || ''} onChange={(e) => setGithubUrls(prev => ({ ...prev, [task.id]: e.target.value }))} placeholder="https://github.com/your-name/repository" style={styles.githubInput} />
                )}
                <button onClick={() => handleSubmitDocumentAssignment(task)} style={styles.takeTestPrimaryBtn} disabled={submittingAssignmentId === task.id}>
                  {submittingAssignmentId === task.id ? 'Submitting...' : 'Submit Assignment'}
                </button>
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
    height: '420px',
    marginTop: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px'
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
