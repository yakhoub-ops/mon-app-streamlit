import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = ref(localStorage.getItem('token') || '');

  const isLoggedIn = computed(() => !!token.value);
  const role = computed(() => user.value?.role);
  const isAdmin = computed(() => role.value === 'admin');
  const isMedecin = computed(() => role.value === 'medecin');
  const isPatient = computed(() => role.value === 'patient');
  const isReceptionniste = computed(() => role.value === 'receptionniste');
  const isPharmacien = computed(() => role.value === 'pharmacien');

  const login = async (email, mot_de_passe) => {
    const data = await api.post('/auth/login', { email, mot_de_passe });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    connectSocket(data.token);
    return data;
  };

  const logout = () => {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
  };

  const refreshMe = async () => {
    try {
      const me = await api.get('/auth/me');
      user.value = me;
      localStorage.setItem('user', JSON.stringify(me));
    } catch {
      logout();
    }
  };

  if (token.value) connectSocket(token.value);

  return { user, token, isLoggedIn, role, isAdmin, isMedecin, isPatient, isReceptionniste, isPharmacien, login, logout, refreshMe };
});
