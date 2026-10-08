import api from './api';

export const qualityControlService = {
  getAll: (params) => api.get('/quality-control', { params }),
  getStats: () => api.get('/quality-control/stats'),
  getById: (id) => api.get(`/quality-control/${id}`),
  create: (data) => api.post('/quality-control', data),
  update: (id, data) => api.put(`/quality-control/${id}`, data),
  delete: (id) => api.delete(`/quality-control/${id}`),
};

export default qualityControlService;
