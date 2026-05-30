import api from './api';

export const stockService = {
  getAll:          (params = {}) => api.get('/stock', { params }),
  getOne:          (id)          => api.get(`/stock/${id}`),
  getAlertes:      ()            => api.get('/stock/alertes'),
  getPeremptions:  (days = 90)   => api.get('/stock/peremptions', { params: { days } }),
  getMouvements:   (id)          => api.get(`/stock/${id}/mouvements`),
  getMouvementsAll:()            => api.get('/stock/mouvements'),
  entree:          (id, data)    => api.post(`/stock/${id}/entree`, data),
  sortie:          (id, data)    => api.post(`/stock/${id}/sortie`, data),
  create:          (data)        => api.post('/stock', data),
  update:          (id, data)    => api.put(`/stock/${id}`, data),
  remove:          (id)          => api.delete(`/stock/${id}`),
};
