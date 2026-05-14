import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'bg-theme-brand',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center px-0.5">
          <span className="text-[10px] font-black text-theme-secondary uppercase tracking-widest opacity-60">Progress</span>
          <span className="text-[10px] font-black text-theme-primary">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={`w-full bg-white/5 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`h-full transition-all duration-500 ease-out rounded-full ${color}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
