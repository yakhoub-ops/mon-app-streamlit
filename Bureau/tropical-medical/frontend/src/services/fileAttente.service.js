import api from './api';

export const fileAttenteService = {
  getAll:   (params = {}) => api.get('/file-attente', { params }),
  getOne:   (id)          => api.get(`/file-attente/${id}`),
  create:   (data)        => api.post('/file-attente', data),
  update:   (id, data)    => api.put(`/file-attente/${id}`, data),
  appeler:  (id)          => api.put(`/file-attente/${id}`, { statut: 'appele' }),
  consulte: (id)          => api.put(`/file-attente/${id}`, { statut: 'consulte' }),
  parti:    (id)          => api.put(`/file-attente/${id}`, { statut: 'parti' }),
  remove:   (id)          => api.delete(`/file-attente/${id}`),
};
