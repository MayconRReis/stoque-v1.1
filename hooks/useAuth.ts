import { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User as AppUser } from '../types';

export function useAuth(showNotification: (msg: string, type?: 'success'|'error'|'info') => void) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we are in public view mode via URL param
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'public') {
          setIsPublicView(true);
          setIsAuthLoading(false);
          return;
        }

        const currentUser = await supabaseService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth check error:', error);
        showNotification('Erro ao verificar sessão. Faça login novamente.', 'error');
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, [showNotification]);

  return { user, setUser, isAuthLoading, isPublicView, setIsPublicView };
}
