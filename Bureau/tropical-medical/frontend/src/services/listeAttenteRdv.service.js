import api from './api';

export const listeAttenteRdvService = {
  getAll:  ()     => api.get('/liste-attente-rdv'),
  create:  (data) => api.post('/liste-attente-rdv', data),
  remove:  (id)   => api.delete(`/liste-attente-rdv/${id}`),
};
