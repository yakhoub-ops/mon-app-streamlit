import api from './api';

export const factureService = {
  getAll:   (params = {}) => api.get('/factures', { params }),
  getOne:   (id)          => api.get(`/factures/${id}`),
  getStats: ()            => api.get('/factures/stats'),
  create:   (data)        => api.post('/factures', data),
  update:   (id, data)    => api.put(`/factures/${id}`, data),
  payer:    (id, data)    => api.put(`/factures/${id}`, data),
  annuler:  (id)          => api.delete(`/factures/${id}`),
};
