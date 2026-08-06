import api from './api';

export const truckService = {
  getAll: (params) => api.get('/trucks', { params }),
  getById: (id) => api.get(`/trucks/${id}`),
  create: (data) => api.post('/trucks', data),
  update: (id, data) => api.put(`/trucks/${id}`, data),
  delete: (id) => api.delete(`/trucks/${id}`),
};

export default truckService;
