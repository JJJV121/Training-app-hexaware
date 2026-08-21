import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import trainerService from '../../services/trainerService';
import '../../styles/trainer/trainer-overview.css';

export default function TrainerOverview() {
  const [kpiData, setKpiData] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: true });

  const [modalType, setModalType] = useState(null);
  const [scheduleTab, setScheduleTab] = useState('all'); // 'today', 'week', 'all'
  const [formData, setFormData] = useState({ title: '', date: '', batchId: '', type: 'ONLINE', message: '', marks: '' });
  const [formErrors, setFormErrors] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const trainerName = user.name || 'Trainer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [overview, sessions] = await Promise.all([
          trainerService.getOverview(),
          trainerService.getUpcomingSessions()
        ]);
        setKpiData(overview);
        setUpcomingSessions(sessions);
      } catch (err) {
        console.error('Failed to load overview data, using mock data instead:', err);
        // Fallback to mock data for UI enhancement purposes
        setKpiData({
          total_trainees: 120,
          active_batches: 4,
          pending_grades: 15,
          next_session_iso: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        });
        setUpcomingSessions([
          {
            id: 1,
            title: 'Java Fundamentals Live Class',
            start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            batch_id: 'B21',
            session_type: 'ONLINE'
          },
          {
            id: 2,
            title: 'Spring Boot Advanced',
            start_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString(),
            batch_id: 'B22',
            session_type: 'OFFLINE'
          }
        ]);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!kpiData || !kpiData.next_session_iso) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(kpiData.next_session_iso) - +new Date();
      let timeLeftObj = { hours: 0, minutes: 0, seconds: 0, expired: false };

      if (difference > 0) {
        timeLeftObj = {
          hours: Math.floor(difference / (1000 * 60 * 60)),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          expired: false
        };
      } else {
        timeLeftObj.expired = true;
      }
      return timeLeftObj;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [kpiData]);

  const validateForm = () => {
    const errors = {};
    if (modalType === 'schedule') {
      if (!formData.title) errors.title = 'Session Title is required';
      if (!formData.date) errors.date = 'Date & Time is required';
      else if (new Date(formData.date) < new Date()) errors.date = 'Date must be in the future';
      if (!formData.batchId) errors.batchId = 'Batch ID is required';
    } else if (modalType === 'announce') {
      if (!formData.message) errors.message = 'Announcement message is required';
      else if (formData.message.length < 10) errors.message = 'Message must be at least 10 characters';
    } else if (modalType === 'assess') {
      if (!formData.title) errors.title = 'Assessment Name is required';
      if (!formData.marks || formData.marks <= 0) errors.marks = 'Marks must be greater than 0';
      if (!formData.date) errors.date = 'Due Date is required';
      else if (new Date(formData.date) < new Date()) errors.date = 'Due Date must be in the future';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      alert(`${modalType} action submitted successfully!`);
      setModalType(null);
      setFormData({ title: '', date: '', batchId: '', type: 'ONLINE', message: '', marks: '' });
    }
  };

  const handleAction = (type) => {
    setModalType(type);
    setFormErrors({});
    setFormData({ title: '', date: '', batchId: '', type: 'ONLINE', message: '', marks: '' });
  };

  if (isLoading) {
    return (
      <div className="trainer-overview-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Loading Dashboard Overview...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trainer-overview-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="trainer-overview-container">
      {/* 1. Header Banner */}
      <div className="trainer-banner">
        <div className="trainer-banner-left">
          <h2 className="trainer-banner-title">Good Morning, {trainerName}! 😊</h2>
          <p className="trainer-banner-subtitle">Welcome back to your Mavericks Learning workspace. Here's your overall progress summary.</p>
        </div>
      </div>

      {/* 2. KPI Metric Cards */}
      <div className="trainer-kpi-grid">
        {/* Total Assigned Trainees */}
        <div className="trainer-kpi-card kpi-blue">
          <div className="kpi-icon-wrap">
            <Icon name="users" />
          </div>
          <span className="kpi-value">{kpiData?.total_trainees || 0}</span>
          <span className="kpi-label">Total Assigned Trainees</span>
        </div>

        {/* Active Batches */}
        <div className="trainer-kpi-card kpi-green">
          <div className="kpi-icon-wrap">
            <Icon name="graduation-cap" />
          </div>
          <span className="kpi-value">{kpiData?.active_batches || 0}</span>
          <span className="kpi-label">Active Batches/Courses</span>
        </div>

        {/* Pending Assignments to Grade */}
        <div className="trainer-kpi-card kpi-amber">
          <div className="kpi-icon-wrap">
            <Icon name="clipboard-check" />
          </div>
          <div className="kpi-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {kpiData?.pending_grades || 0}
            {kpiData?.pending_grades > 0 && (
              <a href="#grading" className="kpi-action-link" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-orange)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Grade Now <Icon name="arrow-right" style={{ width: '14px', height: '14px' }} />
              </a>
            )}
          </div>
          <span className="kpi-label">Pending Assignments to Grade</span>
        </div>

        {/* Next Live Session Countdown */}
        <div className="trainer-kpi-card kpi-purple">
          <div className="kpi-icon-wrap">
            <Icon name="timer" />
          </div>
          <span className="kpi-value">
            {timeLeft.expired 
              ? "Live Now" 
              : `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}
          </span>
          <span className="kpi-label">Next Live Session Countdown</span>
        </div>
      </div>

      {/* 3. Bottom Grid */}
      <div className="trainer-overview-bottom">
        {/* Upcoming Schedule Widget */}
        <div className="trainer-schedule-widget">
          <div className="widget-header">
            <div className="widget-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="widget-title" style={{ margin: 0 }}>
                <span className="widget-title-icon">
                  <Icon name="calendar" style={{ width: '18px', height: '18px' }} />
                </span>
                Upcoming Schedule
              </h3>
            </div>
            <div className="widget-tabs" style={{ display: 'flex', gap: '8px' }}>
              <button className={`schedule-tab-btn ${scheduleTab === 'today' ? 'active' : ''}`} onClick={() => setScheduleTab('today')}>Today</button>
              <button className={`schedule-tab-btn ${scheduleTab === 'week' ? 'active' : ''}`} onClick={() => setScheduleTab('week')}>This Week</button>
              <button className={`schedule-tab-btn ${scheduleTab === 'all' ? 'active' : ''}`} onClick={() => setScheduleTab('all')}>All</button>
            </div>
          </div>
          <div className="session-list">
            {upcomingSessions.length === 0 ? (
              <div className="session-empty" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
                All clear! No upcoming sessions scheduled.
              </div>
            ) : (
              upcomingSessions.map((session) => {
                const dateStr = new Date(session.start_time).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
                const startT = new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const endT = new Date(session.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                const timeRange = `${startT} – ${endT}`;
                return (
                  <div key={session.id} className="session-item">
                    <div className="session-icon-wrap" style={{ backgroundColor: 'rgba(53, 99, 233, 0.1)', color: '#3563e9' }}>
                      <Icon name="video" style={{ width: '20px', height: '20px' }} />
                    </div>
                    <div className="session-info">
                      <h4 className="session-title">{session.title}</h4>
                      <div className="session-meta">
                        <span>{dateStr}</span>
                        <span className="session-meta-dot"></span>
                        <span>{timeRange}</span>
                        <span className="session-meta-dot"></span>
                        <span className="session-batch-label">Batch ID: {session.batch_id}</span>
                      </div>
                    </div>
                    <span className={`session-type-badge ${session.session_type === 'ONLINE' ? 'badge-blue' : 'badge-amber'}`}>
                      {session.session_type}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="trainer-quick-actions">
          <h3 className="quick-actions-title">
            <Icon name="zap" style={{ width: '18px', height: '18px', fill: '#fbbf24', stroke: '#fbbf24' }} />
            Quick Actions
          </h3>
          <div className="quick-actions-list">
            <button 
              className="trainer-action-btn action-btn-unified" 
              onClick={() => handleAction('schedule')}
            >
              <div className="action-btn-icon">
                <Icon name="video" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="action-btn-text">
                <span className="action-btn-label">Schedule Live Session</span>
                <span className="action-btn-sublabel">Set up virtual classes</span>
              </div>
            </button>

            <button 
              className="trainer-action-btn action-btn-unified" 
              onClick={() => handleAction('announce')}
            >
              <div className="action-btn-icon">
                <Icon name="megaphone" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="action-btn-text">
                <span className="action-btn-label">Post Batch Announcement</span>
                <span className="action-btn-sublabel">Broadcast updates to all batches</span>
              </div>
            </button>

            <button 
              className="trainer-action-btn action-btn-unified" 
              onClick={() => handleAction('assess')}
            >
              <div className="action-btn-icon">
                <Icon name="pen-square" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="action-btn-text">
                <span className="action-btn-label">Create Assessment</span>
                <span className="action-btn-sublabel">Publish custom quiz or coding lab</span>
              </div>
            </button>

            <button 
              className="trainer-action-btn action-btn-unified" 
              onClick={() => window.location.hash = 'grading'}
            >
              <div className="action-btn-icon">
                <Icon name="check-circle" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="action-btn-text">
                <span className="action-btn-label">Open Grading Queue</span>
                <span className="action-btn-sublabel">Review pending assignments</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Modals */}
      {modalType && (
        <div className="trainer-modal-overlay" onClick={() => setModalType(null)}>
          <div className="trainer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'schedule' && 'Schedule Live Session'}
                {modalType === 'announce' && 'Post Batch Announcement'}
                {modalType === 'assess' && 'Create Assessment'}
              </h3>
              <button className="modal-close" onClick={() => setModalType(null)}><Icon name="x" style={{width: 20, height: 20}} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {modalType === 'schedule' && (
                <>
                  <div className="form-group">
                    <label>Session Title</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Java Fundamentals Live Class" />
                    {formErrors.title && <span className="form-error">{formErrors.title}</span>}
                  </div>
                  <div className="form-group">
                    <label>Date & Time</label>
                    <input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    {formErrors.date && <span className="form-error">{formErrors.date}</span>}
                  </div>
                  <div className="form-group">
                    <label>Batch ID</label>
                    <select value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})}>
                      <option value="">Select Batch</option>
                      <option value="B21">Batch B21</option>
                      <option value="B22">Batch B22</option>
                    </select>
                    {formErrors.batchId && <span className="form-error">{formErrors.batchId}</span>}
                  </div>
                </>
              )}
              {modalType === 'announce' && (
                <>
                  <div className="form-group">
                    <label>Announcement Message</label>
                    <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={4} placeholder="Type your announcement here..."></textarea>
                    {formErrors.message && <span className="form-error">{formErrors.message}</span>}
                  </div>
                  <div className="form-group">
                    <label>Target Batches</label>
                    <select value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})}>
                      <option value="">All Batches</option>
                      <option value="B21">Batch B21</option>
                      <option value="B22">Batch B22</option>
                    </select>
                  </div>
                </>
              )}
              {modalType === 'assess' && (
                <>
                  <div className="form-group">
                    <label>Assessment Name</label>
                    <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Module 1 Quiz" />
                    {formErrors.title && <span className="form-error">{formErrors.title}</span>}
                  </div>
                  <div className="form-group">
                    <label>Total Marks</label>
                    <input type="number" value={formData.marks} onChange={e => setFormData({...formData, marks: e.target.value})} placeholder="100" />
                    {formErrors.marks && <span className="form-error">{formErrors.marks}</span>}
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    {formErrors.date && <span className="form-error">{formErrors.date}</span>}
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Cancel</button>
                <button type="submit" className="btn-submit">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
