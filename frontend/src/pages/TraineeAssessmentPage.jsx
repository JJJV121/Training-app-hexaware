import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';
import courseService from '../services/courseService';
import { proctoredTestService } from '../services/proctoredTestService';
import ProctoredTestView from './ProctoredTestView';

export default function TraineeAssessmentPage({ onLockChange }) {
  const [courseDayId, setCourseDayId] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  useEffect(() => {
    let mounted = true;
    const loadAssessments = async () => {
      try {
        const dashboard = await dashboardService.getDashboardData(userId);
        const courseId = Number(localStorage.getItem('selected_course_id')) || dashboard?.course?.id || 1;
        const currentDay = Number(dashboard?.current_course?.current_day || dashboard?.course?.current_day || 1);
        const content = await courseService.getCourseContent(courseId);
        const day = (content?.days || []).find(item => Number(item.day_number) === currentDay);
        const dayId = day?.day_id || day?.id || currentDay;
        const list = await proctoredTestService.getAssessmentsByDay(dayId);
        if (mounted) {
          setCourseDayId(dayId);
          setAssessments(list || []);
        }
      } catch (err) {
        if (mounted) setError(err.response?.data?.detail || 'Unable to load assessments.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAssessments();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading assessments...</div>;
  if (selectedAssessmentId) {
    return <ProctoredTestView assessmentId={selectedAssessmentId} onBack={() => { setSelectedAssessmentId(null); onLockChange?.(false); }} />;
  }
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{error}</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Assessments</h2>
      <p style={{ color: 'var(--text-medium)' }}>Assessments for your current training day.</p>
      {assessments.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-medium)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>No assessments are scheduled for this day.</div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {assessments.map((assessment) => (
            <div key={assessment.assessment_id} style={{ padding: '22px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-dark)' }}>{assessment.title}</h3>
                <span style={{ color: 'var(--text-medium)', fontSize: '13px' }}>{assessment.assessment_type} • {assessment.duration_minutes} minutes • {assessment.total_marks} marks</span>
              </div>
              <button type="button" onClick={() => { setSelectedAssessmentId(assessment.assessment_id); onLockChange?.(true); }} style={{ padding: '10px 18px', border: 0, borderRadius: '8px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Start Assessment</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}