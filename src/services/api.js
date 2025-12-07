import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  connectGmail: () => api.get('/auth/gmail/url')
};

export const emailAPI = {
  scanInbox: () => api.post('/email/scan'),
  getPendingDrafts: () => api.get('/drafts/pending'),
  approveDraft: (id) => api.post(`/drafts/${id}/approve`),
  rejectDraft: (id) => api.post(`/drafts/${id}/reject`),
  editDraft: (id, body) => api.post(`/drafts/${id}/edit`, { editedBody: body })
};

export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard')
};

export default api;
