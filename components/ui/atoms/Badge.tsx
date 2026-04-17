import React from 'react';

type BadgeVariant = 'default' | 'error' | 'warning' | 'success' | 'info' | 'dev';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-theme-soft text-theme-secondary',
  error: 'bg-red-500/10 text-red-500',
  warning: 'bg-amber-500/10 text-amber-500',
  success: 'bg-emerald-500/10 text-emerald-500',
  info: 'bg-blue-500/10 text-blue-400',
  dev: 'bg-theme-brand/20 border border-theme-soft text-theme-brand animate-pulse',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => (
  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${variantClasses[variant]} ${className}`}>
    {children}
  </span>
);
