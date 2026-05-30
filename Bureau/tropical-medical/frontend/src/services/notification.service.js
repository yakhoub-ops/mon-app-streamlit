import api from './api';

export const notificationService = {
  getAll:       ()    => api.get('/notifications'),
  getUnread:    ()    => api.get('/notifications/unread-count'),
  markRead:     (id)  => api.put(`/notifications/${id}`),
  markAllRead:  ()    => api.put('/notifications/mark-all-read'),
  remove:       (id)  => api.delete(`/notifications/${id}`),
};
