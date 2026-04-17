import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface ViewHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  title,
  subtitle,
  onBack,
  action,
  className = 'mb-8',
}) => (
  <div className={`flex items-center ${action ? 'justify-between' : 'gap-4'} ${className}`}>
    <div className="flex items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="p-2 bg-theme-surface border border-white/5 rounded-full text-theme-secondary hover:text-theme-primary transition-colors"
      >
        <ArrowLeft size={20} />
      </motion.button>
      <div>
        <h1 className="text-xl font-bold text-theme-primary">{title}</h1>
        {subtitle && <p className="text-xs text-theme-secondary font-medium">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);
