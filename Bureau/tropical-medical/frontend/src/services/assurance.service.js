import api from './api';

export const assuranceService = {
  getAll:  ()         => api.get('/assurances'),
  create:  (data)     => api.post('/assurances', data),
  update:  (id, data) => api.put(`/assurances/${id}`, data),
  remove:  (id)       => api.delete(`/assurances/${id}`),
};
