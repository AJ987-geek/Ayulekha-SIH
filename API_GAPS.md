# API Gaps for Doctor Frontend

The following API endpoints have been integrated into the doctor frontend but may not yet exist in the backend. They are required to supply the data that was previously hardcoded.

### 1. Doctor Profile
- **Endpoint**: `GET /api/doctor/profile`
- **Used In**: `DoctorDashboard.jsx`
- **Request**: `Authorization: Bearer <token>`
- **Expected Response**: 
  ```json
  {
    "id": "doc-123",
    "firstName": "Rajesh",
    "lastName": "Sharma",
    "department": "OPD 3",
    "registrationNumber": "MCI Reg. #MH-2019-48320"
  }
  ```

### 2. Patient Queue (Polling)
- **Endpoint**: `GET /api/doctor/patients`
- **Used In**: `DoctorDashboard.jsx` (Polled every 5 seconds)
- **Request**: `Authorization: Bearer <token>`
- **Expected Response**: Array of patient objects for today's queue.
  ```json
  [
    {
      "id": 1,
      "name": "Ram Kumar Sharma",
      "initials": "RK",
      "color": "#1A7A4A",
      "age": 52,
      "gender": "M",
      "token": "T-01",
      "status": "consult",
      "statusLabel": "🟢 In Consult"
    }
  ]
  ```

### 3. Patient Details
- **Endpoint**: `GET /api/doctor/patients/{id}`
- **Used In**: `PatientSummary.jsx` (Top info strip, Vitals, AI Summary Tab)
- **Request**: `Authorization: Bearer <token>`
- **Expected Response**: 
  ```json
  {
    "id": 1,
    "name": "Ram Kumar Sharma",
    "age": 52,
    "gender": "M",
    "bloodType": "B+",
    "location": "Banda, UP",
    "abhaId": "AYU-2024-001",
    "token": "T-01",
    "vitals": [
      { "num": "142/88", "lbl": "BP (mmHg)", "alert": true }
    ],
    "complaint": "Chest tightness",
    "duration": "3 days",
    "symptoms": ["Chest Pain"],
    "analysis": "<strong>High-priority review recommended.</strong>",
    "suggestions": ["Order ECG immediately"]
  }
  ```

### 4. Patient Documents
- **Endpoint**: `GET /api/doctor/patients/{id}/documents`
- **Used In**: `PatientSummary.jsx` (Documents Tab)
- **Request**: `Authorization: Bearer <token>`
- **Expected Response**:
  ```json
  [
    {
      "id": "doc-1",
      "name": "Chest X-Ray",
      "type": "xray",
      "typeLabel": "X-Ray",
      "uploadedAt": "2024-10-08T10:00:00Z"
    }
  ]
  ```

### 5. Patient History
- **Endpoint**: `GET /api/doctor/patients/{id}/history`
- **Used In**: `PatientSummary.jsx` (Past History Tab)
- **Request**: `Authorization: Bearer <token>`
- **Expected Response**:
  ```json
  {
    "history": "Hypertension (5 yrs), Type 2 Diabetes",
    "meds": "Amlodipine 5mg",
    "allergies": "Penicillin",
    "visits": [
      {
        "date": "2024-10-01T10:00:00Z",
        "title": "Latest Visit",
        "description": "Recorded by triage AI.",
        "chips": [{ "label": "Assessed", "type": "diagnosis" }]
      }
    ]
  }
  ```
