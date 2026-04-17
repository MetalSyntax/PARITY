import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`flex gap-1 p-1 bg-theme-surface rounded-2xl border border-theme-soft ${className}`}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all ${
          activeTab === tab.id
            ? 'bg-theme-brand text-white shadow-md'
            : 'text-theme-secondary hover:text-theme-primary'
        }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);
