import React from 'react';
import { motion } from 'framer-motion';

interface Option {
  label: string;
  value: string;
  color?: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: any) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex bg-theme-surface rounded-2xl p-1 w-full shadow-inner border border-white/5 ${className}`}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl 
              text-[11px] font-black transition-all duration-300
              ${isActive ? 'text-theme-primary' : 'text-theme-secondary hover:text-theme-primary'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-control-active"
                className="absolute inset-0 bg-theme-bg rounded-xl shadow-lg border border-white/5"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.color && (
                <span 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? '' : 'opacity-40 grayscale'
                  }`}
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
