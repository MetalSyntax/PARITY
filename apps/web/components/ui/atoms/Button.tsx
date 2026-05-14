import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100';
  
  const variants = {
    primary: 'bg-theme-brand text-white shadow-lg shadow-theme-brand/20 hover:brightness-110',
    secondary: 'bg-theme-surface text-theme-primary border border-white/5 hover:bg-white/10',
    ghost: 'bg-transparent text-theme-secondary hover:text-theme-primary hover:bg-white/5',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20',
    outline: 'bg-transparent border border-white/10 text-theme-primary hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-4 text-base',
    icon: 'p-2',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
};
