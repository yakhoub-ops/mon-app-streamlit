import api from './api';

export const authService = {
  register:      (data) => api.post('/auth/register', data),
  login:         (email, mot_de_passe) => api.post('/auth/login', { email, mot_de_passe }),
  me:            () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};
