import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';

export function useAuth() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { 
    data: authData,
    isLoading: isAuthLoading,
    error: authError,
  } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  const user = authData?.user;
  const isLoggedIn = !!user;

  const login = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest('POST', '/api/auth/login', { username });
      return res.json();
    },
    onSuccess: () => {
      setIsAuthModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
  });

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return {
    user,
    isLoggedIn,
    isLoading: isAuthLoading,
    error: authError,
    login,
    logout,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  };
}
