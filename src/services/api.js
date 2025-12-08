import axios from 'axios';

// CRITICAL: Check if API URL is set
const API_URL = process.env.REACT_APP_API_URL || 'https://auto-mail-generator-backend.onrender.com';

console.log('🔗 API URL:', API_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method.toUpperCase()} ${config.url}`, config.data || '');
  return config;
}, (error) => {
  console.error('❌ Request Error:', error);
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error(`❌ API Error [${error.response.status}]:`, error.response.data);
      console.error('URL:', error.config.url);
    } else if (error.request) {
      // Request made but no response
      console.error('❌ No response from server:', error.message);
      console.error('API URL:', API_URL);
      console.error('Check if backend is running!');
    } else {
      // Something else happened
      console.error('❌ Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  
  // Gmail OAuth
  connectGmail: () => api.get('/api/auth/gmail/url'),
  getGmailStatus: () => api.get('/api/auth/gmail/status'),
  disconnectGmail: () => api.delete('/api/auth/gmail/disconnect')
};

// Email Management API
export const emailAPI = {
  // Scan inbox with period parameter
  scanInbox: (period = 'day') => api.post(`/api/email/scan?period=${period}`),
  
  // Get drafts
  getPendingDrafts: (period = 'week') => api.get(`/api/email/drafts/pending?period=${period}`),
  getAllDrafts: (status, period) => {
    let url = '/api/email/drafts?';
    if (status) url += `status=${status}&`;
    if (period) url += `period=${period}`;
    return api.get(url);
  },
  getDraft: (draftId) => api.get(`/api/email/drafts/${draftId}`),
  
  // Draft actions
  approveDraft: (draftId) => api.post(`/api/email/drafts/${draftId}/approve`),
  rejectDraft: (draftId) => api.post(`/api/email/drafts/${draftId}/reject`),
  editDraft: (draftId, editedBody) => api.post(`/api/email/drafts/${draftId}/edit`, { editedBody })
};

// Statistics API
export const statsAPI = {
  getDashboard: () => api.get('/api/stats'),
  getDraftStats: () => api.get('/api/stats/drafts'),
  getTimeline: (days = 7) => api.get(`/api/stats/timeline?days=${days}`)
};

export default api;
