import React, { useState } from 'react';
import { Modal } from './Modal';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  icon?: any;
}

export const InputModal = ({ isOpen, onClose, onSubmit, title, description, placeholder, initialValue = '', icon }: InputModalProps) => {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value);
    setValue('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} icon={icon}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Value</label>
          <input 
            required
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-music-red/30 focus:bg-white/10 transition-all placeholder:text-white/10 text-white font-medium"
            placeholder={placeholder}
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all btn-press text-white/60 border border-white/5"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-1 py-4 bg-gradient-to-br from-music-red to-music-purple text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-music-red/20 btn-press"
          >
            Confirm
          </button>
        </div>
      </form>
    </Modal>
  );
};
