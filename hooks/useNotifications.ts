import { useState, useCallback } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState<{ id: string, message: string, type?: 'info' | 'error' | 'success' }[]>([]);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  return { notifications, setNotifications, showNotification };
}
