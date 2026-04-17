import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface IconButtonProps extends HTMLMotionProps<'button'> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:active:scale-100';
  
  const variants = {
    primary: 'bg-theme-brand text-white shadow-lg shadow-theme-brand/20 hover:brightness-110',
    secondary: 'bg-theme-surface text-theme-secondary border border-white/5 hover:text-theme-primary hover:bg-white/10',
    ghost: 'bg-transparent text-theme-secondary hover:text-theme-primary hover:bg-white/5',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
    outline: 'bg-transparent border border-white/10 text-theme-secondary hover:text-theme-primary hover:bg-white/5',
  };

  const sizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-4',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
    </motion.button>
  );
};
