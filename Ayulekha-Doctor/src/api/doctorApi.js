// src/api/doctorApi.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('ayulekha_doctor_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('ayulekha_doctor_token');
    window.location.reload();
  }

  if (!response.ok) {
    let errorDetail = `API Error: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch (_) {}
    throw new Error(errorDetail);
  }

  return response.json();
}

export const doctorApi = {
  getDoctorProfile: () => fetchWithAuth('/api/doctor/profile'),
  getStationInfo: () => fetchWithAuth('/api/doctor/station-info'),
  getPatientsQueue: (licenseNumber) => {
    const lic = licenseNumber || localStorage.getItem('ayulekha_doctor_license') || '';
    return fetchWithAuth(`/api/doctor/patients${lic ? `?doctor_license=${lic}` : ''}`);
  },
  getPatientDetails: (id, licenseNumber) => {
    const lic = licenseNumber || localStorage.getItem('ayulekha_doctor_license') || '';
    return fetchWithAuth(`/api/doctor/patients/${id}${lic ? `?doctor_license=${lic}` : ''}`);
  },
  getPatientDocuments: (id) => fetchWithAuth(`/api/doctor/patients/${id}/documents`),
  getPatientHistory: (id) => fetchWithAuth(`/api/doctor/patients/${id}/history`),
  markPatientDone: (id, notes = '') => fetchWithAuth(`/api/doctor/patients/${id}/done`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  }),
  requestPatientAccess: ({ abhaId, shareId, summaryId, licenseNumber, doctorName }) =>
    fetchWithAuth('/api/doctor/request-access', {
      method: 'POST',
      body: JSON.stringify({
        abha_id: abhaId,
        share_id: shareId || summaryId,
        summary_id: summaryId || shareId,
        license_number: licenseNumber,
        doctor_name: doctorName,
      }),
    }),
  getActiveSharedRecords: (licenseNumber) =>
    fetchWithAuth(`/api/doctor/active-shared-records${licenseNumber ? `?doctor_license=${licenseNumber}` : ''}`),
  getSharingTrail: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchWithAuth(`/api/doctor/sharing-trail${q ? `?${q}` : ''}`);
  },
};
