import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'light' | 'dark' | 'default';
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, variant = 'default', hover = false, onClick }: GlassCardProps) {
  const variants = {
    default: 'glass-ios',
    light: 'glass-ios-light',
    dark: 'glass-ios-dark',
  };

  return (
    <motion.div 
      onClick={onClick}
      whileHover={hover ? { y: -2 } : undefined}
      className={cn(
        variants[variant],
        'rounded-2xl p-4 transition-all duration-300',
        hover && 'hover:scale-[1.01] hover:shadow-xl cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
