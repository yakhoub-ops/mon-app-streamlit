import api from './api';

export const ordonnanceService = {
  getAll:         (params = {}) => api.get('/ordonnances', { params }),
  getOne:         (id)          => api.get(`/ordonnances/${id}`),
  create:         (data)        => api.post('/ordonnances', data),
  updateStatut:   (id, statut)  => api.put(`/ordonnances/${id}`, { statut }),
  annuler:        (id)          => api.delete(`/ordonnances/${id}`),
  getMedicaments: ()            => api.get('/ordonnances/medicaments'),
};
