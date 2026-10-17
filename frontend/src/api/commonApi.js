import api from './client';

export const commonApi = {
  getFavorites: async () => {
    const res = await api.get('/favorites/');
    return res.data;
  },

  toggleFavorite: async (petId) => {
    const res = await api.post('/favorites/toggle/', { pet_id: petId });
    return res.data;
  },

  getNotifications: async () => {
    const res = await api.get('/notifications/');
    return res.data;
  },

  markNotificationRead: async (notifId) => {
    const res = await api.patch(`/notifications/${notifId}/read/`);
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.post('/notifications/read-all/');
    return res.data;
  },

  sendContactMessage: async (formData) => {
    const res = await api.post('/contact/', formData);
    return res.data;
  },

  assessReadiness: async (answers) => {
    const res = await api.post('/readiness/assess/', { answers });
    return res.data;
  },

  getHealth: async () => {
    const res = await api.get('/health/');
    return res.data;
  },
};
