/**
 * AyuLekha API Service
 * All HTTP calls to the Express backend go through here.
 * Vite proxy forwards /api/* → http://localhost:5000 in development.
 */

const BASE = '/api/patients';

async function apiFetch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * Step 1 — Check if a patient exists by ABHA or mobile number.
 * @param {string} value  ABHA ID or 10-digit mobile number
 */
export async function verifyPatient(value) {
  return apiFetch('/verify', { value });
}

/**
 * Step 2 — Send a real OTP via Twilio Verify to the patient's registered mobile.
 * @param {string} value  ABHA ID or 10-digit mobile number
 */
export async function sendOtp(value) {
  return apiFetch('/send-otp', { value });
}

/**
 * Step 3 — Verify the OTP the patient entered.
 * @param {string} value  ABHA ID or 10-digit mobile number
 * @param {string} otp    6-digit OTP
 */
export async function verifyOtp(value, otp) {
  return apiFetch('/verify-otp', { value, otp });
}

/**
 * Step 4 — Record the patient's clinical consent decision.
 * @param {string}  patientId  Patient ID (e.g. "P001")
 * @param {boolean} consent    true = consented, false = declined
 */
export async function saveConsent(patientId, consent) {
  return apiFetch('/consent', { patientId, consent });
}

/**
 * Step 5 — Save the patient's clinical story / symptom narrative.
 * @param {string}   patientId  Patient ID
 * @param {string}   story      Free-text narrative
 * @param {string[]} symptoms   Extracted symptom tags (optional)
 */
export async function saveStory(patientId, story, symptoms = []) {
  return apiFetch('/story', { patientId, story, symptoms });
}
