import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, tenantApi, getTenantIdFromToken } from '@/lib/api';

export function useAuth() {
  const qc = useQueryClient();

  const tenantQuery = useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: () => tenantApi.getMe().then((r) => r.data),
    enabled: !!getTenantIdFromToken(),
    retry: false,
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password).then((r) => r.data),
    onSuccess: (data) => {
      localStorage.setItem('aria_token', data.token);
      qc.invalidateQueries({ queryKey: ['tenant', 'me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, storeName }: { email: string; password: string; storeName: string }) =>
      authApi.register(email, password, storeName).then((r) => r.data),
    onSuccess: (data) => {
      localStorage.setItem('aria_token', data.token);
      qc.invalidateQueries({ queryKey: ['tenant', 'me'] });
    },
  });

  const logout = () => {
    localStorage.removeItem('aria_token');
    qc.clear();
    window.location.href = '/login';
  };

  return {
    tenant: tenantQuery.data,
    tenantLoading: tenantQuery.isLoading,
    tenantError: tenantQuery.error,
    login: loginMutation.mutateAsync,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    registerPending: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
    isAuthenticated: !!getTenantIdFromToken(),
  };
}
