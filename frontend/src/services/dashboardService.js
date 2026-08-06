import api from './api';

export const dashboardService = {
  getSummary: () => api.get('/dashboard/summary'),
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getRecentActivity: () => api.get('/dashboard/recent'),
};

export default dashboardService;
