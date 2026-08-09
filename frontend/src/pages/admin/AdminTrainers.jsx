import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminTrainers() {
  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expertFilter, setExpertFilter] = useState('All');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTrainer, setEditTrainer] = useState(null); // null means adding a new trainer

  // Load state from mockDataService
  const [trainers, setTrainers] = useState(() => mockDataService.getTrainers());

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formExpertise, setFormExpertise] = useState('Java Enterprise');
  const [formWorkload, setFormWorkload] = useState(50);
  const [formRating, setFormRating] = useState(4.5);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditTrainer(null);
    setFormName('');
    setFormEmail('');
    setFormExpertise('Java Enterprise');
    setFormWorkload(50);
    setFormRating(4.5);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trainer, e) => {
    e.stopPropagation();
    setEditTrainer(trainer);
    setFormName(trainer.name);
    setFormEmail(trainer.email);
    setFormExpertise(trainer.expertise);
    setFormWorkload(trainer.workload);
    setFormRating(trainer.rating);
    setIsModalOpen(true);
  };

  const handleDeleteTrainer = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trainer?')) {
      const updated = trainers.filter(t => t.id !== id);
      setTrainers(updated);
      mockDataService.saveTrainers(updated);
      if (selectedTrainer && selectedTrainer.id === id) {
        setSelectedTrainer(null);
      }
      triggerToast('Trainer deleted successfully.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert('Please fill out all fields.');
      return;
    }

    if (editTrainer) {
      // Edit mode
      const updated = trainers.map(t => {
        if (t.id === editTrainer.id) {
          return {
            ...t,
            name: formName,
            email: formEmail,
            expertise: formExpertise,
            workload: parseInt(formWorkload),
            rating: parseFloat(formRating)
          };
        }
        return t;
      });
      setTrainers(updated);
      mockDataService.saveTrainers(updated);
      // Update sidebar details if selected
      if (selectedTrainer && selectedTrainer.id === editTrainer.id) {
        setSelectedTrainer({
          ...selectedTrainer,
          name: formName,
          email: formEmail,
          expertise: formExpertise,
          workload: parseInt(formWorkload),
          rating: parseFloat(formRating)
        });
      }
      triggerToast('Trainer details updated successfully.');
    } else {
      // Add mode
      const newId = trainers.length > 0 ? Math.max(...trainers.map(t => t.id)) + 1 : 1;
      const newTrainer = {
        id: newId,
        name: formName,
        email: formEmail,
        expertise: formExpertise,
        workload: parseInt(formWorkload),
        rating: parseFloat(formRating),
        batches: ['New Batch'],
        courses: ['Assigned Course'],
        attendance: '100%',
        students: 0,
        comments: 'No feedback ratings submitted yet.'
      };
      const updated = [...trainers, newTrainer];
      setTrainers(updated);
      mockDataService.saveTrainers(updated);
      triggerToast('New trainer added successfully.');
    }
    setIsModalOpen(false);
  };

  // Filter and Search logic
  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.expertise.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExpert = expertFilter === 'All' || t.expertise === expertFilter;
    return matchesSearch && matchesExpert;
  });

  return (
    <div className="page-view admin-container">
      
      {/* Toast */}
      {toastMsg && (
        <div className="toast-message">
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">USER MANAGEMENT</span>
          <h2 className="admin-banner-title">Trainer Management Portal</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAddModal}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Add Trainer</span>
          </button>
        </div>
      </div>

      {/* Actions and search bars */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div className="table-actions-bar">
          <div className="search-input-wrapper">
            <Icon name="search" className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Search trainers by name, email, or domain..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Icon name="filter" style={{ width: '16px', height: '16px', color: 'var(--text-medium)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)' }}>Expertise:</span>
            <select 
              className="filter-select"
              value={expertFilter}
              onChange={(e) => setExpertFilter(e.target.value)}
            >
              <option value="All">All Domains</option>
              <option value="Java Enterprise">Java Enterprise</option>
              <option value="Python & AI">Python & AI</option>
              <option value="Database Systems">Database Systems</option>
              <option value="React Frontend">React Frontend</option>
            </select>
          </div>
        </div>
      </div>

      {/* Split view: Table on left, Profile on right */}
      <div className="split-view-container">
        
        {/* Table layout */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Trainer Name</th>
                <th>Expertise Domain</th>
                <th>Workload</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainers.length > 0 ? (
                filteredTrainers.map((t) => (
                  <tr 
                    key={t.id} 
                    style={{ cursor: 'pointer', backgroundColor: selectedTrainer?.id === t.id ? '#f8fafc' : '' }}
                    onClick={() => setSelectedTrainer(t)}
                  >
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-circle">
                          {t.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="user-details">
                          <span className="user-cell-name">{t.name}</span>
                          <span className="user-cell-email">{t.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge blue">{t.expertise}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{t.workload}%</span>
                        <div className="admin-hbar-track" style={{ width: '60px', height: '6px' }}>
                          <div 
                            className="admin-hbar-fill" 
                            style={{ 
                              width: `${t.workload}%`, 
                              backgroundColor: t.workload > 85 ? 'var(--accent-red)' : 'var(--primary-blue)' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>â­ {t.rating}</span>
                    </td>
                    <td>
                      <div className="table-row-actions">
                        <button className="row-action-btn" title="Edit Trainer" onClick={(e) => handleOpenEditModal(t, e)}>
                          <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button className="row-action-btn delete" title="Remove Trainer" onClick={(e) => handleDeleteTrainer(t.id, e)}>
                          <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
                    No trainers match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="pagination-container">
            <span>Showing {filteredTrainers.length} of {trainers.length} Trainers</span>
            <div className="pagination-btns">
              <button className="pagination-btn" disabled>Prev</button>
              <button className="pagination-btn" disabled>Next</button>
            </div>
          </div>
        </div>

        {/* Profile details drawer */}
        <div className="details-side-panel">
          {selectedTrainer ? (
            <div className="admin-card">
              <div className="details-card-header">
                <div className="details-avatar-large">
                  {selectedTrainer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="details-name">{selectedTrainer.name}</h3>
                <span className="details-email">{selectedTrainer.email}</span>
                <span className="admin-badge green">â­ {selectedTrainer.rating} Feedback Rating</span>
              </div>

              <div className="details-body-list">
                <div className="details-body-item">
                  <span className="details-item-label">Expertise Domain</span>
                  <span className="details-item-value">{selectedTrainer.expertise}</span>
                </div>
                <div className="details-body-item">
                  <span className="details-item-label">Total Assigned Students</span>
                  <span className="details-item-value">{selectedTrainer.students} Students</span>
                </div>
                <div className="details-body-item">
                  <span className="details-item-label">Trainer Attendance Rate</span>
                  <span className="details-item-value" style={{ color: 'var(--accent-green)' }}>{selectedTrainer.attendance}</span>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>Assigned Courses</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedTrainer.courses.map((c, i) => (
                      <span key={i} className="admin-badge blue" style={{ fontSize: '10px' }}>{c}</span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>Assigned Batches</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedTrainer.batches.map((b, i) => (
                      <span key={i} className="admin-badge orange" style={{ fontSize: '10px' }}>{b}</span>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>Feedback Summary</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-medium)', lineHeight: 1.4, fontStyle: 'italic' }}>
                    "{selectedTrainer.comments}"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
              <Icon name="user" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', fontWeight: 600 }}>Select a trainer from the list to view profile details, assigned students, ratings, and course workloads.</p>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editTrainer ? 'Modify Trainer Details' : 'Register New Trainer'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Dr. John Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. j.doe@hexaware.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expertise Domain</label>
                <select 
                  className="form-input"
                  value={formExpertise}
                  onChange={(e) => setFormExpertise(e.target.value)}
                >
                  <option value="Java Enterprise">Java Enterprise</option>
                  <option value="Python & AI">Python & AI</option>
                  <option value="Database Systems">Database Systems</option>
                  <option value="React Frontend">React Frontend</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Workload Target ({formWorkload}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  className="form-input" 
                  value={formWorkload}
                  onChange={(e) => setFormWorkload(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default/Initial Rating ({formRating})</label>
                <input 
                  type="number" 
                  min="1.0" 
                  max="5.0" 
                  step="0.1"
                  className="form-input" 
                  value={formRating}
                  onChange={(e) => setFormRating(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Save Trainer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
