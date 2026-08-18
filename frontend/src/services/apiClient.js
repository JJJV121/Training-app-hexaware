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

// Request interceptor to dynamically inject the token
apiClient.interceptors.request.use(
  (config) => {
    const rawToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (rawToken) {
      const cleanToken = rawToken.replace(/^bearer\s+/i, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized/forbidden errors and format validation errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        console.warn('Authentication expired or unauthorized access.');
      }

      // Convert FastAPI 422 detail array/object to clean readable text instead of [object Object]
      const detail = error.response.data?.detail;
      if (Array.isArray(detail)) {
        const formatted = detail
          .map((item) => {
            if (typeof item === 'string') return item;
            const field = Array.isArray(item.loc)
              ? item.loc.filter((l) => l !== 'body' && l !== 'query').join('.')
              : '';
            const msg = item.msg || JSON.stringify(item);
            return field ? `${field}: ${msg}` : msg;
          })
          .join('; ');
        error.response.data.detail = formatted;
      } else if (typeof detail === 'object' && detail !== null) {
        error.response.data.detail = detail.msg || JSON.stringify(detail);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
