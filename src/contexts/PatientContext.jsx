import { createContext, useContext, useState } from 'react';

const PatientContext = createContext(null);

/**
 * Wrap the app with <PatientProvider> so any page can call usePatient()
 * to read or update the currently authenticated patient.
 */
export function PatientProvider({ children }) {
  const [patient, setPatient] = useState(null);

  return (
    <PatientContext.Provider value={{ patient, setPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used inside <PatientProvider>');
  return ctx;
}
