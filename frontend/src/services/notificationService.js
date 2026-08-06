import api from './api';

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

export default notificationService;
