import { create } from 'zustand';
import { ViewType, ModalState } from '../types';

const DEBUG = true; // Button flow tracing enabled
type Updater<T> = T | ((prev: T) => T);

function resolveNext<T>(prev: T, next: Updater<T>): T {
  return typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
}

interface UIState {
  activeView: ViewType;
  modal: ModalState;
  showTaskModal: boolean;
  
  // Safe setters with logging
  setActiveView: (view: Updater<ViewType>) => void;
  setModal: (modal: Updater<ModalState>) => void;
  setShowTaskModal: (show: Updater<boolean>) => void;
  
  // Partial update for modal (merge instead of replace)
  updateModal: (partial: Partial<ModalState>) => void;
  
  // Safe close with confirmation
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'chat',
  modal: { type: null },
  showTaskModal: false,
  
  setActiveView: (view) => {
    set((state) => {
      const nextView = resolveNext(state.activeView, view);
      if (DEBUG) {
        console.log('[Trace][Store][UI] setActiveView', { prev: state.activeView, next: nextView });
      }
      if (nextView === state.activeView) return state;
      return { activeView: nextView };
    });
  },
  
  setModal: (modal) => {
    set((state) => {
      const nextModal = resolveNext(state.modal, modal);
      if (DEBUG) {
        console.log('[Trace][Store][UI] setModal', {
          prevType: state.modal.type,
          nextType: nextModal.type,
          dataKeys: Object.keys(nextModal.data || {}),
        });
      }
      if (state.modal === nextModal) return state;
      return { modal: nextModal };
    });
  },
  
  setShowTaskModal: (show) => {
    set((state) => {
      const nextShow = resolveNext(state.showTaskModal, show);
      if (DEBUG) {
        console.log('[Trace][Store][UI] setShowTaskModal', { prev: state.showTaskModal, next: nextShow });
      }
      if (nextShow === state.showTaskModal) return state;
      return { showTaskModal: nextShow };
    });
  },
  
  // Partial update: merge modal instead of full replacement
  updateModal: (partial) => {
    set((state) => {
      const newModal = { ...state.modal, ...partial };
      if (DEBUG) {
        console.log('[Trace][Store][UI] updateModal', {
          prevType: state.modal.type,
          nextType: newModal.type,
          patchKeys: Object.keys(partial),
        });
      }
      return { modal: newModal };
    });
  },
  
  closeModal: () => {
    set((state) => {
      if (DEBUG) {
        console.log('[Trace][Store][UI] closeModal', { prevType: state.modal.type });
      }
      if (state.modal.type === null) return state;
      return { modal: { type: null } };
    });
  },
}));
