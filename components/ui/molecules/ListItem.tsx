import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Typography } from '../atoms/Typography';

interface ListItemProps {
  icon?: React.ReactNode;
  iconClassName?: string;
  title: string;
  subtitle?: React.ReactNode;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'surface' | 'ghost';
  showChevron?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  icon,
  iconClassName = '',
  title,
  subtitle,
  rightElement,
  onClick,
  className = '',
  variant = 'default',
  showChevron = false,
}) => {
  const variants = {
    default: 'bg-transparent hover:bg-white/5 active:scale-[0.98]',
    surface: 'bg-theme-surface border border-white/5 hover:border-white/10 shadow-sm active:scale-[0.98]',
    ghost: 'bg-transparent opacity-80 hover:opacity-100',
  };

  const Component = onClick ? motion.button : 'div';

  return (
    <Component
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`
        w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200
        ${variants[variant]}
        ${className}
      `}
    >
      {icon && (
        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl shadow-inner ${iconClassName}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0 text-left">
        <Typography variant="body" weight="bold" className="truncate tracking-tight">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="tiny" color="secondary" weight="medium" className="truncate mt-0.5 opacity-60">
            {subtitle}
          </Typography>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {rightElement}
        {showChevron && (
          <ChevronRight size={16} className="text-theme-secondary opacity-30" />
        )}
      </div>
    </Component>
  );
};
