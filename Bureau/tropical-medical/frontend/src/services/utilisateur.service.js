import api from './api';

export const utilisateurService = {
  getStats:        ()         => api.get('/utilisateurs/stats').then(r => r.data),
  getAll:          (params)   => api.get('/utilisateurs', { params }).then(r => r.data),
  getOne:          (id)       => api.get(`/utilisateurs/${id}`).then(r => r.data),
  create:          (data)     => api.post('/utilisateurs', data).then(r => r.data),
  update:          (id, data) => api.put(`/utilisateurs/${id}`, data).then(r => r.data),
  resetPassword:   (id, pwd)  => api.post(`/utilisateurs/${id}/reset-password`, { nouveau_mot_de_passe: pwd }).then(r => r.data),
  remove:          (id)       => api.delete(`/utilisateurs/${id}`).then(r => r.data),
};
