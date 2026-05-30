import api from './api';

export const teleconsultationService = {
  getAll:           ()         => api.get('/teleconsultations'),
  getOne:           (id)       => api.get(`/teleconsultations/${id}`),
  create:           (data)     => api.post('/teleconsultations', data),
  update:           (id, data) => api.put(`/teleconsultations/${id}`, data),
  toggleTeleconsult:(actif)    => api.put('/teleconsultations/toggle-teleconsult', { actif }),
};
