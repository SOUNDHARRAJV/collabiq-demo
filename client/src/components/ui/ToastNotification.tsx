import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastNotificationType = 'success' | 'error' | 'info';

interface ToastNotificationProps {
  message: string;
  type: ToastNotificationType;
  onClose: () => void;
  autoDismissMs?: number;
}

export function ToastNotification({
  message,
  type,
  onClose,
  autoDismissMs = 3000,
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [onClose, autoDismissMs]);

  const icon =
    type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
    type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> :
    <Info className="w-5 h-5 text-blue-400" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      className={cn(
        'fixed bottom-6 right-6 z-[100] min-w-[280px] max-w-[420px] rounded-2xl border px-4 py-3 glass-ios flex items-center gap-3 shadow-2xl',
        type === 'success' && 'border-emerald-400/30',
        type === 'error' && 'border-red-400/30',
        type === 'info' && 'border-blue-400/30'
      )}
      role="status"
      aria-live="polite"
    >
      {icon}
      <p className="text-sm text-white/90 font-medium flex-1">{message}</p>
      <button onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors" aria-label="Close notification">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
