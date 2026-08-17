import apiClient from './apiClient';

export const noteService = {
  async getNotes(userId) {
    const response = await apiClient.get(`/notes/${userId}`);
    // Backend returns NotesListResponse or array
    return response.data?.notes || response.data || [];
  },

  async createNote(userId, payload) {
    const response = await apiClient.post(`/notes/${userId}`, payload);
    return response.data;
  },

  async updateNote(userId, noteId, payload) {
    const response = await apiClient.put(`/notes/${userId}/${noteId}`, payload);
    return response.data;
  },

  async deleteNote(userId, noteId) {
    const response = await apiClient.delete(`/notes/${userId}/${noteId}`);
    return response.data;
  }
};

export default noteService;
