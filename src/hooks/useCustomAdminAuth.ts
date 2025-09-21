import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthState {
  isAuthenticated: boolean;
  loading: boolean;
}

export const useCustomAdminAuth = () => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    // Enforce sign-in on each new browser session (no persistent local bypass)
    const adminToken = sessionStorage.getItem('admin_token');
    if (adminToken === 'authenticated_admin') {
      setAuthState({ isAuthenticated: true, loading: false });
    } else {
      setAuthState({ isAuthenticated: false, loading: false });
    }
  }, []);

  const signIn = async (adminId: string, password: string) => {
    try {
      // Simple authentication check - in production, this should be properly hashed
      if (adminId === 'ayushavi@officialchutiya.com' && password === 'jalaramnamkeen@9431') {
        sessionStorage.setItem('admin_token', 'authenticated_admin');
        setAuthState({ isAuthenticated: true, loading: false });
        return { success: true, error: null };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Authentication failed' };
    }
  };

  const signOut = () => {
    sessionStorage.removeItem('admin_token');
    setAuthState({ isAuthenticated: false, loading: false });
  };

  return {
    ...authState,
    signIn,
    signOut,
  };
};
