import React from 'react';

type CardVariant = 'default' | 'elevated' | 'interactive' | 'surface';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onClick?: () => void;
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-theme-bg border border-theme-soft',
  elevated: 'bg-theme-surface border border-theme-soft',
  interactive: 'bg-theme-bg border border-theme-soft hover:bg-theme-soft transition-all cursor-pointer',
  surface: 'bg-theme-bg/50 border border-theme-soft',
};

export const Card: React.FC<CardProps> = ({ children, variant = 'default', onClick, className = '' }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-2xl ${variantClasses[variant]} ${className}`}
  >
    {children}
  </div>
);
