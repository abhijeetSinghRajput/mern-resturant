import { useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Hook to handle Google OAuth Sign-In
 * Backend verifies the Google ID token for security
 */
export const useGoogleAuth = () => {
  const handleGoogleLogin = useCallback(() => {
    if (!BACKEND_URL) {
      throw new Error('Missing VITE_BACKEND_URL in frontend .env');
    }

    window.location.href = `${BACKEND_URL}/api/auth/google`;
  }, []);

  return { handleGoogleLogin };
};
