import api from './api';

export const vesselDischargeService = {
  getAll: (params) => api.get('/vessel-discharge', { params }),
  getStats: () => api.get('/vessel-discharge/stats'),
  getById: (id) => api.get(`/vessel-discharge/${id}`),
  create: (data) => api.post('/vessel-discharge', data),
  delete: (id) => api.delete(`/vessel-discharge/${id}`),
};

export default vesselDischargeService;
