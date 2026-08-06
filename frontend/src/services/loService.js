import api from './api';

export const loService = {
  getAll: (params) => api.get('/lo', { params }),
  getById: (id) => api.get(`/lo/${id}`),
  getByNoLO: (noLO) => api.get(`/lo/no/${noLO}`),
  create: (data) => api.post('/lo', data),
  updateStatus: (id, status) => api.patch(`/lo/${id}/status`, { status }),
  verifyQR: (qrData) => api.post('/lo/verify-qr', { qrData }),
  generateDaily: (date) => api.post('/lo/generate-daily', { date }),
};

export default loService;
