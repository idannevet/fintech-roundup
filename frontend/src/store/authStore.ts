import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService } from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingEmail: string | null;
  setUser: (user: User | null) => void;
  setPendingEmail: (email: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      pendingEmail: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setPendingEmail: (email) => set({ pendingEmail: email }),
      login: async (email, password) => {
        const { user } = await authService.login(email, password);
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        await authService.logout();
        set({ user: null, isAuthenticated: false });
      },
      fetchProfile: async () => {
        try {
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
      initialize: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) { set({ isLoading: false, isAuthenticated: false }); return; }
        try { await get().fetchProfile(); } catch { /* invalid */ } finally { set({ isLoading: false }); }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
