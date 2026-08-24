import React, { useState, useEffect, useCallback, useRef } from 'react';
import { proctoredTestService } from '../services/proctoredTestService';
import Icon from '../components/Icon';
import { useTheme } from '../context/ThemeContext';
import CodingWorkspace from '../components/CodingWorkspace';
import '../styles/assessment.css';

export default function ProctoredTestView({ courseDayId, assessmentId: propAssessmentId, onBack }) {
  const { isDarkMode } = useTheme();

  // Core Data States
  const [testData, setTestData] = useState(null); // Trainee response with questions (NO answer keys)
  const [attempt, setAttempt] = useState(null); // Active attempt state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assessment Execution States
  const [phase, setPhase] = useState('setup'); // 'setup' | 'testing' | 'result'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // question_id -> { selected_option_ids: [], answer_text: "" }
  const [remainingSec, setRemainingSec] = useState(1800);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bookmarked, setBookmarked] = useState({});
  const [questionStatuses, setQuestionStatuses] = useState({});
  const [currentLanguage, setCurrentLanguage] = useState('python');

  // Proctoring States
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // 1. Initial Load & Attempt State Recovery on Refresh
  useEffect(() => {
    let isMounted = true;

    const initTestSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dynamic test details
        let testInfo;
        if (courseDayId) {
          testInfo = await proctoredTestService.getProctoredTestByDay(courseDayId);
        } else if (propAssessmentId) {
          testInfo = await proctoredTestService.getProctoredTestById(propAssessmentId);
        } else {
          throw new Error("No assessment or course day specified.");
        }

        if (!isMounted) return;
        setTestData(testInfo);

        // Create or resume attempt
        const attInfo = await proctoredTestService.startAttempt(testInfo.assessment_id);
        if (!isMounted) return;

        setAttempt(attInfo);
        setRemainingSec(attInfo.remaining_seconds);

        if (attInfo.saved_answers) {
          setAnswers(attInfo.saved_answers);
        }
        if (typeof attInfo.current_question === 'number') {
          setCurrentIdx(attInfo.current_question);
        }
        const firstLang = testInfo.questions?.[0]?.allowed_language || 'python';
        setCurrentLanguage(firstLang);

        if (attInfo.status === 'submitted') {
          // Attempt already submitted -> get results
          const subRes = await proctoredTestService.submitAttempt(attInfo.attempt_id);
          setResultData(subRes);
          setPhase('result');
        } else if (attInfo.status === 'expired') {
          setError("Your assessment attempt has expired.");
        }
      } catch (err) {
        console.error("Failed to load proctored test session:", err);
        const detailMsg = err.response?.data?.detail || err.message || "Failed to load proctored test.";
        setError(detailMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initTestSession();

    return () => {
      isMounted = false;
    };
  }, [courseDayId, propAssessmentId]);

  // 2. Server-Synced Countdown Timer
  useEffect(() => {
    if (phase !== 'testing' || !attempt) return;

    const interval = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, attempt]);

  // 3. Proctoring Event Listeners (Fullscreen & Tab Switch)
  useEffect(() => {
    if (phase !== 'testing' || !attempt) return;

    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (!isFS) {
        setWarningMsg("⚠️ FULLSCREEN EXIT DETECTED: You must maintain full screen during the assessment.");
        setShowWarning(true);
        proctoredTestService.logProctoringEvent(attempt.attempt_id, "FULLSCREEN_EXIT");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningMsg("⚠️ TAB SWITCH DETECTED: Do not switch browser tabs during the test.");
        setShowWarning(true);
        proctoredTestService.logProctoringEvent(attempt.attempt_id, "TAB_SWITCH");
        void handleAutoSubmit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase, attempt]);

  // Enter Fullscreen Helper
  const requestFullscreenMode = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn("Fullscreen permission denied or not supported:", err);
    }
  };

  // Start Test from Setup Screen
  const handleStartTestClick = async () => {
    await requestFullscreenMode();
    setPhase('testing');
  };

  // Dynamic Answer Update & Auto-Save
  const handleOptionSelect = (qId, optionId, isMultipleSelect = false) => {
    setAnswers((prev) => {
      const existing = prev[qId] || { selected_option_ids: [], answer_text: '' };
      let newOptIds = [];

      if (isMultipleSelect) {
        const currSet = new Set(existing.selected_option_ids || []);
        if (currSet.has(optionId)) {
          currSet.delete(optionId);
        } else {
          currSet.add(optionId);
        }
        newOptIds = Array.from(currSet);
      } else {
        newOptIds = [optionId];
      }

      const updated = { ...prev, [qId]: { ...existing, selected_option_ids: newOptIds } };

      // Auto-save to backend
      if (attempt) {
        proctoredTestService.saveAnswer(attempt.attempt_id, qId, newOptIds, existing.answer_text, currentIdx);
      }

      return updated;
    });
  };

  const handleTextAnswerChange = (qId, textVal) => {
    setAnswers((prev) => {
      const existing = prev[qId] || { selected_option_ids: [], answer_text: '' };
      const updated = { ...prev, [qId]: { ...existing, answer_text: textVal } };

      // Auto-save to backend
      if (attempt) {
        proctoredTestService.saveAnswer(attempt.attempt_id, qId, existing.selected_option_ids, textVal, currentIdx);
      }

      return updated;
    });
  };

  const handleCodeChange = (qId, code, language) => {
    setAnswers((prev) => {
      const existing = prev[qId] || { selected_option_ids: [], answer_text: '', code: '' };
      const lang = language || existing.language || currentLanguage;
      const updated = { ...prev, [qId]: { ...existing, code, language: lang } };

      if (attempt) {
        proctoredTestService.saveAnswer(attempt.attempt_id, qId, existing.selected_option_ids, existing.answer_text, currentIdx, code, lang);
      }

      return updated;
    });
    setQuestionStatuses((prev) => ({ ...prev, [qId]: code?.trim() ? 'answered' : 'skipped' }));
  };

  const handleSaveCurrentCode = async () => {
    if (!attempt || !testData) return;
    const q = testData.questions[currentIdx];
    const ans = answers[q.question_id] || {};
    try {
      setIsSaving(true);
      await proctoredTestService.saveAnswer(
        attempt.attempt_id,
        q.question_id,
        ans.selected_option_ids,
        ans.answer_text,
        currentIdx,
        ans.code || '',
        ans.language || currentLanguage
      );
      setQuestionStatuses((prev) => ({ ...prev, [q.question_id]: 'saved' }));
    } catch (err) {
      alert(err.response?.data?.detail || 'Unable to save code.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunAssessmentCode = async () => {
    if (!testData) return;
    const q = testData.questions[currentIdx];
    const ans = answers[q.question_id] || {};
    try {
      setIsRunning(true);
      const result = await proctoredTestService.runCode(
        q.question_id,
        ans.code || q.starter_code || '',
        ans.language || q.allowed_language || currentLanguage
      );
      setRunResult(result);
    } catch (err) {
      setRunResult({ status: 'ERROR', output: err.response?.data?.detail || 'Code execution failed.', passed_tests: 0, total_tests: 0 });
    } finally {
      setIsRunning(false);
    }
  };

  // Navigation handlers
  const handleNextQuestion = () => {
    if (!testData) return;
    const nextIdx = Math.min(currentIdx + 1, testData.questions.length - 1);
    setCurrentIdx(nextIdx);
    const currQ = testData.questions[currentIdx];
    const currAns = answers[currQ.question_id];
    if (attempt && currQ && currAns) {
      proctoredTestService.saveAnswer(attempt.attempt_id, currQ.question_id, currAns.selected_option_ids, currAns.answer_text, nextIdx);
    }
  };

  const handlePrevQuestion = () => {
    const prevIdx = Math.max(currentIdx - 1, 0);
    setCurrentIdx(prevIdx);
    const currQ = testData?.questions[currentIdx];
    const currAns = answers[currQ?.question_id];
    if (attempt && currQ && currAns) {
      proctoredTestService.saveAnswer(attempt.attempt_id, currQ.question_id, currAns.selected_option_ids, currAns.answer_text, prevIdx);
    }
  };

  const handleQuestionJump = (idx) => {
    setCurrentIdx(idx);
    const currQ = testData?.questions[currentIdx];
    const currAns = answers[currQ?.question_id];
    if (attempt && currQ && currAns) {
      proctoredTestService.saveAnswer(attempt.attempt_id, currQ.question_id, currAns.selected_option_ids, currAns.answer_text, idx);
    }
  };

  // Auto-Submit on Timeout
  const handleAutoSubmit = async () => {
    if (!attempt || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await proctoredTestService.submitAttempt(attempt.attempt_id);
      setResultData(res);
      setPhase('result');
    } catch (err) {
      console.error("Auto submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // User Submission
  const handleConfirmSubmit = async () => {
    if (!attempt || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setShowConfirmModal(false);
      const res = await proctoredTestService.submitAttempt(attempt.attempt_id);
      setResultData(res);
      setPhase('result');
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {
      const detailMsg = err.response?.data?.detail || "Submission failed. Please try again.";
      alert(detailMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Time Formatter
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Compute answered count for question map & modal
  const getAnsweredCount = () => {
    if (!testData) return 0;
    let count = 0;
    testData.questions.forEach((q) => {
      const ans = answers[q.question_id];
      if (ans && ((ans.selected_option_ids && ans.selected_option_ids.length > 0) || (ans.answer_text && ans.answer_text.trim().length > 0) || (ans.code && ans.code.trim().length > 0))) {
        count++;
      }
    });
    return count;
  };

  // RENDER: Loading / Error
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '24px', fontWeight: '600', color: '#3563e9', marginBottom: '12px' }}>Loading Test...</div>
        <p style={{ color: '#64748b' }}>Initializing proctored assessment session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #fee2e2', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Unable to Load Test</h3>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
        <button onClick={onBack} style={{ padding: '10px 24px', background: '#3563e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Back to Course
        </button>
      </div>
    );
  }

  if (!testData) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <h3>Assessment data is unavailable.</h3>
        <button onClick={onBack}>Back to Course</button>
      </div>
    );
  }

  if (!Array.isArray(testData.questions) || testData.questions.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <h3>No questions are available for this assessment.</h3>
        <button onClick={onBack}>Back to Course</button>
      </div>
    );
  }

  const assessmentType = String(testData.assessment_type || '').toUpperCase();
  if (!['MCQ', 'CODING'].includes(assessmentType)) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <h3>Unsupported assessment type.</h3>
        <button onClick={onBack}>Back to Course</button>
      </div>
    );
  }

  const currentQ = testData.questions[currentIdx];

  if (phase === 'testing' && assessmentType === 'CODING') {
    let userName = 'Trainee';
    try {
      userName = JSON.parse(localStorage.getItem('user') || '{}').name || 'Trainee';
    } catch {
      userName = 'Trainee';
    }
    const workspaceQuestions = testData.questions.map((q) => {
      const lang = q.allowed_language || 'python';
      return {
        id: q.question_id,
        title: q.title,
        problemStatement: q.question_text,
        inputFormat: q.input_format,
        outputFormat: q.output_format,
        constraints: q.constraints,
        sampleInput: q.sample_input,
        sampleOutput: q.sample_output,
        marks: q.points,
        languages: [{ id: lang, name: String(lang).toUpperCase() }],
      };
    });
    const codingAns = answers[currentQ.question_id] || {};
    const lang = codingAns.language || currentQ.allowed_language || currentLanguage;

    return (
      <>
        {showWarning && (
          <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 999999, background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#b91c1c', fontWeight: '700', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span>{warningMsg}</span>
            <button onClick={() => setShowWarning(false)} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '800' }}>✕</button>
          </div>
        )}
        <CodingWorkspace
        title={testData.test_name}
        sectionLabel={`Section 1/1 | Coding (${testData.questions.length})`}
        userName={userName}
        userRoll={String(localStorage.getItem('logged_in_user_id') || '')}
        remainingSeconds={remainingSec}
        questions={workspaceQuestions}
        currentIndex={currentIdx}
        onSelectQuestion={(idx) => {
          handleQuestionJump(idx);
          setRunResult(null);
          const nextQ = testData.questions[idx];
          if (nextQ && !questionStatuses[nextQ.question_id]) {
            setQuestionStatuses((prev) => ({ ...prev, [nextQ.question_id]: 'skipped' }));
          }
        }}
        code={codingAns.code ?? currentQ.starter_code ?? ''}
        language={lang}
        onCodeChange={(value) => handleCodeChange(currentQ.question_id, value, lang)}
        onLanguageChange={(nextLang) => {
          setCurrentLanguage(nextLang);
          handleCodeChange(currentQ.question_id, codingAns.code ?? currentQ.starter_code ?? '', nextLang);
        }}
        onClear={() => handleCodeChange(currentQ.question_id, currentQ.starter_code || '', lang)}
        onRun={handleRunAssessmentCode}
        onSaveCode={handleSaveCurrentCode}
        onSubmitTest={handleConfirmSubmit}
        onNext={handleNextQuestion}
        runResult={runResult}
        isRunning={isRunning}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        statuses={questionStatuses}
        bookmarked={bookmarked}
        onToggleBookmark={(qId) => setBookmarked((prev) => ({ ...prev, [qId]: !prev[qId] }))}
        watermark={`${localStorage.getItem('logged_in_user_id') || ''}04035`}
      />
      </>
    );
  }

  // RENDER: Setup Screen
  if (phase === 'setup') {
    return (
      <div style={{ maxWidth: '800px', margin: '24px auto', padding: '32px', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid var(--border-color, #e2e8f0)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#3563e9', letterSpacing: '0.5px' }}>Proctored Assessment Setup</span>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary, #0f172a)', margin: '4px 0 0 0' }}>{testData.test_name}</h2>
          </div>
          <span style={{ padding: '6px 16px', background: '#eff6ff', color: '#2563eb', fontWeight: '700', borderRadius: '20px', fontSize: '13px' }}>PROCTORED</span>
        </div>

        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#334155' }}>Test Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '14px' }}>
            <div><span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Course</span><strong>{testData.course}</strong></div>
            <div><span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Day</span><strong>Day {testData.day}</strong></div>
            <div><span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Total Questions</span><strong>{testData.questions.length} Questions</strong></div>
            <div><span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>Duration</span><strong>{testData.duration_minutes} Minutes</strong></div>
          </div>
        </div>

        {/* Proctoring Status Check Card */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>Proctoring Environment Check</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#15803d' }}>Camera</div>
                <div style={{ fontSize: '12px', color: '#166534' }}>● Active</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#15803d' }}>Microphone</div>
                <div style={{ fontSize: '12px', color: '#166534' }}>● Active</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#15803d' }}>Fullscreen</div>
                <div style={{ fontSize: '12px', color: '#166534' }}>● Ready (Will request on start)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#15803d' }}>Test Status</div>
                <div style={{ fontSize: '12px', color: '#166534' }}>● Ready to Begin</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onBack} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleStartTestClick} style={{ padding: '12px 32px', background: '#3563e9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(53,99,233,0.3)' }}>
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Result Screen
  if (phase === 'result' && resultData) {
    return (
      <div style={{ maxWidth: '750px', margin: '32px auto', padding: '40px', background: 'var(--bg-card, #ffffff)', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', textCenter: 'center', border: '1px solid var(--border-color, #e2e8f0)' }}>
        {showWarning && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#b91c1c', fontWeight: '600' }}>
            <span>{warningMsg}</span>
            <button onClick={() => setShowWarning(false)} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '700' }}>✕</button>
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '50%', background: resultData.passed ? '#dcfce7' : '#fee2e2', color: resultData.passed ? '#16a34a' : '#dc2626', fontSize: '36px', marginBottom: '16px' }}>
            {resultData.passed ? '✓' : '✕'}
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary, #0f172a)', margin: '0 0 8px 0' }}>Test Submitted Successfully</h2>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#3563e9', margin: 0 }}>{resultData.test_name}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>Score</span>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', margin: '8px 0 4px 0' }}>{resultData.score} / {resultData.total_marks}</div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#3563e9' }}>{resultData.percentage}%</span>
          </div>

          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>Result Status</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: resultData.passed ? '#16a34a' : '#dc2626', margin: '12px 0 4px 0' }}>
              {resultData.passed ? 'PASSED' : 'FAILED'}
            </div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Passing threshold: 70%</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px', background: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#475569', fontSize: '13px' }}>Answered Questions</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{resultData.answered_count}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#475569', fontSize: '13px' }}>Unanswered Questions</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#64748b' }}>{resultData.unanswered_count}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button onClick={onBack} style={{ padding: '14px 36px', background: '#3563e9', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(53,99,233,0.3)' }}>
            Return to Course
          </button>
        </div>
      </div>
    );
  }

  // RENDER: Testing Screen
  const currAns = answers[currentQ.question_id] || { selected_option_ids: [], answer_text: '', code: currentQ.starter_code || '' };
  const currentQLanguage = currentQ.allowed_language || 'python';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
      {/* Warning Alert Banner */}
      {showWarning && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#b91c1c', fontWeight: '600' }}>
          <span>{warningMsg}</span>
          <button onClick={() => setShowWarning(false)} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: '700' }}>✕</button>
        </div>
      )}

      {/* HEADER BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card, #ffffff)', padding: '16px 24px', borderRadius: '14px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary, #0f172a)', margin: 0 }}>{testData.test_name}</h2>
            <span style={{ padding: '3px 10px', background: '#dcfce7', color: '#166534', fontSize: '12px', fontWeight: '700', borderRadius: '12px' }}>{assessmentType} ASSESSMENT</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Course: <strong>{testData.course}</strong> &nbsp;|&nbsp; Day: <strong>Day {testData.day}</strong> &nbsp;|&nbsp; Topic: <strong>{testData.topic}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Proctoring Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ color: cameraActive ? '#16a34a' : '#dc2626' }}>Camera ● {cameraActive ? 'Active' : 'Disabled'}</span>
            <span style={{ color: micActive ? '#16a34a' : '#dc2626' }}>Mic ● {micActive ? 'Active' : 'Disabled'}</span>
            <span style={{ color: isFullscreen ? '#16a34a' : '#d97706' }}>Fullscreen ● {isFullscreen ? 'Active' : 'Windowed'}</span>
          </div>

          {/* Countdown Timer */}
          <div style={{ background: remainingSec < 300 ? '#fef2f2' : '#eff6ff', border: `1px solid ${remainingSec < 300 ? '#fca5a5' : '#bfdbfe'}`, padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: remainingSec < 300 ? '#dc2626' : '#2563eb', letterSpacing: '0.5px', display: 'block' }}>Time Remaining</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: remainingSec < 300 ? '#dc2626' : '#1d4ed8', fontFamily: 'monospace' }}>{formatTime(remainingSec)}</span>
          </div>
        </div>
      </div>

      {/* MAIN TEST CONTAINER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        {/* QUESTION CONTENT CARD */}
        <div style={{ background: 'var(--bg-card, #ffffff)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '480px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#3563e9' }}>Question {currentIdx + 1} of {testData.questions.length}</span>
              <span style={{ fontSize: '13px', background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' }}>
                {currentQ.question_type.toUpperCase()} • {currentQ.points} {currentQ.points === 1 ? 'Point' : 'Points'}
              </span>
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary, #0f172a)', lineHeight: '1.5', marginBottom: '24px' }}>
              {currentQ.question_text}
            </h3>

            {/* Question Choices / Inputs */}
            <div style={{ marginTop: '16px' }}>
              {currentQ.question_type === 'coding' && (
                <div>
                  {currentQ.input_format && <p><strong>Input:</strong> {currentQ.input_format}</p>}
                  {currentQ.output_format && <p><strong>Output:</strong> {currentQ.output_format}</p>}
                  {currentQ.constraints && <p><strong>Constraints:</strong> {currentQ.constraints}</p>}
                  <textarea
                    rows={16}
                    value={currAns.code ?? currentQ.starter_code ?? ''}
                    onChange={(e) => handleCodeChange(currentQ.question_id, e.target.value)}
                    spellCheck="false"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '16px', borderRadius: '10px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '14px' }}
                  />
                </div>
              )}

              {(currentQ.question_type === 'mcq' || currentQ.question_type === 'true_false') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentQ.options.map((opt) => {
                    const isSelected = (currAns.selected_option_ids || []).includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleOptionSelect(currentQ.question_id, opt.id, false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '16px 20px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #3563e9' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="radio"
                          name={`q_${currentQ.question_id}`}
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ width: '18px', height: '18px', accentColor: '#3563e9', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '15px', color: isSelected ? '#1e40af' : 'var(--text-primary, #334155)', fontWeight: isSelected ? '600' : '400' }}>
                          {opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQ.question_type === 'msq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentQ.options.map((opt) => {
                    const isSelected = (currAns.selected_option_ids || []).includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        onClick={() => handleOptionSelect(currentQ.question_id, opt.id, true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '16px 20px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #3563e9' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ width: '18px', height: '18px', accentColor: '#3563e9', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '15px', color: isSelected ? '#1e40af' : 'var(--text-primary, #334155)', fontWeight: isSelected ? '600' : '400' }}>
                          {opt.text}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQ.question_type === 'text' && (
                <div>
                  <textarea
                    rows={6}
                    value={currAns.answer_text || ''}
                    onChange={(e) => handleTextAnswerChange(currentQ.question_id, e.target.value)}
                    placeholder="Enter your detailed answer here..."
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM NAVIGATION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={handlePrevQuestion}
              disabled={currentIdx === 0}
              style={{
                padding: '12px 24px',
                background: currentIdx === 0 ? '#f1f5f9' : '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: currentIdx === 0 ? '#94a3b8' : '#334155',
                fontWeight: '600',
                cursor: currentIdx === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>

            {currentIdx < testData.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                style={{
                  padding: '12px 28px',
                  background: '#3563e9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(53,99,233,0.25)'
                }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                style={{
                  padding: '12px 28px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)'
                }}
              >
                Submit Test
              </button>
            )}
          </div>
        </div>

        {/* SIDEBAR QUESTION NAVIGATOR */}
        <div style={{ background: 'var(--bg-card, #ffffff)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Question Palette</h4>

          {/* Grid of Question Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {testData.questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const ans = answers[q.question_id];
              const isAnswered = ans && ((ans.selected_option_ids && ans.selected_option_ids.length > 0) || (ans.answer_text && ans.answer_text.trim().length > 0) || (ans.code && ans.code.trim().length > 0));

              let bg = '#f1f5f9';
              let border = '1px solid #cbd5e1';
              let color = '#475569';

              if (isCurrent) {
                bg = '#3563e9';
                color = '#ffffff';
                border = '2px solid #1d4ed8';
              } else if (isAnswered) {
                bg = '#dcfce7';
                color = '#15803d';
                border = '1px solid #86efac';
              }

              return (
                <button
                  key={q.question_id}
                  onClick={() => handleQuestionJump(idx)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: bg,
                    border: border,
                    color: color,
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#3563e9' }}></span>
              <span style={{ color: '#475569' }}>Current Question</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#dcfce7', border: '1px solid #86efac' }}></span>
              <span style={{ color: '#475569' }}>Answered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}></span>
              <span style={{ color: '#475569' }}>Unanswered</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', width: '90%', maxWidth: '480px', padding: '32px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Submit Assessment?</h3>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.5', marginBottom: '20px' }}>
              You have answered <strong>{getAnsweredCount()}</strong> of <strong>{testData.questions.length}</strong> questions.
              Once submitted, you cannot modify your answers.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                style={{ padding: '10px 24px', background: '#16a34a', border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
