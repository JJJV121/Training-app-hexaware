import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminCourseAssignment() {
  const [toastMsg, setToastMsg] = useState(null);
  
  // Load state from mockDataService
  const [assignments, setAssignments] = useState(() => mockDataService.getCourseAssignments());
  const allCourses = mockDataService.getCourses();
  const allBatches = mockDataService.getBatches();
  const allTrainers = mockDataService.getTrainers();
  const allStudents = mockDataService.getStudents();

  // Form states for making a new assignment
  const [assignType, setAssignType] = useState('Batch'); // 'Batch' or 'Trainee'
  const [selectedCourse, setSelectedCourse] = useState('Core Java Foundations');
  const [selectedBatch, setSelectedBatch] = useState(allBatches[0]?.code || 'Batch B21');
  const [selectedTrainee, setSelectedTrainee] = useState(allStudents[0]?.name || 'Ethan Carter');
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
    const targetName = assignType === 'Batch' ? selectedBatch : selectedTrainee;

    // Check if target is already assigned to this course
    const exists = assignments.some(a => a.targetName === targetName && a.course === selectedCourse);
    if (exists) {
      alert(`This ${assignType.toLowerCase()} (${targetName}) is already assigned to ${selectedCourse}.`);
      return;
    }

    const newAssignment = {
      id: Date.now(),
      type: assignType,
      targetName: targetName,
      course: selectedCourse,
      trainer: selectedTrainer,
      capacity: assignType === 'Batch' ? parseInt(capacity) : 1,
      remaining: assignType === 'Batch' ? parseInt(capacity) : 0,
      startDate: startDate,
      endDate: endDate
    };

    const updated = [...assignments, newAssignment];
    setAssignments(updated);
    mockDataService.saveCourseAssignments(updated);
    triggerToast(`Course ${selectedCourse} assigned to ${assignType} (${targetName}) with ${selectedTrainer}`);
  };

  const handleUnassign = (id) => {
    if (confirm('Are you sure you want to remove this course allocation?')) {
      const updated = assignments.filter(a => a.id !== id);
      setAssignments(updated);
      mockDataService.saveCourseAssignments(updated);
      triggerToast('Allocation removed successfully.');
    }
  };

  const handleReassign = (id, newTrainer) => {
    const updated = assignments.map(a => {
      if (a.id === id) {
        triggerToast(`Reassigned ${a.course} (${a.targetName || a.batch}) to ${newTrainer}`);
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
          <span className="admin-banner-subtitle">TRAINEE & BATCH COURSE ALLOCATION</span>
          <h2 className="admin-banner-title">Course Assignment Module</h2>
        </div>
      </div>

      <div className="admin-dashboard-row">
        
        {/* Active Assignments List */}
        <div className="admin-table-container">
          <div className="admin-card-header" style={{ padding: '20px 20px 0 20px' }}>
            <h3 className="admin-card-title">
              <Icon name="activity" className="admin-card-title-icon" />
              <span>Active Course Allocations</span>
            </h3>
          </div>
          <table className="admin-table" style={{ marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Target & Type</th>
                <th>Course Name</th>
                <th>Assigned Trainer</th>
                <th>Capacity / Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{a.targetName || a.batch}</span>
                      <span className={`admin-badge ${a.type === 'Trainee' ? 'orange' : 'blue'}`} style={{ fontSize: '10px', width: 'fit-content' }}>
                        {a.type || 'Batch'} Level
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{a.course}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select 
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', fontWeight: 600, fontSize: '12px', color: 'var(--text-dark)', cursor: 'pointer' }}
                        value={a.trainer}
                        onChange={(e) => handleReassign(a.id, e.target.value)}
                      >
                        {allTrainers.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{a.capacity} Seats</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-medium)', display: 'block' }}>
                      {a.startDate} to {a.endDate}
                    </span>
                  </td>
                  <td>
                    <button className="row-action-btn delete" title="Remove Allocation" onClick={() => handleUnassign(a.id)}>
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
              <span>Assign Course</span>
            </h3>
          </div>

          <form onSubmit={handleAssign} className="modal-form">
            {/* Allocation Target Toggle */}
            <div className="form-group">
              <label className="form-label">Allocation Scope</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={assignType === 'Batch' ? 'action-btn-primary' : 'action-btn-secondary'}
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  onClick={() => setAssignType('Batch')}
                >
                  🏢 Batch Allocation
                </button>
                <button
                  type="button"
                  className={assignType === 'Trainee' ? 'action-btn-primary' : 'action-btn-secondary'}
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  onClick={() => setAssignType('Trainee')}
                >
                  👨‍🎓 Trainee Course Assigning
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Course</label>
              <select className="form-input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                {allCourses.map(c => (
                  <option key={c.id} value={c.title}>{c.title}</option>
                ))}
              </select>
            </div>

            {assignType === 'Batch' ? (
              <div className="form-group">
                <label className="form-label">Select Target Batch</label>
                <select className="form-input" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                  {allBatches.map(b => (
                    <option key={b.id} value={b.code}>{b.code} ({b.college})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Select Trainee / Student</label>
                <select className="form-input" value={selectedTrainee} onChange={(e) => setSelectedTrainee(e.target.value)}>
                  {allStudents.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.college})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Assign Lead Trainer</label>
              <select className="form-input" value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)}>
                {allTrainers.map(t => (
                  <option key={t.id} value={t.name}>{t.name} ({t.expertise})</option>
                ))}
              </select>
            </div>

            {assignType === 'Batch' && (
              <div className="form-group">
                <label className="form-label">Batch Seat Capacity</label>
                <input type="number" className="form-input" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
              </div>
            )}

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
              Assign Course to {assignType}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
