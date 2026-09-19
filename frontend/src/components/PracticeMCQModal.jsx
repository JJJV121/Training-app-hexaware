import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';

export default function PracticeMCQModal({ unitId, topicName, courseId, onClose }) {
  const [mcqs, setMcqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  const fetchMCQs = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsSubmitted(false);
      setSelectedAnswers({});
      setScoreResult(null);
      setCurrentIdx(0);

      let url = `/practice/topics/${encodeURIComponent(topicName)}/mcqs`;
      if (unitId) {
        url = `/practice/units/${unitId}/mcqs`;
      }

      const res = await apiClient.get(url);
      setMcqs(res.data?.mcqs || []);
    } catch (err) {
      console.error("Error loading practice MCQs:", err);
      setError("Failed to load practice questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMCQs();
  }, [unitId, topicName]);

  const handleSelectOption = (optionIdx) => {
    if (isSubmitted) return;
    const q = mcqs[currentIdx];
    const isMultiple = (q.correct_indices || []).length > 1;
    setSelectedAnswers(prev => {
      if (!isMultiple) return { ...prev, [q.id]: optionIdx };
      const selected = Array.isArray(prev[q.id]) ? prev[q.id] : [];
      return {
        ...prev,
        [q.id]: selected.includes(optionIdx)
          ? selected.filter((index) => index !== optionIdx)
          : [...selected, optionIdx].sort((a, b) => a - b)
      };
    });
  };

  const handleSubmit = () => {
    let correctCount = 0;
    mcqs.forEach(q => {
      const selected = Array.isArray(selectedAnswers[q.id])
        ? selectedAnswers[q.id]
        : (selectedAnswers[q.id] === undefined ? [] : [selectedAnswers[q.id]]);
      const correct = q.correct_indices || [q.correct_index];
      if (selected.length === correct.length && selected.every((index) => correct.includes(index))) {
        correctCount++;
      }
    });

    const total = mcqs.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    setScoreResult({
      correctCount,
      total,
      percentage,
      passed: percentage >= 75
    });
    setIsSubmitted(true);
  };

  const getDifficultyBadgeStyle = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d === 'hard') return { bg: '#fee2e2', color: '#b91c1c' };
    if (d === 'medium') return { bg: '#fef3c7', color: '#d97706' };
    return { bg: '#dcfce7', color: '#15803d' };
  };

  if (loading) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
          <h3 style={{ margin: 0, color: 'var(--text-dark, #0f172a)' }}>Loading Practice MCQs...</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '8px' }}>Generating 25 randomized questions for {topicName}</p>
        </div>
      </div>
    );
  }

  if (error || mcqs.length === 0) {
    return (
      <div style={overlayStyle}>
        <div style={{ ...modalStyle, textAlign: 'center', padding: '32px' }}>
          <h3 style={{ color: '#dc2626' }}>{error || "No practice questions available for this topic."}</h3>
          <button onClick={onClose} style={btnPrimaryStyle}>Close</button>
        </div>
      </div>
    );
  }

  const currentQ = mcqs[currentIdx];
  const selectedOpt = selectedAnswers[currentQ.id];
  const selectedOptions = Array.isArray(selectedOpt) ? selectedOpt : (selectedOpt === undefined ? [] : [selectedOpt]);

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Topic Practice MCQ</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{topicName}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {/* Progress & Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0', fontSize: '0.85rem', color: '#475569' }}>
          <span>Question <strong>{currentIdx + 1}</strong> of <strong>{mcqs.length}</strong></span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ ...badgeStyle, ...getDifficultyBadgeStyle(currentQ.difficulty) }}>
              {(currentQ.difficulty || 'MEDIUM').toUpperCase()}
            </span>
            <span style={{ ...badgeStyle, bg: '#f1f5f9', color: '#475569' }}>
              {currentQ.question_type || 'Concept'}
            </span>
          </div>
        </div>

        {/* Result Header if Submitted */}
        {isSubmitted && scoreResult && (
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: scoreResult.passed ? '#f0fdf4' : '#fef2f2', border: scoreResult.passed ? '1px solid #bbf7d0' : '1px solid #fca5a5', marginBottom: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 4px 0', color: scoreResult.passed ? '#15803d' : '#b91c1c' }}>
              {scoreResult.passed ? 'Great Job!' : 'Practice Complete'} — {scoreResult.percentage}% ({scoreResult.correctCount} / {scoreResult.total})
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
              Review your answers below or retake the practice session for a new set of randomized questions.
            </p>
          </div>
        )}

        {/* Question Text */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'pre-wrap' }}>
            {currentQ.question}
          </p>
        </div>

        {/* Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {currentQ.options.map((optText, optIdx) => {
            const isSelected = selectedOptions.includes(optIdx);
            const correctOptions = currentQ.correct_indices || [currentQ.correct_index];
            const isCorrect = isSubmitted && correctOptions.includes(optIdx);
            const isWrongSelection = isSubmitted && isSelected && !correctOptions.includes(optIdx);

            let bgColor = '#ffffff';
            let borderColor = '#cbd5e1';
            let textColor = '#1e293b';

            if (isSelected && !isSubmitted) {
              bgColor = '#eff6ff';
              borderColor = '#2563eb';
              textColor = '#1d4ed8';
            } else if (isCorrect) {
              bgColor = '#f0fdf4';
              borderColor = '#22c55e';
              textColor = '#15803d';
            } else if (isWrongSelection) {
              bgColor = '#fef2f2';
              borderColor = '#ef4444';
              textColor = '#b91c1c';
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                disabled={isSubmitted}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: `2px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  color: textColor,
                  fontSize: '0.95rem',
                  fontWeight: isSelected || isCorrect ? 700 : 500,
                  textAlign: 'left',
                  cursor: isSubmitted ? 'default' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span>{optText}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation when submitted */}
        {isSubmitted && (
          <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', marginBottom: '20px', fontSize: '0.88rem', color: '#334155' }}>
            <strong>Explanation:</strong> {currentQ.explanation}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              style={btnSecondaryStyle}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentIdx(prev => Math.min(mcqs.length - 1, prev + 1))}
              disabled={currentIdx === mcqs.length - 1}
              style={btnSecondaryStyle}
            >
              Next
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isSubmitted ? (
              <button onClick={fetchMCQs} style={btnPrimaryStyle}>
                🔄 Retake Practice
              </button>
            ) : (
              <button onClick={handleSubmit} style={btnPrimaryStyle}>
                Submit Practice
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 99999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px'
};

const modalStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  maxWidth: '720px',
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '24px'
};

const badgeStyle = {
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: 700
};

const btnPrimaryStyle = {
  padding: '10px 20px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer'
};

const btnSecondaryStyle = {
  padding: '8px 16px',
  backgroundColor: '#f1f5f9',
  color: '#475569',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer'
};
