import api from './api';

export const rdvService = {
  getAll:     (params = {}) => api.get('/rdv', { params }),
  getOne:     (id)          => api.get(`/rdv/${id}`),
  create:     (data)        => api.post('/rdv', data),
  update:     (id, data)    => api.put(`/rdv/${id}`, data),
  cancel:     (id)          => api.put(`/rdv/${id}`, { statut: 'annule' }),
  confirmer:  (id)          => api.put(`/rdv/${id}`, { statut: 'confirme' }),
  terminer:   (id)          => api.put(`/rdv/${id}`, { statut: 'termine' }),
};
