
import { useEffect, useState } from 'react';
import './SharedSummary.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function SharedSummary({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const response = await fetch(
          `${API_URL}/api/patients/shared/${encodeURIComponent(token)}`
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || 'This share link is invalid or expired.'
          );
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load the summary.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (token) {
      loadSummary();
    } else {
      setError('No share token was provided.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="shared-summary-page">
      <header className="shared-summary-header">
        <h1>AyuLekha</h1>
        <p>Shared Clinical Summary</p>
      </header>

      {loading && <p role="status">Loading shared summary...</p>}

      {!loading && error && (
        <section className="shared-summary-message" role="alert">
          <h2>Summary unavailable</h2>
          <p>{error}</p>
          <p>Ask the clinician to create a new share link if needed.</p>
        </section>
      )}

      {!loading && !error && data && (
        <>
          <section className="shared-summary-card">
            <h2>Patient Details</h2>
            <p><strong>Name:</strong> {data.patient?.name || 'Not provided'}</p>
            <p><strong>Age:</strong> {data.patient?.age ?? 'Not provided'}</p>
            <p><strong>Gender:</strong> {data.patient?.gender || 'Not provided'}</p>
          </section>

          <section className="shared-summary-card">
            <h2>Clinical Summary</h2>
            <div className="shared-summary-content">
              {typeof data.summary === 'string'
                ? data.summary
                : JSON.stringify(data.summary, null, 2)}
            </div>
          </section>

          {data.vitals && Object.keys(data.vitals).length > 0 && (
            <section className="shared-summary-card">
              <h2>Vitals</h2>
              <pre>{JSON.stringify(data.vitals, null, 2)}</pre>
            </section>
          )}

          <p className="shared-summary-notice">
            This information is confidential. Share it only with authorized
            healthcare professionals.
          </p>
        </>
      )}
    </main>
  );
}
