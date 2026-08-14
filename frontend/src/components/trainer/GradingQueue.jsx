import React, { useState } from 'react';
import Icon from '../Icon';
import { INITIAL_GRADING_QUEUE } from '../../data/trainerMockData';
import '../../styles/trainer/grading-queue.css';

export default function GradingQueue() {
  const [queue, setQueue] = useState(INITIAL_GRADING_QUEUE);
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const selectedItem = queue.find((item) => item.id === selectedId);

  const handleSelect = (id) => {
    setSelectedId(id);
    setScore('');
    setFeedback('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!score || isNaN(score) || Number(score) < 0 || Number(score) > 100) {
      alert('Please enter a valid numeric score between 0 and 100.');
      return;
    }

    alert(`Grade registered successfully!\nScore: ${score}/100\nFeedback: "${feedback}"`);

    // Remove the item from the local state list to simulate real deletion
    const updatedQueue = queue.filter((item) => item.id !== selectedId);
    setQueue(updatedQueue);
    setSelectedId(null);
    setScore('');
    setFeedback('');
  };

  return (
    <div className="grading-container">
      {/* Page Header */}
      <div className="grading-banner">
        <div className="grading-banner-left">
          <h2>Grading Queue & Assessment Hub</h2>
          <p>Evaluate trainee code submissions, assign grades, and submit code-level review feedback.</p>
        </div>
        <div className="grading-banner-right">
          <div className="queue-count-pill">
            <Icon name="clipboard-check" style={{ width: '15px', height: '15px' }} />
            <span>Pending Evaluation: {queue.length} Tasks</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grading-split-layout">
        {/* Left Side: Pending List */}
        <div className="queue-panel-card">
          <div className="queue-panel-header">
            <h3 className="queue-panel-title">Pending Submissions</h3>
          </div>
          <div className="queue-list">
            {queue.length === 0 ? (
              <div style={{ padding: '40px', textAlignment: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
                All clear! No pending assessments in the queue.
              </div>
            ) : (
              queue.map((item) => (
                <button
                  key={item.id}
                  className={`queue-item ${selectedId === item.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(item.id)}
                >
                  <div className="queue-item-top">
                    <div className="queue-trainee-info">
                      <div 
                        className="queue-trainee-avatar" 
                        style={{ backgroundColor: item.color || '#3563e9' }}
                      >
                        {item.initials}
                      </div>
                      <span className="queue-trainee-name">{item.traineeName}</span>
                    </div>
                    <span className="queue-date">{item.submittedDate}</span>
                  </div>
                  <div className="queue-item-mid">
                    <div className="queue-task-title">{item.taskTitle}</div>
                    <span className="queue-module-badge">{item.module}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Active Review Blade */}
        <div className="review-blade-card">
          {!selectedItem ? (
            <div className="review-blade-empty">
              <Icon name="clipboard-check" className="review-blade-empty-icon" />
              <h3>No Submission Selected</h3>
              <p style={{ marginTop: '8px', fontSize: '13px' }}>
                Select an assignment from the queue panel on the left to start evaluating.
              </p>
            </div>
          ) : (
            <>
              <div className="review-header">
                <div className="review-title-row">
                  <div className="review-trainee-meta">
                    <h3 className="review-trainee-name">{selectedItem.traineeName}</h3>
                    <span className="review-trainee-id">ID: {selectedItem.employeeId}</span>
                  </div>
                  <div className="review-task-info" style={{ textAlign: 'right' }}>
                    <span className="review-task-module">{selectedItem.module}</span>
                    <span className="review-task-title">{selectedItem.taskTitle}</span>
                  </div>
                </div>
              </div>

              {/* Submitted Work Text Block */}
              <div className="submission-container">
                <span className="submission-label">Submitted Work:</span>
                <pre className="submission-code-block">
                  <code>{selectedItem.submittedCode}</code>
                </pre>
              </div>

              {/* Evaluation Form */}
              <form onSubmit={handleSubmit} className="evaluation-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label htmlFor="score-input" className="form-label">Score (out of 100)</label>
                    <input
                      id="score-input"
                      type="number"
                      min="0"
                      max="100"
                      className="form-input-number"
                      placeholder="e.g. 85"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="feedback-input" className="form-label">Review Feedback</label>
                    <textarea
                      id="feedback-input"
                      className="form-textarea"
                      placeholder="Enter detailed feedback here..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <button type="submit" className="grade-submit-btn">
                  <Icon name="send" style={{ width: '16px', height: '16px' }} />
                  Submit Assessment & Log Grade
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
