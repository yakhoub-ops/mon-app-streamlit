import api from './api';

export const medecinService = {
  getAll:                 ()             => api.get('/medecins'),
  getOne:                 (id)           => api.get(`/medecins/${id}`),
  getDisponibilites:      (id)           => api.get(`/medecins/${id}/disponibilites`),
  updateDisponibilites:   (id, data)     => api.put(`/medecins/${id}/disponibilites`, data),
  getCreneaux:            (id, date)     => api.get(`/medecins/${id}/creneaux`, { params: { date } }),
};
