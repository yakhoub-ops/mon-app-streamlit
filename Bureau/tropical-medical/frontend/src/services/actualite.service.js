import api from './api';

export const actualiteService = {
  getAll:   (params = {}) => api.get('/actualites', { params }),
  generer:  ()            => api.post('/actualites/generer'),
};
