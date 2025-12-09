import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://auto-mail-generator-backend.onrender.com/api';

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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Gmail API
export const gmailAPI = {
  getAuthUrl: () => api.get('/gmail/auth-url'),
  disconnect: () => api.post('/gmail/disconnect'),
  getStatus: () => api.get('/gmail/status'),
};

// Email API
export const emailAPI = {
  // Scan inbox for new emails
  scanInbox: (period = 'day') => api.post(`/email/scan?period=${period}`),
  
  // Get pending drafts
  getPendingDrafts: (period = 'week') => api.get(`/email/drafts/pending?period=${period}`),
  
  // Get all drafts with optional filters
  getAllDrafts: (status, period) => {
    let url = '/email/drafts?';
    if (status) url += `status=${status}&`;
    if (period) url += `period=${period}`;
    return api.get(url);
  },
  
  // Get single draft by ID (for WhatsApp direct link)
  getDraft: (draftId) => api.get(`/email/drafts/${draftId}`),
  
  // Approve draft and send email
  approveDraft: (draftId) => api.post(`/email/drafts/${draftId}/approve`),
  
  // Reject draft
  rejectDraft: (draftId) => api.post(`/email/drafts/${draftId}/reject`),
  
  // Edit and send draft
  editDraft: (draftId, editedBody) => api.post(`/email/drafts/${draftId}/edit`, { editedBody }),
};

// Stats API (if you have one)
export const statsAPI = {
  getDashboardStats: () => api.get('/stats/dashboard'),
};

export default api;
















