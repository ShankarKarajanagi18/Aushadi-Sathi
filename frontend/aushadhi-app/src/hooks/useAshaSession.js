import { useState, useCallback } from 'react';

export default function useAshaSession() {
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem('ashaSession');
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      localStorage.removeItem('ashaSession');
      return null;
    }
  });

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
