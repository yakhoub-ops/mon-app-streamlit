import api from './api';

export const interactionService = {
  getAll:  ()              => api.get('/interactions'),
  checker: (ids)           => api.post('/interactions/checker', { ids_medicaments: ids }),
  create:  (data)          => api.post('/interactions', data),
  update:  (id, data)      => api.put(`/interactions/${id}`, data),
  remove:  (id)            => api.delete(`/interactions/${id}`),
};
