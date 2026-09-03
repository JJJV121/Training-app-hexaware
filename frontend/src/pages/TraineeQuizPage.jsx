import { useEffect, useState } from 'react';
import dashboardService from '../services/dashboardService';
import courseService from '../services/courseService';
import { QnASection } from './Course';

export default function TraineeQuizPage() {
  const [courseDayId, setCourseDayId] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  useEffect(() => {
    let mounted = true;
    const loadDay = async () => {
      try {
        const dashboard = await dashboardService.getDashboardData(userId);
        const activeCourseId = Number(localStorage.getItem('selected_course_id')) || dashboard?.course?.id || 1;
        const currentDay = Number(dashboard?.current_course?.current_day || dashboard?.course?.current_day || 1);
        const content = await courseService.getCourseContent(activeCourseId);
        const day = (content?.days || []).find(item => Number(item.day_number) === currentDay);
        if (mounted) {
          setCourseId(activeCourseId);
          setCourseDayId(day?.day_id || day?.id || currentDay);
        }
      } catch (err) {
        if (mounted) setError('Unable to load the current training day.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadDay();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading quiz...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{error}</div>;
  return (
    <div className="no-copy">
      <QnASection courseId={courseId} dayId={courseDayId} />
    </div>
  );
}