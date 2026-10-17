import api from './client';

export const adminApi = {
  getOverview: async () => {
    const res = await api.get('/admin/overview/');
    return res.data;
  },

  getShelters: async (params = {}) => {
    const res = await api.get('/admin/shelters/', { params });
    return res.data;
  },

  updateShelterStatus: async (userId, data) => {
    const res = await api.patch(`/admin/shelters/${userId}/status/`, data);
    return res.data;
  },
};
