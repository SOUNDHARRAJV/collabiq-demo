import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }: ConfirmModalProps) => {
  const handleCancel = () => {
    console.log('[Trace][UI][ConfirmModal] cancel click', { title, isOpen });
    onClose();
  };

  const handleConfirm = async () => {
    console.log('[Trace][UI][ConfirmModal] confirm click', { title, isOpen, isDanger });
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('[Trace][UI][ConfirmModal] confirm error', { title, error });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={message} icon={AlertTriangle}>
      <div className="space-y-8">
        <div className="flex gap-4 pt-4">
          <button 
            type="button"
            onClick={handleCancel}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all btn-press text-white/60 border border-white/5"
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm}
            className={`flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg btn-press ${
              isDanger 
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' 
                : 'bg-gradient-to-br from-music-red to-music-purple text-white shadow-music-red/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
