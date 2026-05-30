import api from './api';

export const consultationService = {
  getAll:   (params = {}) => api.get('/consultations', { params }),
  getOne:   (id)          => api.get(`/consultations/${id}`),
  create:   (data)        => api.post('/consultations', data),
  update:   (id, data)    => api.put(`/consultations/${id}`, data),
  terminer: (id)          => api.put(`/consultations/${id}`, { statut: 'terminee' }),
};
