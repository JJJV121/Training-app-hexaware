import React, { useState } from 'react';
import Icon from '../Icon';
import { BATCHES } from '../../data/trainerMockData';
import '../../styles/trainer/batch-management.css';

export default function BatchManagement() {
  const [activeTab, setActiveTab] = useState(BATCHES[0].id);

  const activeBatchObj = BATCHES.find((b) => b.id === activeTab) || BATCHES[0];

  const getStatusClass = (status) => {
    switch (status) {
      case 'On Track':
        return 'status-on-track';
      case 'Behind Schedule':
        return 'status-behind-schedule';
      case 'Completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  const getAttendanceClass = (pct) => {
    if (pct >= 90) return 'attendance-high';
    if (pct >= 75) return 'attendance-medium';
    return 'attendance-low';
  };

  const getProgressBarColorClass = (status) => {
    switch (status) {
      case 'On Track':
        return 'bar-blue';
      case 'Behind Schedule':
        return 'bar-amber';
      case 'Completed':
        return 'bar-green';
      default:
        return 'bar-blue';
    }
  };

  return (
    <div className="batch-container">
      {/* 1. Page Header */}
      <div className="batch-banner">
        <div className="batch-banner-left">
          <h2>Trainee Batch Management</h2>
          <p>Track academic progress, course syllabus completion rate, and attendance trends.</p>
        </div>
        <div className="batch-summary-pills">
          <div className="batch-summary-pill">
            <Icon name="users" style={{ width: '15px', height: '15px' }} />
            <span>Active: {BATCHES.length} Batches</span>
          </div>
        </div>
      </div>

      {/* 2. Multi-tab Selector */}
      <div className="batch-tab-bar">
        {BATCHES.map((batch) => (
          <button
            key={batch.id}
            className={`batch-tab ${activeTab === batch.id ? 'active' : ''}`}
            onClick={() => setActiveTab(batch.id)}
          >
            <span>{batch.label}</span>
            <span className="batch-tab-count">{batch.trainees.length}</span>
          </button>
        ))}
      </div>

      {/* 3. Trainee Data Table */}
      <div className="trainee-table-card">
        <div className="trainee-table-header">
          <div className="trainee-table-col-label">Employee Profile</div>
          <div className="trainee-table-col-label">Progress Track</div>
          <div className="trainee-table-col-label">Attendance</div>
          <div className="trainee-table-col-label">Status</div>
        </div>

        <div className="trainee-table-body">
          {activeBatchObj.trainees.length === 0 ? (
            <div className="trainee-table-empty">No trainees registered in this batch.</div>
          ) : (
            activeBatchObj.trainees.map((trainee) => (
              <div key={trainee.id} className="trainee-row">
                {/* Employee Profile Cell */}
                <div className="trainee-profile-cell">
                  <div 
                    className="trainee-avatar" 
                    style={{ backgroundColor: trainee.color || '#3563e9' }}
                  >
                    {trainee.initials}
                  </div>
                  <div className="trainee-info">
                    <span className="trainee-name">{trainee.name}</span>
                    <span className="trainee-email">{trainee.email}</span>
                    <span className="trainee-emp-id">{trainee.employeeId}</span>
                  </div>
                </div>

                {/* Progress Track Cell */}
                <div className="trainee-progress-cell">
                  <div className="trainee-progress-label">
                    <span className="trainee-progress-course">{trainee.progressLabel}</span>
                    <span className="trainee-progress-pct">{trainee.progressPct}%</span>
                  </div>
                  <div className="trainee-progress-track">
                    <div 
                      className={`trainee-progress-bar ${getProgressBarColorClass(trainee.status)}`}
                      style={{ width: `${trainee.progressPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Attendance Cell */}
                <div className="trainee-attendance-cell">
                  <span className={`attendance-badge ${getAttendanceClass(trainee.attendancePct)}`}>
                    {trainee.attendancePct}% Attendance
                  </span>
                </div>

                {/* Status Badge */}
                <div className="trainee-status-cell">
                  <span className={`status-badge ${getStatusClass(trainee.status)}`}>
                    {trainee.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
