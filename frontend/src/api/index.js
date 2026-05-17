// FILE: frontend/src/api/auth.api.js
import apiClient from './client';

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  getMe: () => apiClient.get('/auth/me'),
};

// FILE: frontend/src/api/files.api.js (appended below)
export const filesApi = {
  upload: (formData, onProgress) =>
    apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }),

  search: (params) => apiClient.get('/files/search', { params }),
  getFile: (id) => apiClient.get(`/files/${id}`),
  getDownloadUrl: (id) => apiClient.get(`/files/${id}/download`),
  rename: (id, name) => apiClient.patch(`/files/${id}/rename`, { name }),
  share: (id, data) => apiClient.post(`/files/${id}/share`, data),
  delete: (id) => apiClient.delete(`/files/${id}`),
};

// FILE: frontend/src/api/admin.api.js (appended below)
export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  listUsers: (params) => apiClient.get('/admin/users', { params }),
  toggleUserStatus: (id) => apiClient.patch(`/admin/users/${id}/toggle-status`),
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }),
};
