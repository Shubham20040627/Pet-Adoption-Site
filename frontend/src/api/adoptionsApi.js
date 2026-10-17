import api from './client';

export const adoptionsApi = {
  submitApplication: async (applicationData) => {
    const res = await api.post('/adoptions/apply/', applicationData);
    return res.data;
  },

  apply: async (applicationData) => {
    return adoptionsApi.submitApplication(applicationData);
  },

  getMyApplications: async () => {
    const res = await api.get('/adoptions/my/');
    return res.data;
  },

  getShelterApplications: async (params = {}) => {
    const res = await api.get('/adoptions/shelter/', { params });
    return res.data;
  },

  updateStatus: async (appId, statusData) => {
    const res = await api.patch(`/adoptions/${appId}/status/`, statusData);
    return res.data;
  },

  updateApplicationStatus: async (appId, statusData) => {
    return adoptionsApi.updateStatus(appId, statusData);
  },

  withdraw: async (appId) => {
    const res = await api.post(`/adoptions/${appId}/withdraw/`);
    return res.data;
  },

  // Meet & Greet Visit Scheduler
  bookVisit: async (visitData) => {
    const res = await api.post('/adoptions/visits/book/', visitData);
    return res.data;
  },

  requestVisit: async (visitData) => {
    return adoptionsApi.bookVisit(visitData);
  },

  getMyVisits: async () => {
    const res = await api.get('/adoptions/visits/my/');
    return res.data;
  },

  getShelterVisits: async () => {
    const res = await api.get('/adoptions/visits/shelter/');
    return res.data;
  },

  updateVisitStatus: async (visitId, statusData) => {
    const res = await api.patch(`/adoptions/visits/${visitId}/status/`, statusData);
    return res.data;
  },

  cancelVisit: async (visitId, notes = '') => {
    return adoptionsApi.updateVisitStatus(visitId, { status: 'cancelled', notes });
  },

  confirmVisit: async (visitId, notes = '') => {
    return adoptionsApi.updateVisitStatus(visitId, { status: 'confirmed', shelter_note: notes });
  },

  completeVisit: async (visitId, notes = '') => {
    return adoptionsApi.updateVisitStatus(visitId, { status: 'completed', shelter_note: notes });
  },

  // Adoption Certificate
  getCertificate: async (appId) => {
    const res = await api.get(`/adoptions/${appId}/certificate/`);
    return res.data;
  },

  verifyCertificate: async (certNumber) => {
    const res = await api.get(`/adoptions/verify-certificate/${certNumber}/`);
    return res.data;
  },

  // Adoption Agreement & E-Signature Contract
  getContract: async (appId) => {
    const res = await api.get(`/adoptions/${appId}/contract/`);
    return res.data;
  },

  signContract: async (appId, contractData) => {
    const res = await api.post(`/adoptions/${appId}/contract/sign/`, contractData);
    return res.data;
  },

  // Real-Time Contextual Live Chat
  getConversations: async () => {
    const res = await api.get('/adoptions/messages/conversations/');
    return res.data;
  },

  getThreadMessages: async (petId, otherUserId = '') => {
    const res = await api.get('/adoptions/messages/thread/', {
      params: { pet_id: petId, other_user_id: otherUserId }
    });
    return res.data;
  },

  sendMessage: async ({ pet_id, recipient_id, application_id, message }) => {
    const res = await api.post('/adoptions/messages/send/', {
      pet_id,
      recipient_id,
      application_id,
      message,
    });
    return res.data;
  },
};
