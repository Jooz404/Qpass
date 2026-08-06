import api from './api';

export const feedbackService = {
  getAll: (params) => api.get('/feedback', { params }),
  getById: (id) => api.get(`/feedback/${id}`),
  getByToken: (token) => api.get(`/feedback/token/${token}`),
  submit: (data) => api.post('/feedback', data),
  verifySeal: (data) => api.post('/feedback/verify-seal', data),
};

export default feedbackService;
