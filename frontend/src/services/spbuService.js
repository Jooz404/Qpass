import api from './api';

export const spbuService = {
  getAll: (params) => api.get('/spbu', { params }),
  getById: (id) => api.get(`/spbu/${id}`),
  create: (data) => api.post('/spbu', data),
  update: (id, data) => api.put(`/spbu/${id}`, data),
  delete: (id) => api.delete(`/spbu/${id}`),
};

export default spbuService;
