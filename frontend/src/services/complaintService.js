import api from './api';

export const complaintService = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
};

export default complaintService;
