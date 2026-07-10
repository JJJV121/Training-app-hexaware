import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminAnnouncements() {
  const [toastMsg, setToastMsg] = useState(null);
  
  // Load state from mockDataService
  const [announcements, setAnnouncements] = useState(() => mockDataService.getAnnouncements());

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTarget, setFormTarget] = useState('All Students');
  const [formPinned, setFormPinned] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formTitle || !formContent) return;

    let updated;
    if (editingId) {
      updated = announcements.map(ann => {
        if (ann.id === editingId) {
          return { ...ann, title: formTitle, content: formContent, target: formTarget, pinned: formPinned };
        }
        return ann;
      });
      setEditingId(null);
      triggerToast('Announcement updated successfully.');
    } else {
      const newAnn = {
        id: Date.now(),
        title: formTitle,
        content: formContent,
        target: formTarget,
        date: 'Just now',
        pinned: formPinned
      };
      updated = [newAnn, ...announcements];
      triggerToast('Broadcasting announcement!');
    }

    setAnnouncements(updated);
    mockDataService.saveAnnouncements(updated);

    setFormTitle('');
    setFormContent('');
    setFormTarget('All Students');
    setFormPinned(false);
  };

  const handleEdit = (ann) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormTarget(ann.target);
    setFormPinned(ann.pinned);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this broadcasted announcement?')) {
      const updated = announcements.filter(ann => ann.id !== id);
      setAnnouncements(updated);
      mockDataService.saveAnnouncements(updated);
      triggerToast('Announcement deleted.');
    }
  };

  const togglePin = (id) => {
    const updated = announcements.map(ann => {
      if (ann.id === id) {
        const next = !ann.pinned;
        triggerToast(next ? 'Announcement pinned!' : 'Announcement unpinned.');
        return { ...ann, pinned: next };
      }
      return ann;
    });
    setAnnouncements(updated);
    mockDataService.saveAnnouncements(updated);
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
          <span className="admin-banner-subtitle">BROADCAST BULLETINS</span>
          <h2 className="admin-banner-title">Announcements Manager</h2>
        </div>
      </div>

      <div className="admin-dashboard-row">
        
        {/* Announcements Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {announcements.map(ann => (
            <div key={ann.id} className="admin-card" style={{ gap: '12px', borderLeft: ann.pinned ? '4px solid var(--primary-blue)' : '' }}>
              <div className="admin-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {ann.pinned && <Icon name="pin" style={{ color: 'var(--primary-blue)', width: '16px', height: '16px', fill: 'var(--primary-blue)' }} />}
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'var(--font-family-header)' }}>
                    {ann.title}
                  </span>
                </div>
                <span className="admin-badge blue" style={{ fontSize: '10px' }}>Target: {ann.target}</span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-medium)', lineHeight: 1.5 }}>
                {ann.content}
              </p>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>ðŸ“… Sent {ann.date}</span>
                
                <div className="table-row-actions">
                  <button className="row-action-btn" title="Toggle Pin" onClick={() => togglePin(ann.id)}>
                    <Icon name="pin" style={{ width: '14px', height: '14px', fill: ann.pinned ? 'var(--text-medium)' : 'none' }} />
                  </button>
                  <button className="row-action-btn" title="Modify Announcement" onClick={() => handleEdit(ann)}>
                    <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button className="row-action-btn delete" title="Delete Broadcast" onClick={() => handleDelete(ann.id)}>
                    <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Broadcasting Composer */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="send" className="admin-card-title-icon" />
              <span>{editingId ? 'Edit Announcement' : 'Compose Broadcast'}</span>
            </h3>
          </div>

          <form onSubmit={handleSave} className="modal-form">
            <div className="form-group">
              <label className="form-label">Announcement Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Schedule Maintenance"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Broadcast Target Audience</label>
              <select className="form-input" value={formTarget} onChange={(e) => setFormTarget(e.target.value)}>
                <option value="All Students">All Students</option>
                <option value="Batch B21">Batch B21</option>
                <option value="Batch B22">Batch B22</option>
                <option value="Batch B25">Batch B25</option>
                <option value="Trainers">Trainers Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Announcement Message Content</label>
              <textarea 
                className="form-textarea" 
                placeholder="Write message description..."
                style={{ minHeight: '120px' }}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                id="pin-chk" 
                checked={formPinned}
                onChange={(e) => setFormPinned(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="pin-chk" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>Pin Announcement on dashboard</label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {editingId && (
                <button type="button" className="action-btn-secondary" style={{ flexGrow: 1, justifyContent: 'center' }} onClick={() => {
                  setEditingId(null);
                  setFormTitle('');
                  setFormContent('');
                  setFormTarget('All Students');
                  setFormPinned(false);
                }}>
                  Cancel
                </button>
              )}
              <button type="submit" className="action-btn-primary" style={{ flexGrow: 2, justifyContent: 'center', padding: '12px' }}>
                {editingId ? 'Update Broadcast' : 'BroadCast Bulletin'}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
