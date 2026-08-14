import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import trainerService from '../../services/trainerService';
import '../../styles/trainer/batch-management.css';

export default function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [isBatchesLoading, setIsBatchesLoading] = useState(true);
  const [isTraineesLoading, setIsTraineesLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsBatchesLoading(true);
        const result = await trainerService.getBatches();
        setBatches(result);
        if (result.length > 0) {
          setActiveTab(result[0].id);
        }
      } catch (err) {
        console.error('Error fetching batches:', err);
        setError('Error loading batches');
      } finally {
        setIsBatchesLoading(false);
      }
    };
    fetchBatches();
  }, []);

  // Fetch trainees when activeTab changes
  useEffect(() => {
    if (!activeTab) return;
    const fetchTrainees = async () => {
      try {
        setIsTraineesLoading(true);
        const result = await trainerService.getBatchTrainees(activeTab);
        setTrainees(result);
      } catch (err) {
        console.error('Error fetching trainees:', err);
      } finally {
        setIsTraineesLoading(false);
      }
    };
    fetchTrainees();
  }, [activeTab]);

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

  if (isBatchesLoading) {
    return (
      <div className="batch-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Loading Batch Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="batch-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>{error}</div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="batch-container" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No Batches Assigned</h2>
        <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>You are not currently assigned to any batches as a trainer.</p>
      </div>
    );
  }

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
            <span>Active: {batches.length} Batches</span>
          </div>
        </div>
      </div>

      {/* 2. Multi-tab Selector */}
      <div className="batch-tab-bar">
        {batches.map((batch) => (
          <button
            key={batch.id}
            className={`batch-tab ${activeTab === batch.id ? 'active' : ''}`}
            onClick={() => setActiveTab(batch.id)}
          >
            <span>{batch.name} — {batch.course_name}</span>
            <span className="batch-tab-count">{batch.trainee_count}</span>
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
          {isTraineesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>
              Loading trainees for this batch...
            </div>
          ) : trainees.length === 0 ? (
            <div className="trainee-table-empty">No trainees registered in this batch.</div>
          ) : (
            trainees.map((trainee) => {
              const name = trainee.name || 'Trainee';
              const parts = name.split(' ').filter(Boolean);
              const initials = parts.map(p => p[0].toUpperCase()).join('').substring(0, 2) || 'TR';
              const colors = ["#3563e9", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#0dcd94"];
              const color = colors[trainee.trainee_id % colors.length] || '#3563e9';

              return (
                <div key={trainee.trainee_id} className="trainee-row">
                  {/* Employee Profile Cell */}
                  <div className="trainee-profile-cell">
                    <div 
                      className="trainee-avatar" 
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                    <div className="trainee-info">
                      <span className="trainee-name">{name}</span>
                      <span className="trainee-email">{trainee.email}</span>
                      <span className="trainee-emp-id">ID: {trainee.employee_id}</span>
                    </div>
                  </div>

                  {/* Progress Track Cell */}
                  <div className="trainee-progress-cell">
                    <div className="trainee-progress-label">
                      <span className="trainee-progress-course">{trainee.progress_label}</span>
                      <span className="trainee-progress-pct">{trainee.progress_pct}%</span>
                    </div>
                    <div className="trainee-progress-track">
                      <div 
                        className={`trainee-progress-bar ${getProgressBarColorClass(trainee.status)}`}
                        style={{ width: `${trainee.progress_pct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Attendance Cell */}
                  <div className="trainee-attendance-cell">
                    <span className={`attendance-badge ${getAttendanceClass(trainee.attendance_pct)}`}>
                      {trainee.attendance_pct}% Attendance
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="trainee-status-cell">
                    <span className={`status-badge ${getStatusClass(trainee.status)}`}>
                      {trainee.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
