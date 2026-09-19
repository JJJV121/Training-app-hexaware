import React, { useState, useEffect } from 'react';
import feedbackService from '../../services/feedbackService';
import reportService from '../../services/reportService';
import Icon from '../../components/Icon';

export default function TrainerFeedbackScreen() {
  const [trainees, setTrainees] = useState([]);
  const [selectedTraineeId, setSelectedTraineeId] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Qualitative Ratings
  const [techRating, setTechRating] = useState(5);
  const [problemRating, setProblemRating] = useState(5);
  const [commRating, setCommRating] = useState(5);
  const [attitudeRating, setAttitudeRating] = useState(5);
  const [partRating, setPartRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);

  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [comments, setComments] = useState('');

  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    try {
      setLoading(true);
      const list = await reportService.getTraineesReportList();
      setTrainees(list || []);
      if (list && list.length > 0) {
        handleSelectTrainee(list[0].trainee_id, list[0].batch_id);
      }
    } catch (err) {
      console.error('Failed to load assigned trainees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrainee = async (tId, bId) => {
    setSelectedTraineeId(tId);
    setSuccessMsg(null);
    try {
      const card = await reportService.getTraineePerformanceCard(tId, bId);
      setSelectedCard(card);
      
      const trFb = card.trainer_feedback || {};
      setTechRating(trFb.technical_skills_rating || 5);
      setProblemRating(trFb.problem_solving_rating || 5);
      setCommRating(trFb.communication_rating || 5);
      setAttitudeRating(trFb.learning_attitude_rating || 5);
      setPartRating(trFb.participation_rating || 5);
      setOverallRating(trFb.overall_rating || 5);
      setStrengths(trFb.strengths || '');
      setImprovements(trFb.areas_for_improvement || '');
      setComments(trFb.comments || '');
    } catch (err) {
      console.error('Error fetching trainee telemetry:', err);
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedTraineeId || !selectedCard) return;

    setSubmitLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await feedbackService.submitTrainerEvaluation({
        trainee_id: Number(selectedTraineeId),
        batch_id: selectedCard.personal_info.batch_no_id || 1,
        technical_skills_rating: techRating,
        problem_solving_rating: problemRating,
        communication_rating: commRating,
        learning_attitude_rating: attitudeRating,
        participation_rating: partRating,
        overall_rating: overallRating,
        strengths,
        areas_for_improvement: improvements,
        comments,
      });

      setSuccessMsg(`Qualitative feedback for ${selectedCard.personal_info.name} recorded successfully!`);
    } catch (err) {
      console.error('Error submitting trainer evaluation:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to record evaluation.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderStarInput = (val, setVal, label) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setVal(s)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: s <= val ? '#f59e0b' : '#cbd5e1', cursor: 'pointer', padding: 0 }}
          >
            ★
          </button>
        ))}
        <span style={{ marginLeft: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#475569', minWidth: '35px', textAlign: 'right' }}>
          {val} / 5
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Trainer Qualitative Feedback & Evaluation
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
          Select an assigned trainee to view auto-loaded attendance & performance telemetry, and submit qualitative assessment feedback.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading assigned trainees list...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          {/* Trainee List Column */}
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Assigned Trainees ({trainees.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '550px', overflowY: 'auto' }}>
              {trainees.map((t) => (
                <button
                  type="button"
                  key={t.trainee_id}
                  onClick={() => handleSelectTrainee(t.trainee_id, t.batch_id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedTraineeId === t.trainee_id ? '#2563eb' : '#e2e8f0',
                    backgroundColor: selectedTraineeId === t.trainee_id ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedTraineeId === t.trainee_id ? '#1e40af' : '#0f172a' }}>{t.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.employee_id} • {t.batch_name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form & Telemetry Column */}
          {selectedCard && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Telemetry Summary Card */}
              <div style={{ padding: '18px 20px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Attendance</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d' }}>{selectedCard.attendance.percentage}</div>
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>{selectedCard.attendance.total_present_days} / {selectedCard.attendance.total_no_of_days} Days</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ranking Details</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb' }}>{selectedCard.performance_metrics.ranking_details}</div>
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>Composite: {selectedCard.performance_metrics.composite_score}%</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Final Training Status</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{selectedCard.personal_info.training_status}</div>
                </div>
              </div>

              {successMsg && (
                <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontWeight: 600 }}>
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 600 }}>
                  {errorMsg}
                </div>
              )}

              {/* Evaluation Form */}
              <form onSubmit={handleSubmitEvaluation} style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                  Evaluate {selectedCard.personal_info.name}
                </h3>

                <div>
                  {renderStarInput(techRating, setTechRating, 'Technical Skills & Code Quality')}
                  {renderStarInput(problemRating, setProblemRating, 'Problem Solving & Logic')}
                  {renderStarInput(commRating, setCommRating, 'Communication & Teamwork')}
                  {renderStarInput(attitudeRating, setAttitudeRating, 'Learning Attitude & Discipline')}
                  {renderStarInput(partRating, setPartRating, 'Lab Participation & Engagement')}
                  {renderStarInput(overallRating, setOverallRating, 'Overall Trainer Assessment')}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Key Strengths</label>
                  <textarea
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Highlight trainee's top technical and soft skill strengths..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Areas for Improvement</label>
                  <textarea
                    rows={2}
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="Specific skills or lab topics needing focus..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Trainer General Remarks</label>
                  <textarea
                    rows={2}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Overall summary or notes for Batch Coordinator & Admin..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  {submitLoading ? 'Saving Evaluation...' : 'Save Qualitative Feedback'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
