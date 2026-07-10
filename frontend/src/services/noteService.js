import axios from 'axios';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const noteService = {
  // Fetch all notes for a specific user
  async getNotes(userId) {
    const response = await apiClient.get(`/notes/${userId}`);
    // Backend returns { user_id: X, notes: [...] }
    return response.data.notes || [];
  },

  // Get a single note
  async getNote(userId, noteId) {
    const response = await apiClient.get(`/notes/${userId}/${noteId}`);
    return response.data;
  },

  // Create a new note
  async createNote(userId, noteData) {
    const response = await apiClient.post(`/notes/${userId}`, noteData);
    // Backend returns { message: "...", note: NoteResponse }
    return response.data.note;
  },

  // Update an existing note
  async updateNote(userId, noteId, noteData) {
    const response = await apiClient.put(`/notes/${userId}/${noteId}`, noteData);
    // Backend returns { message: "...", note: NoteResponse }
    return response.data.note;
  },

  // Delete a note
  async deleteNote(userId, noteId) {
    const response = await apiClient.delete(`/notes/${userId}/${noteId}`);
    return response.data;
  }
};

export default noteService;
