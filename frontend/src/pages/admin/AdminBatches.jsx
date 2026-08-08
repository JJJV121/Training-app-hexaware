import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminBatches() {
  const [toastMsg, setToastMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);

  // Load state from mockDataService
  const [batches, setBatches] = useState(() => mockDataService.getBatches());
  const colleges = mockDataService.getColleges();
  const allStudents = mockDataService.getStudents();
  const allTrainers = mockDataService.getTrainers();
  const allCourses = mockDataService.getCourses();

  // Filters
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('All');

  // Form inputs
  const [formCode, setFormCode] = useState('');
  const [formCollege, setFormCollege] = useState(colleges[0] || 'IIT Madras');
  const [formCourse, setFormCourse] = useState('Core Java Foundations');
  const [formTrainer, setFormTrainer] = useState('Dr. Ava Thompson');
  const [formTrainees, setFormTrainees] = useState([]);
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
    setFormCollege(colleges[0] || 'IIT Madras');
    setFormCourse(allCourses[0]?.title || 'Core Java Foundations');
    setFormTrainer(allTrainers[0]?.name || 'Dr. Ava Thompson');
    setFormTrainees([allStudents[0]?.name || 'Ethan Carter']);
    setFormStrength(25);
    setFormTiming('09:00 AM - 11:00 AM');
    setFormProgress(0);
    setFormSchedule('Mon, Wed, Fri');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditBatch(batch);
    setFormCode(batch.code);
    setFormCollege(batch.college || colleges[0]);
    setFormCourse(batch.course);
    setFormTrainer(batch.trainer);
    setFormTrainees(batch.trainees || []);
    setFormStrength(batch.strength);
    setFormTiming(batch.timing);
    setFormProgress(batch.progress);
    setFormSchedule(batch.schedule);
    setIsModalOpen(true);
  };

  const toggleTraineeSelection = (studentName) => {
    if (formTrainees.includes(studentName)) {
      setFormTrainees(formTrainees.filter(t => t !== studentName));
    } else {
      setFormTrainees([...formTrainees, studentName]);
    }
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
    if (!formCode || !formTiming || !formCollege) {
      alert('Please fill out all fields.');
      return;
    }

    if (editBatch) {
      const updated = batches.map(b => {
        if (b.id === editBatch.id) {
          return {
            ...b,
            code: formCode,
            college: formCollege,
            course: formCourse,
            trainer: formTrainer,
            trainees: formTrainees,
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
      triggerToast('Batch parameters and trainee formation updated.');
    } else {
      const newId = Date.now();
      const newBatch = {
        id: newId,
        code: formCode,
        college: formCollege,
        course: formCourse,
        trainer: formTrainer,
        trainees: formTrainees,
        strength: parseInt(formStrength),
        timing: formTiming,
        progress: parseInt(formProgress),
        schedule: formSchedule
      };
      const updated = [...batches, newBatch];
      setBatches(updated);
      mockDataService.saveBatches(updated);
      triggerToast('New college batch & trainer-trainee group established.');
    }
    setIsModalOpen(false);
  };

  const filteredBatches = batches.filter(b => {
    if (selectedCollegeFilter === 'All') return true;
    return b.college === selectedCollegeFilter;
  });

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
          <span className="admin-banner-subtitle">COLLEGE-BASED BATCH & TRAINER-TRAINEE FORMATION</span>
          <h2 className="admin-banner-title">Batch Management Module</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAdd}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Create College Batch</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="sliders" style={{ width: '18px', height: '18px', color: 'var(--primary-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-dark)' }}>Filter by College:</span>
          </div>
          <select 
            className="form-input" 
            style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
            value={selectedCollegeFilter}
            onChange={(e) => setSelectedCollegeFilter(e.target.value)}
          >
            <option value="All">All Colleges ({colleges.length})</option>
            {colleges.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: 'var(--text-medium)', marginLeft: 'auto' }}>
            Showing {filteredBatches.length} of {batches.length} Batches
          </span>
        </div>
      </div>

      {/* Grid of Batch Cards */}
      <div className="admin-stats-grid-9" style={{ marginTop: '0', gridTemplateColumns: 'repeat( auto-fit, minmax(320px, 1fr) )' }}>
        {filteredBatches.map(b => (
          <div key={b.id} className="admin-card" style={{ gap: '14px' }}>
            <div className="admin-card-header">
              <div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-blue)', fontFamily: 'var(--font-family-header)' }}>
                  {b.code}
                </span>
                <span className="admin-badge blue" style={{ fontSize: '10px', marginLeft: '8px' }}>
                  🏛️ {b.college || 'Unassigned College'}
                </span>
              </div>
              <span className="admin-badge green" style={{ fontSize: '10px' }}>
                {b.strength} Capacity
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>Course: {b.course}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-medium)', fontWeight: 600 }}>👨‍🏫 Lead Trainer: <strong>{b.trainer}</strong></span>
            </div>

            {/* Assigned Trainees */}
            <div style={{ backgroundColor: 'var(--bg-card-subtle)', padding: '10px', borderRadius: '6px', fontSize: '11px' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
                👨‍🎓 Trainee Batch Allocation ({b.trainees?.length || 0}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {b.trainees && b.trainees.length > 0 ? (
                  b.trainees.map((t, idx) => (
                    <span key={idx} className="admin-badge blue" style={{ fontSize: '10px' }}>{t}</span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-light)', italic: 'true' }}>No trainees assigned yet</span>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-medium)' }}>
              <span>📅 Timetable: <strong>{b.schedule}</strong></span>
              <span>⏰ Timings: <strong>{b.timing}</strong></span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-medium)' }}>Batch Progress</span>
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
              <button className="row-action-btn" title="Modify Batch & Formation" onClick={() => handleOpenEdit(b)}>
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
          <div className="modal-box" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editBatch ? 'Edit Batch & Trainee Formation' : 'Establish New College Batch'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <label className="form-label">Select College</label>
                  <select className="form-input" value={formCollege} onChange={(e) => setFormCollege(e.target.value)}>
                    {colleges.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select className="form-input" value={formCourse} onChange={(e) => setFormCourse(e.target.value)}>
                  {allCourses.map(c => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Lead Trainer</label>
                <select className="form-input" value={formTrainer} onChange={(e) => setFormTrainer(e.target.value)}>
                  {allTrainers.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.expertise})</option>
                  ))}
                </select>
              </div>

              {/* Trainee Batch Formation Selection */}
              <div className="form-group">
                <label className="form-label">Trainer-Trainee Batch Formation (Select Trainees):</label>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {allStudents.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formTrainees.includes(s.name)} 
                        onChange={() => toggleTraineeSelection(s.name)}
                      />
                      <span>{s.name} ({s.college || 'General'})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Active Capacity/Strength</label>
                  <input type="number" className="form-input" value={formStrength} onChange={(e) => setFormStrength(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Completion Progress ({formProgress}%)</label>
                  <input type="number" min="0" max="100" className="form-input" value={formProgress} onChange={(e) => setFormProgress(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Timings</label>
                  <input type="text" className="form-input" placeholder="e.g. 09:00 AM - 11:00 AM" value={formTiming} onChange={(e) => setFormTiming(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Schedule Days</label>
                  <input type="text" className="form-input" placeholder="e.g. Mon, Wed, Fri" value={formSchedule} onChange={(e) => setFormSchedule(e.target.value)} required />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Save Batch & Formation</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
