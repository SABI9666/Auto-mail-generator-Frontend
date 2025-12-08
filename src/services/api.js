import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://auto-mail-generator-backend.onrender.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
