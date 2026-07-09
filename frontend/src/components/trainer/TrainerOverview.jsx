import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import { KPI_DATA, UPCOMING_SESSIONS } from '../../data/trainerMockData';
import '../../styles/trainer/trainer-overview.css';

export default function TrainerOverview() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(KPI_DATA.nextSessionISO) - +new Date();
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
  }, []);

  const handleAction = (actionName) => {
    alert(`Action triggered: "${actionName}"`);
  };

  return (
    <div className="trainer-overview-container">
      {/* 1. Header Banner */}
      <div className="trainer-banner">
        <div className="trainer-banner-left">
          <span className="trainer-banner-eyebrow">Hexaware LMS Portal</span>
          <h2 className="trainer-banner-title">Welcome back, Rajesh! 👋</h2>
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
          <span className="kpi-value">{KPI_DATA.totalTrainees}</span>
          <span className="kpi-label">Total Assigned Trainees</span>
        </div>

        {/* Active Batches */}
        <div className="trainer-kpi-card kpi-green">
          <div className="kpi-icon-wrap">
            <Icon name="graduation-cap" />
          </div>
          <span className="kpi-value">{KPI_DATA.activeBatches}</span>
          <span className="kpi-label">Active Batches/Courses</span>
        </div>

        {/* Pending Assignments to Grade */}
        <div className="trainer-kpi-card kpi-amber">
          <div className="kpi-icon-wrap">
            <Icon name="clipboard-check" />
          </div>
          <div className="kpi-value">
            {KPI_DATA.pendingGrades}
            <span className="pending-badge">Action Required</span>
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
            {UPCOMING_SESSIONS.map((session) => (
              <div key={session.id} className="session-item">
                <div className={`session-icon-wrap ${session.colorClass}`}>
                  <Icon name={session.icon} style={{ width: '20px', height: '20px' }} />
                </div>
                <div className="session-info">
                  <h4 className="session-title">{session.title}</h4>
                  <div className="session-meta">
                    <span>{session.date}</span>
                    <span className="session-meta-dot"></span>
                    <span>{session.time}</span>
                    <span className="session-meta-dot"></span>
                    <span className="session-batch-label">{session.batch}</span>
                  </div>
                </div>
                <span className={`session-type-badge ${
                  session.type === 'Live Session' ? 'badge-blue' :
                  session.type === 'Workshop' ? 'badge-green' : 'badge-amber'
                }`}>
                  {session.type}
                </span>
              </div>
            ))}
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
