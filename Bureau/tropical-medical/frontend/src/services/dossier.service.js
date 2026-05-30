import api from './api';

export const dossierService = {
  getByPatient:    (id_patient)       => api.get(`/dossiers/patient/${id_patient}`),
  updateByPatient: (id_patient, data) => api.put(`/dossiers/patient/${id_patient}`, data),
};
