import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../utils/api';
import { getSocket } from '../utils/socket';

export const useNotifStore = defineStore('notifications', () => {
  const notifs = ref([]);
  const unread = ref(0);

  const fetchAll = async () => {
    notifs.value = await api.get('/notifications');
    unread.value = notifs.value.filter((n) => !n.lu).length;
  };

  const fetchUnread = async () => {
    const { count } = await api.get('/notifications/unread-count');
    unread.value = count;
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    const n = notifs.value.find((x) => x.id_notification === id);
    if (n) { n.lu = true; unread.value = Math.max(0, unread.value - 1); }
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    notifs.value.forEach((n) => (n.lu = true));
    unread.value = 0;
  };

  const remove = async (id) => {
    await api.delete(`/notifications/${id}`);
    notifs.value = notifs.value.filter((n) => n.id_notification !== id);
  };

  const listenSocket = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('notification', (notif) => {
      notifs.value.unshift(notif);
      unread.value++;
    });
  };

  return { notifs, unread, fetchAll, fetchUnread, markRead, markAllRead, remove, listenSocket };
});
