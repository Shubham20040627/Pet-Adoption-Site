import api from './client';

export const authApi = {
  register: async (userData) => {
    const res = await api.post('/auth/register/', userData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login/', credentials);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me/');
    return res.data;
  },

  updateMe: async (updates) => {
    const res = await api.put('/auth/me/', updates);
    return res.data;
  },
};
