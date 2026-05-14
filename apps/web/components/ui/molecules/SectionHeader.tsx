import React from 'react';

interface SectionHeaderProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, children, action, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <h3 className="text-[10px] font-black text-theme-secondary uppercase tracking-[0.2em] flex items-center gap-2 opacity-60">
      {icon}
      {children}
    </h3>
    {action}
  </div>
);
