// src/api/doctorApi.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export const doctorApi = {
  getDoctorProfile: () => fetchWithAuth('/api/doctor/profile'),
  getPatientsQueue: () => fetchWithAuth('/api/doctor/patients'),
  getPatientDetails: (id) => fetchWithAuth(`/api/doctor/patients/${id}`),
  getPatientDocuments: (id) => fetchWithAuth(`/api/doctor/patients/${id}/documents`),
  getPatientHistory: (id) => fetchWithAuth(`/api/doctor/patients/${id}/history`),
};
