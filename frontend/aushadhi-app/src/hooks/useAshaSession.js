import { useState, useEffect, useCallback } from 'react';

export default function useAshaSession() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ashaSession');
      if (raw) {
        setSession(JSON.parse(raw));
      }
    } catch (_error) {
      localStorage.removeItem('ashaSession');
    }
  }, []);

  const saveSession = useCallback((worker) => {
    localStorage.setItem('ashaSession', JSON.stringify(worker));
    setSession(worker);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('ashaSession');
    setSession(null);
  }, []);

  return { session, saveSession, clearSession };
}
