import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://auto-mail-generator-backend.onrender.com/api';

console.log('🔗 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing token');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════════════════════
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  connectGmail: () => api.get('/gmail/auth-url'),
  disconnectGmail: () => api.post('/gmail/disconnect'),
  getGmailStatus: () => api.get('/gmail/status'),
};

// ═══════════════════════════════════════════════════════════════════════════
// GMAIL API
// ═══════════════════════════════════════════════════════════════════════════
export const gmailAPI = {
  getAuthUrl: () => api.get('/gmail/auth-url'),
  disconnect: () => api.post('/gmail/disconnect'),
  getStatus: () => api.get('/gmail/status'),
  callback: (code) => api.get(`/gmail/callback?code=${code}`),
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL API
// ═══════════════════════════════════════════════════════════════════════════
export const emailAPI = {
  // Manual Scan
  scanInbox: (period = 'day') => api.post(`/email/scan?period=${period}`),
  
  // Drafts
  getPendingDrafts: (period = 'week') => api.get(`/email/drafts/pending?period=${period}`),
  getAllDrafts: (status, period) => {
    let url = '/email/drafts?';
    if (status) url += `status=${status}&`;
    if (period) url += `period=${period}`;
    return api.get(url);
  },
  getDraft: (draftId) => api.get(`/email/drafts/${draftId}`),
  approveDraft: (draftId) => api.post(`/email/drafts/${draftId}/approve`),
  rejectDraft: (draftId) => api.post(`/email/drafts/${draftId}/reject`),
  editDraft: (draftId, editedBody) => api.post(`/email/drafts/${draftId}/edit`, { editedBody }),

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-SCAN API
  // ═══════════════════════════════════════════════════════════════════════
  getAutoScanSettings: () => api.get('/email/auto-scan/settings'),
  toggleAutoScan: () => api.post('/email/auto-scan/toggle'),
  updateAutoScanInterval: (interval) => api.put('/email/auto-scan/interval', { interval }),
};

// ═══════════════════════════════════════════════════════════════════════════
// STATS API
// ═══════════════════════════════════════════════════════════════════════════
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getDashboardStats: () => api.get('/stats/dashboard'),
};

export default api;




























































