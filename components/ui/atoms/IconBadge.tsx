import React from 'react';

interface IconBadgeProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-12 h-12 rounded-2xl',
  lg: 'w-16 h-16 rounded-2xl',
};

export const IconBadge: React.FC<IconBadgeProps> = ({ children, size = 'md', className = '' }) => (
  <div className={`${sizeClasses[size]} bg-theme-surface flex items-center justify-center shadow-sm border border-theme-soft shrink-0 ${className}`}>
    {children}
  </div>
);
