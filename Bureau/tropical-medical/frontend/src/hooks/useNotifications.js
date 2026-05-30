import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notification.service';
import { getSocket } from '../socket';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);

  const load = useCallback(async () => {
    try {
      const r = await notificationService.getAll();
      setNotifications(r.data);
      setUnread(r.data.filter(n => !n.lu).length);
    } catch {}
  }, []);

  useEffect(() => {
    load();

    const socket = getSocket();
    if (!socket) return;

    const handler = (notif) => {
      setNotifications(prev => [{ ...notif, id_notification: notif.id_notification || Date.now() }, ...prev.slice(0, 58)]);
      setUnread(prev => prev + 1);
    };

    socket.on('notification', handler);
    return () => { socket.off('notification', handler); };
  }, [load]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id_notification === id ? { ...n, lu: 1 } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: 1 })));
      setUnread(0);
    } catch {}
  }, []);

  const remove = useCallback(async (id) => {
    try {
      await notificationService.remove(id);
      setNotifications(prev => {
        const n = prev.find(x => x.id_notification === id);
        if (n && !n.lu) setUnread(u => Math.max(0, u - 1));
        return prev.filter(x => x.id_notification !== id);
      });
    } catch {}
  }, []);

  return { notifications, unread, markRead, markAllRead, remove, reload: load };
}
