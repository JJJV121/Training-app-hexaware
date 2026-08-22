import { useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import '../styles/codingWorkspace.css';

const LANG_OPTIONS = [
  { id: 'c', name: 'C (17)', monaco: 'c' },
  { id: 'cpp', name: 'C++', monaco: 'cpp' },
  { id: 'java', name: 'Java', monaco: 'java' },
  { id: 'python', name: 'Python 3', monaco: 'python' },
  { id: 'mysql', name: 'MySQL', monaco: 'sql' },
];

function monacoLanguage(language) {
  const key = String(language || 'python').toLowerCase();
  if (key === 'mysql' || key === 'sql') return 'sql';
  if (key === 'c++') return 'cpp';
  if (key === 'py' || key === 'python3') return 'python';
  return key;
}

function formatTime(totalSec) {
  const mins = Math.floor(Math.max(0, totalSec) / 60);
  const secs = Math.max(0, totalSec) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function CodingWorkspace({
  title,
  sectionLabel,
  userName,
  userRoll,
  remainingSeconds,
  questions,
  currentIndex,
  onSelectQuestion,
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onClear,
  onRun,
  onSaveCode,
  onSubmitTest,
  onNext,
  runResult,
  isRunning,
  isSaving,
  isSubmitting,
  statuses,
  bookmarked,
  onToggleBookmark,
  watermark,
}) {
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const currentQ = questions[currentIndex] || {};
  const total = questions.length;

  const counts = useMemo(() => {
    const result = { answered: 0, bookmarked: 0, skipped: 0, notViewed: 0, saved: 0 };
    questions.forEach((q, idx) => {
      const status = statuses?.[q.id] || statuses?.[idx] || 'not_viewed';
      if (status === 'answered') result.answered += 1;
      else if (status === 'saved') result.saved += 1;
      else if (status === 'skipped') result.skipped += 1;
      else result.notViewed += 1;
      if (bookmarked?.[q.id] || bookmarked?.[idx]) result.bookmarked += 1;
    });
    return result;
  }, [questions, statuses, bookmarked]);

  const qId = currentQ.id;
  const isBookmarked = !!(bookmarked?.[qId] || bookmarked?.[currentIndex]);

  const consoleText = useMemo(() => {
    if (!runResult) return 'Click Compile & Run to execute your code against sample inputs.';
    const passed = runResult.passed_tests ?? runResult.passed ?? 0;
    const totalTests = runResult.total_tests ?? runResult.total ?? 0;
    const lines = [
      `Status: ${runResult.status || 'unknown'}`,
      `Passed: ${passed} / ${totalTests}`,
      runResult.output || '',
    ];
    (runResult.test_results || []).forEach((item) => {
      const label = item.is_hidden ? 'Hidden' : `Case ${item.test_case}`;
      lines.push(`${label}: ${item.status}${item.output && !item.is_hidden ? ` → ${item.output}` : ''}`);
    });
    return lines.filter(Boolean).join('\n');
  }, [runResult]);

  return (
    <div className="cw-shell">
      <div className="cw-online">Internet Status: Online</div>
      <header className="cw-topbar">
        <div className="cw-top-left">
          <div className="cw-crumb" title={title}>{title}</div>
          <div className="cw-section">{sectionLabel || `Section 1/1 | Coding (${total})`}</div>
        </div>
        <div className="cw-top-right">
          <div className="cw-user">
            <strong>{userName || 'Trainee'}</strong>
            <span>{userRoll || ''}</span>
          </div>
          {typeof remainingSeconds === 'number' && (
            <div className={`cw-timer ${remainingSeconds < 300 ? 'warn' : ''}`}>⏱ {formatTime(remainingSeconds)}</div>
          )}
          <button type="button" className="cw-submit-test" disabled={isSubmitting} onClick={() => setConfirmSubmit(true)}>
            Submit Test
          </button>
        </div>
      </header>

      <div className="cw-body">
        <aside className="cw-nav">
          <div className="cw-qgrid">
            {questions.map((q, idx) => {
              const status = statuses?.[q.id] || statuses?.[idx] || 'not_viewed';
              const cls = [
                'cw-qbtn',
                idx === currentIndex ? 'current' : '',
                status,
              ].filter(Boolean).join(' ');
              return (
                <button key={q.id || idx} type="button" className={cls} onClick={() => onSelectQuestion(idx)}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="cw-legend">
            <div className="cw-legend-row"><span><i className="cw-dot" style={{ background: '#16a34a' }} /> Answered</span><strong>{counts.answered}/{total}</strong></div>
            <div className="cw-legend-row"><span><i className="cw-dot" style={{ background: '#eab308' }} /> Bookmarked</span><strong>{counts.bookmarked}/{total}</strong></div>
            <div className="cw-legend-row"><span><i className="cw-dot" style={{ background: '#dc2626' }} /> Skipped</span><strong>{counts.skipped}/{total}</strong></div>
            <div className="cw-legend-row"><span><i className="cw-dot" style={{ background: '#94a3b8' }} /> Not Viewed</span><strong>{counts.notViewed}/{total}</strong></div>
            <div className="cw-legend-row"><span><i className="cw-dot" style={{ background: '#2563eb' }} /> Saved in Server</span><strong>{counts.saved}/{total}</strong></div>
          </div>
        </aside>

        <section className="cw-problem">
          <div className="cw-problem-head">
            <h3>Question No: {currentIndex + 1} / {total}</h3>
            <button type="button" className={`cw-bookmark ${isBookmarked ? 'on' : ''}`} onClick={() => onToggleBookmark?.(qId, currentIndex)}>
              ★
            </button>
          </div>
          <div className="cw-problem-scroll">
            {watermark && (
              <div className="cw-watermark">
                {Array.from({ length: 18 }).map((_, i) => <span key={i}>{watermark}</span>)}
              </div>
            )}
            <div className="cw-qtype">Single File Programming Question</div>
            <div className="cw-block">
              <h4>Problem Statement</h4>
              <p>{currentQ.problemStatement || currentQ.questionText || currentQ.title}</p>
            </div>
            {currentQ.inputFormat && (
              <div className="cw-block">
                <h4>Input format:</h4>
                <pre>{currentQ.inputFormat}</pre>
              </div>
            )}
            {currentQ.outputFormat && (
              <div className="cw-block">
                <h4>Output format:</h4>
                <pre>{currentQ.outputFormat}</pre>
              </div>
            )}
            {currentQ.constraints && (
              <div className="cw-block">
                <h4>Constraints:</h4>
                <pre>{currentQ.constraints}</pre>
              </div>
            )}
            {currentQ.sampleInput && (
              <div className="cw-block">
                <h4>Sample Input:</h4>
                <pre>{currentQ.sampleInput}</pre>
              </div>
            )}
            {currentQ.sampleOutput && (
              <div className="cw-block">
                <h4>Sample Output:</h4>
                <pre>{currentQ.sampleOutput}</pre>
              </div>
            )}
            <div className="cw-marks">Marks : {currentQ.marks ?? currentQ.points ?? 10} &nbsp;|&nbsp; Negative Marks : 0</div>
          </div>
        </section>

        <section className="cw-editor">
          <div className="cw-editor-head">
            <span>Fill your code here</span>
            <select
              className="cw-lang"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {(currentQ.languages || LANG_OPTIONS).map((lang) => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div className="cw-editor-body">
            <Editor
              height="100%"
              language={monacoLanguage(language)}
              theme="vs-dark"
              value={code || ''}
              onChange={(value) => onCodeChange(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
          <div className="cw-console">
            <div className="cw-console-head">Compiler output</div>
            <div className="cw-console-body">{isRunning ? 'Compiling and running...' : consoleText}</div>
          </div>
        </section>
      </div>

      <footer className="cw-footer">
        <button type="button" className="cw-btn ghost" onClick={onClear}>Clear</button>
        <div className="cw-footer-right">
          <button type="button" className="cw-btn" disabled={isRunning} onClick={onRun}>
            {isRunning ? 'Running...' : 'Compile & Run'}
          </button>
          <button type="button" className="cw-btn primary" disabled={isSaving} onClick={onSaveCode}>
            {isSaving ? 'Saving...' : 'Submit Code'}
          </button>
          <button type="button" className="cw-btn primary" onClick={onNext} disabled={currentIndex >= total - 1 && !onNext}>
            Next
          </button>
        </div>
      </footer>

      {confirmSubmit && (
        <div className="cw-modal-overlay">
          <div className="cw-modal">
            <h3>Submit Test?</h3>
            <p>Your answers will be evaluated on the server. You cannot change them after submission.</p>
            <div className="cw-modal-actions">
              <button type="button" className="cw-btn" onClick={() => setConfirmSubmit(false)}>Cancel</button>
              <button
                type="button"
                className="cw-btn primary"
                disabled={isSubmitting}
                onClick={() => {
                  setConfirmSubmit(false);
                  onSubmitTest();
                }}
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
