import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: any;
}

export const Modal = ({ isOpen, onClose, title, description, children, icon: Icon }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="glass-ios p-10 rounded-[3rem] max-w-lg w-full shadow-2xl inner-glow relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-music-red to-music-purple opacity-50" />
            <div className="p-2">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-5">
                  {Icon && (
                    <div className="w-14 h-14 bg-gradient-to-br from-music-red to-music-purple rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-music-red/20">
                      <Icon className="text-white" size={28} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-music-gradient">{title}</h3>
                    {description && <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{description}</p>}
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-white/5 rounded-2xl text-white/20 hover:text-white transition-all btn-press"
                >
                  <X size={20} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
