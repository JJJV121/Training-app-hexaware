import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminBatches() {
  const [toastMsg, setToastMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);

  // Load state from mockDataService
  const [batches, setBatches] = useState(() => mockDataService.getBatches());

  // Form inputs
  const [formCode, setFormCode] = useState('');
  const [formCourse, setFormCourse] = useState('Core Java Foundations');
  const [formTrainer, setFormTrainer] = useState('Dr. Ava Thompson');
  const [formStrength, setFormStrength] = useState(25);
  const [formTiming, setFormTiming] = useState('09:00 AM - 11:00 AM');
  const [formProgress, setFormProgress] = useState(0);
  const [formSchedule, setFormSchedule] = useState('Mon, Wed, Fri');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditBatch(null);
    setFormCode(`Batch B${batches.length + 21}`);
    setFormCourse('Core Java Foundations');
    setFormTrainer('Dr. Ava Thompson');
    setFormStrength(25);
    setFormTiming('09:00 AM - 11:00 AM');
    setFormProgress(0);
    setFormSchedule('Mon, Wed, Fri');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditBatch(batch);
    setFormCode(batch.code);
    setFormCourse(batch.course);
    setFormTrainer(batch.trainer);
    setFormStrength(batch.strength);
    setFormTiming(batch.timing);
    setFormProgress(batch.progress);
    setFormSchedule(batch.schedule);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this batch? This will affect attendance records and student groups.')) {
      const updated = batches.filter(b => b.id !== id);
      setBatches(updated);
      mockDataService.saveBatches(updated);
      triggerToast('Batch deleted successfully.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formCode || !formTiming) {
      alert('Please fill out all fields.');
      return;
    }

    if (editBatch) {
      const updated = batches.map(b => {
        if (b.id === editBatch.id) {
          return {
            ...b,
            code: formCode,
            course: formCourse,
            trainer: formTrainer,
            strength: parseInt(formStrength),
            timing: formTiming,
            progress: parseInt(formProgress),
            schedule: formSchedule
          };
        }
        return b;
      });
      setBatches(updated);
      mockDataService.saveBatches(updated);
      triggerToast('Batch parameters updated.');
    } else {
      const newId = Date.now();
      const newBatch = {
        id: newId,
        code: formCode,
        course: formCourse,
        trainer: formTrainer,
        strength: parseInt(formStrength),
        timing: formTiming,
        progress: parseInt(formProgress),
        schedule: formSchedule
      };
      const updated = [...batches, newBatch];
      setBatches(updated);
      mockDataService.saveBatches(updated);
      triggerToast('New batch created.');
    }
    setIsModalOpen(false);
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
          <span className="admin-banner-subtitle">BATCH COORDINATION</span>
          <h2 className="admin-banner-title">LMS Batch Management</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAdd}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Grid of Batch Cards */}
      <div className="admin-stats-grid-9" style={{ marginTop: '0', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {batches.map(b => (
          <div key={b.id} className="admin-card" style={{ gap: '14px' }}>
            <div className="admin-card-header">
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'var(--font-family-header)' }}>
                {b.code}
              </span>
              <span className="admin-badge green" style={{ fontSize: '10px' }}>
                {b.strength} Students
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{b.course}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-medium)', fontWeight: 500 }}>Lead Trainer: {b.trainer}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-medium)' }}>
              <span>ðŸ“… Timetable: <strong>{b.schedule}</strong></span>
              <span>â° Timings: <strong>{b.timing}</strong></span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-medium)' }}>Completion Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{b.progress}%</span>
              </div>
              <div className="admin-hbar-track" style={{ height: '6px' }}>
                <div 
                  className="admin-hbar-fill" 
                  style={{ 
                    width: `${b.progress}%`, 
                    backgroundColor: b.progress === 100 ? 'var(--accent-green)' : 'var(--primary-blue)' 
                  }}
                ></div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="row-action-btn" title="Modify Batch" onClick={() => handleOpenEdit(b)}>
                <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
              </button>
              <button className="row-action-btn delete" title="Delete Batch" onClick={() => handleDelete(b.id)}>
                <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editBatch ? 'Edit Batch Parameters' : 'Establish New Batch'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label className="form-label">Batch Code Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select Course Content</label>
                <select className="form-input" value={formCourse} onChange={(e) => setFormCourse(e.target.value)}>
                  <option value="Core Java Foundations">Core Java Foundations</option>
                  <option value="Python for Data Analysis">Python for Data Analysis</option>
                  <option value="SQL & DBMS Essentials">SQL & DBMS Essentials</option>
                  <option value="React Frontend Advanced">React Frontend Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Lead Trainer</label>
                <select className="form-input" value={formTrainer} onChange={(e) => setFormTrainer(e.target.value)}>
                  <option value="Dr. Ava Thompson">Dr. Ava Thompson</option>
                  <option value="Prof. Noah Parker">Prof. Noah Parker</option>
                  <option value="Dr. Mason Cooper">Dr. Mason Cooper</option>
                  <option value="Amelia Scott">Amelia Scott</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Active Strength</label>
                  <input type="number" className="form-input" value={formStrength} onChange={(e) => setFormStrength(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Completion Progress ({formProgress}%)</label>
                  <input type="number" min="0" max="100" className="form-input" value={formProgress} onChange={(e) => setFormProgress(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Daily timing Schedule</label>
                <input type="text" className="form-input" placeholder="e.g. 09:00 AM - 11:00 AM" value={formTiming} onChange={(e) => setFormTiming(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Days of the Week</label>
                <input type="text" className="form-input" placeholder="e.g. Mon, Wed, Fri" value={formSchedule} onChange={(e) => setFormSchedule(e.target.value)} required />
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Save Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
