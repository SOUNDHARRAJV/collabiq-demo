import { create } from 'zustand';
import { UserProfile } from '../types';

const DEBUG = true; // Button flow tracing enabled
type Updater<T> = T | ((prev: T) => T);

function resolveNext<T>(prev: T, next: Updater<T>): T {
  return typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: Updater<UserProfile | null>) => void;
  setLoading: (loading: Updater<boolean>) => void;
  
  // Partial update for user (merge instead of full replace)
  updateUser: (partial: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  
  setUser: (user) => {
    set((state) => {
      const nextUser = resolveNext(state.user, user);
      if (DEBUG) console.log('[Trace][Store][Auth] setUser', { prev: state.user?.uid ?? null, next: nextUser?.uid ?? null });
      if (nextUser === state.user) return state;
      return { user: nextUser };
    });
  },
  
  setLoading: (loading) => {
    set((state) => {
      const nextLoading = resolveNext(state.loading, loading);
      if (DEBUG) console.log('[Trace][Store][Auth] setLoading', { prev: state.loading, next: nextLoading });
      if (nextLoading === state.loading) return state;
      return { loading: nextLoading };
    });
  },
  
  // Partial update: merge user properties instead of full replacement
  updateUser: (partial) => {
    set((state) => {
      const newUser = state.user ? { ...state.user, ...partial } : null;
      if (DEBUG) console.log('[Trace][Store][Auth] updateUser', { patchKeys: Object.keys(partial) });
      return { user: newUser };
    });
  },
}));
