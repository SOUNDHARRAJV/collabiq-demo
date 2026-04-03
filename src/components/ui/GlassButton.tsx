import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GlassButton({ children, variant = 'primary', size = 'md', className, ...props }: GlassButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-music-red to-music-purple text-white shadow-lg shadow-music-red/20',
    secondary: 'glass-ios-light text-white hover:bg-white/20',
    danger: 'bg-red-500/80 text-white hover:bg-red-600/80',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'rounded-xl font-medium transition-all duration-200 btn-press disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
