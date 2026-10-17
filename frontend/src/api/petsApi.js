import api from './client';

export const petsApi = {
  list: async (params = {}) => {
    const res = await api.get('/pets/', { params });
    return res.data;
  },

  getById: async (petId) => {
    const res = await api.get(`/pets/${petId}/`);
    return res.data;
  },

  create: async (formData) => {
    const isFormData = formData instanceof FormData;
    const res = await api.post('/pets/create/', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  },

  update: async (petId, formData) => {
    const isFormData = formData instanceof FormData;
    const res = await api.put(`/pets/${petId}/update/`, formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  },

  delete: async (petId) => {
    const res = await api.delete(`/pets/${petId}/delete/`);
    return res.data;
  },

  getFeatured: async () => {
    const res = await api.get('/pets/featured/');
    return res.data;
  },

  pawMatch: async (preferences) => {
    const res = await api.post('/pets/match/', preferences);
    return res.data;
  },
};
