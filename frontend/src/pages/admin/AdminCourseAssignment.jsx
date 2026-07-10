import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminCourseAssignment() {
  const [toastMsg, setToastMsg] = useState(null);
  
  // Load state from mockDataService
  const [assignments, setAssignments] = useState(() => mockDataService.getCourseAssignments());

  // Form states for making a new assignment
  const [selectedCourse, setSelectedCourse] = useState('Core Java Foundations');
  const [selectedBatch, setSelectedBatch] = useState('Batch B22');
  const [selectedTrainer, setSelectedTrainer] = useState('Dr. Ava Thompson');
  const [capacity, setCapacity] = useState(30);
  const [startDate, setStartDate] = useState('2026-07-15');
  const [endDate, setEndDate] = useState('2026-07-27');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAssign = (e) => {
    e.preventDefault();

    // Check if batch is already assigned
    const exists = assignments.some(a => a.batch === selectedBatch && a.course === selectedCourse);
    if (exists) {
      alert('This batch is already assigned to this course. Try reassigning.');
      return;
    }

    const newAssignment = {
      id: Date.now(),
      course: selectedCourse,
      batch: selectedBatch,
      trainer: selectedTrainer,
      capacity: parseInt(capacity),
      remaining: parseInt(capacity),
      startDate: startDate,
      endDate: endDate
    };

    const updated = [...assignments, newAssignment];
    setAssignments(updated);
    mockDataService.saveCourseAssignments(updated);
    triggerToast(`Assigned ${selectedTrainer} to ${selectedCourse} (${selectedBatch})`);
  };

  const handleUnassign = (id) => {
    if (confirm('Are you sure you want to remove this trainer assignment?')) {
      const updated = assignments.filter(a => a.id !== id);
      setAssignments(updated);
      mockDataService.saveCourseAssignments(updated);
      triggerToast('Assignment removed successfully.');
    }
  };

  // Reassignment simulator
  const handleReassign = (id, newTrainer) => {
    const updated = assignments.map(a => {
      if (a.id === id) {
        triggerToast(`Reassigned ${a.course} (${a.batch}) to ${newTrainer}`);
        return { ...a, trainer: newTrainer };
      }
      return a;
    });
    setAssignments(updated);
    mockDataService.saveCourseAssignments(updated);
  };

  return (
    <div className="page-view admin-container">
      
      {toastMsg && (
        <div className="toast-message">
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">TRAINERS ALLOCATION</span>
          <h2 className="admin-banner-title">Trainer & Course Allocations</h2>
        </div>
      </div>

      <div className="admin-dashboard-row">
        
        {/* Active Assignments List */}
        <div className="admin-table-container">
          <div className="admin-card-header" style={{ padding: '20px 20px 0 20px' }}>
            <h3 className="admin-card-title">
              <Icon name="activity" className="admin-card-title-icon" />
              <span>Active Allocations</span>
            </h3>
          </div>
          <table className="admin-table" style={{ marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Course & Batch</th>
                <th>Assigned Trainer</th>
                <th>Capacity / Remaining</th>
                <th>Duration Dates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{a.course}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>{a.batch}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="user-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {a.trainer.split(' ').filter(n => n.includes('.')).length > 0 ? a.trainer.split(' ').slice(1).map(n => n[0]).join('') : a.trainer.split(' ').map(n => n[0]).join('')}
                      </span>
                      <select 
                        style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: '13px', color: 'var(--text-dark)', cursor: 'pointer' }}
                        value={a.trainer}
                        onChange={(e) => handleReassign(a.id, e.target.value)}
                      >
                        <option value="Dr. Ava Thompson">Dr. Ava Thompson</option>
                        <option value="Prof. Noah Parker">Prof. Noah Parker</option>
                        <option value="Dr. Mason Cooper">Dr. Mason Cooper</option>
                        <option value="Amelia Scott">Amelia Scott</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{a.capacity} Seats</span>
                    <span style={{ fontSize: '11px', color: a.remaining === 0 ? 'var(--accent-red)' : 'var(--accent-green)', display: 'block' }}>
                      {a.remaining === 0 ? 'Full' : `${a.remaining} seats left`}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px' }}>{a.startDate} to {a.endDate}</span>
                  </td>
                  <td>
                    <button className="row-action-btn delete" title="Unassign Trainer" onClick={() => handleUnassign(a.id)}>
                      <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Allocate Form Widget */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="sliders" className="admin-card-title-icon" />
              <span>Assign Trainer & Batch</span>
            </h3>
          </div>

          <form onSubmit={handleAssign} className="modal-form">
            <div className="form-group">
              <label className="form-label">Select Course</label>
              <select className="form-input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                <option value="Core Java Foundations">Core Java Foundations</option>
                <option value="Python for Data Analysis">Python for Data Analysis</option>
                <option value="SQL & DBMS Essentials">SQL & DBMS Essentials</option>
                <option value="React Frontend Advanced">React Frontend Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Batch</label>
              <select className="form-input" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                <option value="Batch B22">Batch B22</option>
                <option value="Batch B23">Batch B23</option>
                <option value="Batch B24">Batch B24</option>
                <option value="Batch B26">Batch B26</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Trainer</label>
              <select className="form-input" value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)}>
                <option value="Dr. Ava Thompson">Dr. Ava Thompson (Workload: 85%)</option>
                <option value="Prof. Noah Parker">Prof. Noah Parker (Workload: 92%)</option>
                <option value="Dr. Mason Cooper">Dr. Mason Cooper (Workload: 70%)</option>
                <option value="Amelia Scott">Amelia Scott (Workload: 60%)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Batch Seat Capacity</label>
              <input type="number" className="form-input" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="action-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              Assign Trainer
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
