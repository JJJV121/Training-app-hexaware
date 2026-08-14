import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import trainerService from '../../services/trainerService';
import '../../styles/trainer/trainer-overview.css';

export default function TrainerOverview() {
  const [kpiData, setKpiData] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: true });

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
        console.error('Failed to load overview data:', err);
        setError('Error loading dashboard analytics');
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

  const handleAction = (actionName) => {
    alert(`Action triggered: "${actionName}"`);
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
          <span className="trainer-banner-eyebrow">Hexaware LMS Portal</span>
          <h2 className="trainer-banner-title">Welcome back, {trainerName}! 👋</h2>
          <p className="trainer-banner-subtitle">Empowering trainees. Shaping the future.</p>
        </div>
        <div className="trainer-banner-right">
          <div className="trainer-badge">
            <Icon name="user-check" style={{ width: '16px', height: '16px' }} />
            <span>Senior Trainer</span>
          </div>
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
          <div className="kpi-value">
            {kpiData?.pending_grades || 0}
            {kpiData?.pending_grades > 0 && <span className="pending-badge">Action Required</span>}
          </div>
          <span className="kpi-label">Pending Assignments to Grade</span>
        </div>

        {/* Next Live Session Countdown */}
        <div className="trainer-kpi-card kpi-purple">
          <div className="kpi-icon-wrap">
            <Icon name="timer" />
          </div>
          {timeLeft.expired ? (
            <span className="timer-expired">Session in progress / ended</span>
          ) : (
            <div className="kpi-timer-display">
              <div className="timer-unit">
                <span className="timer-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="timer-label">hrs</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-unit">
                <span className="timer-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="timer-label">mins</span>
              </div>
              <span className="timer-sep">:</span>
              <div className="timer-unit">
                <span className="timer-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="timer-label">secs</span>
              </div>
            </div>
          )}
          <span className="kpi-label">Next Live Session Countdown</span>
        </div>
      </div>

      {/* 3. Bottom Grid */}
      <div className="trainer-overview-bottom">
        {/* Upcoming Schedule Widget */}
        <div className="trainer-schedule-widget">
          <div className="widget-header">
            <h3 className="widget-title">
              <span className="widget-title-icon">
                <Icon name="calendar" style={{ width: '18px', height: '18px' }} />
              </span>
              Upcoming Schedule
            </h3>
            <button className="widget-see-all" onClick={() => window.location.hash = 'scheduler'}>
              Go to Scheduler
            </button>
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
              className="trainer-action-btn action-btn-primary" 
              onClick={() => handleAction('Schedule Live Session')}
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
              className="trainer-action-btn action-btn-secondary" 
              onClick={() => handleAction('Post Batch Announcement')}
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
              className="trainer-action-btn action-btn-amber" 
              onClick={() => handleAction('Create Assessment')}
            >
              <div className="action-btn-icon">
                <Icon name="pen-square" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="action-btn-text">
                <span className="action-btn-label">Create Assessment</span>
                <span className="action-btn-sublabel">Publish custom quiz or coding lab</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
