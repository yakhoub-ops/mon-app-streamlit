import api from './api';

export const patientService = {
  getAll:  (search = '') => api.get('/patients', { params: search ? { q: search } : {} }),
  getOne:  (id)          => api.get(`/patients/${id}`),
  create:  (data)        => api.post('/patients', data),
  update:  (id, data)    => api.put(`/patients/${id}`, data),
  remove:  (id)          => api.delete(`/patients/${id}`),
};
