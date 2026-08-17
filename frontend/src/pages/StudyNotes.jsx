import React, { useState, useEffect } from 'react';
import noteService from '../services/noteService';
import "../styles/StudyNotes.css";

const pastelColors = ['#f5e6fe', '#e6f0fa', '#eafaf1', '#fef7e0', '#fdeaf2', '#eef2fe'];

export default function StudyNotes() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState(null);

  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await noteService.getNotes(userId);
      const mapped = (Array.isArray(data) ? data : []).map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        tag: n.tag || 'General',
        pinned: n.pinned || false,
        color: n.color || '#e6f0fa',
        date: n.updated_at ? new Date(n.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'
      }));
      setNotes(mapped);
    } catch (err) {
      console.error('Failed to load study notes:', err);
      setError('Failed to fetch study notes from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const handleOpenNote = (note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTag(note.tag || '');
    setIsEditing(false);
    setCopySuccess(false);
  };

  const handleSaveNote = async () => {
    const finalTitle = editTitle.trim() || 'Untitled Note';
    const finalContent = editContent.trim() || 'No content provided.';
    const finalTag = editTag.trim() || 'General';

    try {
      if (activeNote && activeNote.id && typeof activeNote.id === 'number' && activeNote.id > 1000000000000) {
        // New unsaved note (temp timestamp ID) -> Create
        const res = await noteService.createNote(userId, {
          title: finalTitle,
          content: finalContent,
          tag: finalTag,
          pinned: activeNote.pinned || false,
          color: activeNote.color || '#e6f0fa'
        });
        await fetchNotes();
      } else if (activeNote && activeNote.id) {
        // Existing note -> Update
        await noteService.updateNote(userId, activeNote.id, {
          title: finalTitle,
          content: finalContent,
          tag: finalTag,
          pinned: activeNote.pinned || false,
          color: activeNote.color || '#e6f0fa'
        });
        await fetchNotes();
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    }
    setActiveNote(null);
  };

  const triggerDeleteConfirmation = (id) => {
    setNoteIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (noteIdToDelete) {
      try {
        if (typeof noteIdToDelete === 'number' && noteIdToDelete < 1000000000000) {
          await noteService.deleteNote(userId, noteIdToDelete);
        }
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteIdToDelete));
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
    setActiveNote(null);
    setShowDeleteModal(false);
    setNoteIdToDelete(null);
  };

  const handleTogglePin = async (e, noteToPin) => {
    e.stopPropagation();
    const newPinned = !noteToPin.pinned;
    setNotes(prevNotes =>
      prevNotes.map(n => n.id === noteToPin.id ? { ...n, pinned: newPinned } : n)
    );
    if (typeof noteToPin.id === 'number' && noteToPin.id < 1000000000000) {
      try {
        await noteService.updateNote(userId, noteToPin.id, {
          title: noteToPin.title,
          content: noteToPin.content,
          tag: noteToPin.tag || 'General',
          pinned: newPinned,
          color: noteToPin.color || '#e6f0fa'
        });
      } catch (err) {
        console.error('Failed to pin note:', err);
      }
    }
  };

  const handleCreateNote = () => {
    const randomColor = pastelColors[notes.length % pastelColors.length];
    const tempId = Date.now();
    const newNote = {
      id: tempId,
      title: '',
      content: '',
      date: 'Today',
      color: randomColor,
      pinned: false,
      tag: ''
    };

    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setEditTitle('');
    setEditContent('');
    setEditTag('');
    setIsEditing(true);
    setCopySuccess(false);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const totalNotesCount = notes.length;
  const pinnedNotesCount = notes.filter(n => n.pinned).length;
  const sortedNotes = [...notes].sort((a, b) => b.pinned - a.pinned);

  const filteredNotes = sortedNotes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      {showDeleteModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-box">
            <div className="modal-icon-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h3 className="modal-title">Delete Study Note?</h3>
            <p className="modal-message">Are you sure you want to delete this? This action cannot be undone.</p>
            <div className="modal-actions-row">
              <button className="modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="modal-btn-confirm" onClick={handleConfirmDelete}>Delete Note</button>
            </div>
          </div>
        </div>
      )}

      {activeNote ? (
        <div className="notes-preview-page">
          <div className="preview-header">
            <button className="preview-back-btn" onClick={() => setActiveNote(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Notes</span>
            </button>

            <div className="preview-actions">
              <button
                className={`preview-action-btn preview-copy-btn ${copySuccess ? 'active' : ''}`}
                onClick={() => handleCopyToClipboard(activeNote.content)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>{copySuccess ? 'Copied' : 'Copy'}</span>
              </button>

              {isEditing ? (
                <button className="preview-action-btn preview-save-btn" onClick={handleSaveNote}>
                  Save Note
                </button>
              ) : (
                <button className="preview-action-btn preview-edit-btn" onClick={() => setIsEditing(true)}>
                  Edit Note
                </button>
              )}

              <button className="preview-action-btn preview-delete-btn" onClick={() => triggerDeleteConfirmation(activeNote.id)}>
                Delete
              </button>
            </div>
          </div>

          <div className="notes-preview-card" style={{ backgroundColor: activeNote.color }}>
            {isEditing ? (
              <div className="preview-form-panel">
                <div className="input-group">
                  <label className="field-label">Title</label>
                  <input
                    type="text"
                    className="preview-input"
                    value={editTitle}
                    placeholder="Enter title"
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="field-label">Category</label>
                  <input
                    type="text"
                    className="preview-input"
                    value={editTag}
                    placeholder="e.g. Artificial Intelligence"
                    onChange={(e) => setEditTag(e.target.value)}
                  />
                </div>

                <div className="input-group textarea-group">
                  <label className="field-label">Notes Content</label>
                  <textarea
                    className="preview-textarea"
                    value={editContent}
                    placeholder="Start typing your study notes here..."
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="preview-content-panel">
                <div className="preview-meta-row">
                  <span className="preview-tag-badge">{activeNote.tag || 'General'}</span>
                  {activeNote.pinned && <span className="preview-pinned-badge">Pinned</span>}
                </div>

                <h2 className="preview-title">{activeNote.title || 'Untitled Note'}</h2>
                <p className="preview-copy-text">{activeNote.content || 'No content provided.'}</p>
                <div className="preview-timestamp">Last Modified • {activeNote.date}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <header className="notes-hero-premium">
            <div className="notes-hero-headline">
              <div className="branding-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>

              <div className="notes-hero-copy">
                <h1 className="white-title">Study Notes</h1>
                <p className="light-subtext">Create and organize your study materials</p>
              </div>
            </div>

            <div className="notes-hero-actions">
              <button className="add-note-btn-premium" onClick={handleCreateNote}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Note</span>
              </button>
            </div>
          </header>

          <div className="notes-search-area">
            <div className="notes-search-wrapper">
              <input
                type="text"
                placeholder="Search notes..."
                className="notes-search-input-premium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
                  ✕
                </button>
              )}
            </div>
          </div>

          {filteredNotes.length > 0 ? (
            <main className="notes-grid-layout">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className={`dashboard-individual-card ${note.pinned ? 'is-pinned' : ''}`}
                  style={{ backgroundColor: note.color }}
                  onClick={() => handleOpenNote(note)}
                >
                  <div className="card-top-content">
                    <div className="card-meta-header">
                      <span className="card-tag-pill">{note.tag || 'General'}</span>
                      {note.pinned && <span className="card-pin-badge">Pinned</span>}
                      <button 
                        className={`card-pin-trigger ${note.pinned ? 'pinned-active' : 'unpinned'}`}
                        onClick={(e) => handleTogglePin(e, note)}
                        title={note.pinned ? "Unpin Note" : "Pin Note"}
                      >
                        📌
                      </button>
                    </div>
                    <h3 className="card-item-title">{note.title || 'Untitled Note'}</h3>
                    <p className="card-item-body">{note.content || 'No content provided.'}</p>
                  </div>
                  <div className="card-item-footer-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {note.date}
                  </div>
                </div>
              ))}
            </main>
          ) : (
            <div className="dashboard-empty-state">
              <div className="empty-state-icon-container">
                {searchQuery ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                )}
              </div>
              <h3 className="empty-state-title">
                {searchQuery ? "No matches found" : "No notes yet"}
              </h3>
              <p className="empty-state-message">
                {searchQuery 
                  ? `Could not find any results for "${searchQuery}". Please check your spelling or refine your keywords.`
                  : "Your study collection is empty. Create a brand new note to begin organizing your workspace."
                }
              </p>
              <button 
                className="empty-state-btn" 
                onClick={searchQuery ? () => setSearchQuery('') : handleCreateNote}
              >
                {searchQuery ? "Clear Search Filter" : "Create First Note"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}