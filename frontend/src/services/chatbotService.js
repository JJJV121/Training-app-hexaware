import apiClient from './apiClient';

export const queryChatbot = async (query, role) => {
  try {
    const response = await apiClient.post('/chatbot/query', { query, role });
    return response.data;
  } catch (error) {
    console.error('Error querying chatbot:', error);
    // Fallback response for offline or error states
    return {
      status: 'success',
      title: 'Hexaware Assistance',
      answer: `I received your question: "${query}". You can use the options below to navigate to the relevant section or try asking again.`,
      action: role === 'admin' 
        ? { label: 'Admin Dashboard', route: 'admin-dashboard' }
        : { label: 'Trainer Overview', route: 'overview' },
      role: role || 'admin'
    };
  }
};

export const getChatbotSuggestions = async (role) => {
  try {
    const response = await apiClient.get('/chatbot/suggestions', { params: { role } });
    return response.data;
  } catch (error) {
    console.error('Error fetching chatbot suggestions:', error);
    return {
      greeting: `Hello ${role === 'admin' ? 'Admin' : 'Trainer'}! How can I assist you today on the Hexaware Learning Platform?`,
      suggestions: role === 'admin' ? [
        'How do I add a new trainer?',
        'How to create and structure a course?',
        'How to assign courses to batches?',
        'How to manage batches?'
      ] : [
        'How do I evaluate pending assignments?',
        'How to schedule a live training session?',
        'Where can I view student performance reports?',
        'How to track batch attendance?'
      ],
      role: role || 'admin'
    };
  }
};
