import { create } from 'zustand';
import { ViewType, ModalState } from '../types';

interface UIState {
  activeView: ViewType;
  modal: ModalState;
  showTaskModal: boolean;
  
  setActiveView: (view: ViewType) => void;
  setModal: (modal: ModalState) => void;
  setShowTaskModal: (show: boolean) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'chat',
  modal: { type: null },
  showTaskModal: false,
  
  setActiveView: (view) => set({ activeView: view }),
  setModal: (modal) => set({ modal }),
  setShowTaskModal: (show) => set({ showTaskModal: show }),
  closeModal: () => set({ modal: { type: null } }),
}));
