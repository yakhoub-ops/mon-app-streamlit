import api from './api';

export const urgenceService = {
  getAll:          (params = {}) => api.get('/urgences', { params }),
  getOne:          (id)          => api.get(`/urgences/${id}`),
  create:          (data)        => api.post('/urgences', data),
  update:          (id, data)    => api.put(`/urgences/${id}`, data),
  prendreEnCharge: (id)          => api.put(`/urgences/${id}`, { statut: 'prise_en_charge' }),
  resoudre:        (id)          => api.put(`/urgences/${id}`, { statut: 'resolue' }),
  remove:          (id)          => api.delete(`/urgences/${id}`),
};
