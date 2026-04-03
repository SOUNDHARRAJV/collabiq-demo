import { create } from 'zustand';
import { UserProfile } from '../types';

const DEBUG = false; // Set to true to enable debug logging

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Partial update for user (merge instead of full replace)
  updateUser: (partial: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  
  setUser: (user) => {
    if (DEBUG) console.log('[Store] setUser:', user?.uid);
    set({ user });
  },
  
  setLoading: (loading) => {
    if (DEBUG) console.log('[Store] setLoading:', loading);
    set({ loading });
  },
  
  // Partial update: merge user properties instead of full replacement
  updateUser: (partial) => {
    set((state) => {
      const newUser = state.user ? { ...state.user, ...partial } : null;
      if (DEBUG) console.log('[Store] updateUser:', Object.keys(partial));
      return { user: newUser };
    });
  },
}));
