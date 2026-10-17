import api from './client';

export const shelterApi = {
  getDashboard: async () => {
    const res = await api.get('/shelter/dashboard/');
    return res.data;
  },

  getMyPets: async () => {
    const res = await api.get('/shelter/pets/');
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/shelter/profile/');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/shelter/profile/', data);
    return res.data;
  },
};
