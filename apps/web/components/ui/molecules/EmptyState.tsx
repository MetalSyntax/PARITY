import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
    <div className="w-16 h-16 rounded-2xl bg-theme-surface border border-theme-soft flex items-center justify-center mb-4 text-theme-secondary opacity-40">
      {icon}
    </div>
    <p className="font-black text-theme-primary text-sm">{title}</p>
    {description && <p className="text-[11px] text-theme-secondary opacity-50 mt-1 font-bold">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
