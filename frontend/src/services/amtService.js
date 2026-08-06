import api from './api';

export const amtService = {
  getAll: (params) => api.get('/amt', { params }),
  getById: (id) => api.get(`/amt/${id}`),
  create: (data) => api.post('/amt', data),
  update: (id, data) => api.put(`/amt/${id}`, data),
  delete: (id) => api.delete(`/amt/${id}`),
  submitFeedback: (data) => api.post('/amt-feedback', data),
  getFeedbackHistory: (params) => api.get('/amt-feedback', { params }),
};

export default amtService;
