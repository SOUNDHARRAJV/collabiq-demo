import { create } from 'zustand';
import { ViewType, ModalState } from '../types';

const DEBUG = false; // Set to true to enable debug logging

interface UIState {
  activeView: ViewType;
  modal: ModalState;
  showTaskModal: boolean;
  
  // Safe setters with logging
  setActiveView: (view: ViewType) => void;
  setModal: (modal: ModalState) => void;
  setShowTaskModal: (show: boolean) => void;
  
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
    if (DEBUG) console.log('[Store] setActiveView:', view);
    set({ activeView: view });
  },
  
  setModal: (modal) => {
    if (DEBUG) console.log('[Store] setModal:', modal.type);
    set({ modal });
  },
  
  setShowTaskModal: (show) => {
    if (DEBUG) console.log('[Store] setShowTaskModal:', show);
    set({ showTaskModal: show });
  },
  
  // Partial update: merge modal instead of full replacement
  updateModal: (partial) => {
    set((state) => {
      const newModal = { ...state.modal, ...partial };
      if (DEBUG) console.log('[Store] updateModal:', newModal.type);
      return { modal: newModal };
    });
  },
  
  closeModal: () => {
    if (DEBUG) console.log('[Store] closeModal');
    set({ modal: { type: null } });
  },
}));
