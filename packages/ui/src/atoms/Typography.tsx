import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'tiny';
  color?: 'primary' | 'secondary' | 'brand' | 'error' | 'success';
  className?: string;
  weight?: 'light' | 'normal' | 'medium' | 'bold' | 'black';
  align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  className = '',
}) => {
  const variants = {
    h1: 'text-4xl tracking-tighter font-black',
    h2: 'text-2xl tracking-tight font-bold',
    h3: 'text-xl font-bold',
    h4: 'text-lg font-bold',
    body: 'text-base font-normal',
    small: 'text-sm font-normal',
    tiny: 'text-xs font-normal',
  };

  const colors = {
    primary: 'text-theme-primary',
    secondary: 'text-theme-secondary',
    brand: 'text-theme-brand',
    error: 'text-red-500',
    success: 'text-emerald-500',
  };

  const weights = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    bold: 'font-bold',
    black: 'font-black',
  };

  const aligns = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const Component = ['h1', 'h2', 'h3', 'h4'].includes(variant) ? (variant as keyof JSX.IntrinsicElements) : 'p';

  return (
    <Component className={`${variants[variant]} ${colors[color]} ${weight ? weights[weight] : ''} ${aligns[align]} ${className}`}>
      {children}
    </Component>
  );
};
