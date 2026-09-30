import { writable } from 'svelte/store';
import { api } from '$lib/api';

interface User {
  id: string;
  username: string;
  role: string;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<{
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
  }>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  return {
    subscribe,
    init: () => {
      const user = api.getStoredUser();
      const isAuth = api.isAuthenticated();
      set({ user, isAuthenticated: isAuth, loading: false });
    },
    login: async (username: string, password: string) => {
      const result = await api.login(username, password);
      if (result.success && result.data) {
        set({
          user: result.data.user,
          isAuthenticated: true,
          loading: false
        });
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    register: async (username: string, email: string, password: string, fullName: string) => {
      const result = await api.register(username, email, password, fullName);
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    logout: () => {
      api.logout();
      set({ user: null, isAuthenticated: false, loading: false });
    }
  };
}

export const auth = createAuthStore();
