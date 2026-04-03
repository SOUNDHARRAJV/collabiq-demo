import { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function GlassInput({ label, error, className, ...props }: GlassInputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-white/50 ml-1 uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'w-full glass-ios-light bg-white/5 border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-music-red/50 transition-all duration-200',
          error && 'border-red-500/50 focus:ring-red-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-[10px] text-red-400 ml-1">{error}</p>}
    </div>
  );
}
