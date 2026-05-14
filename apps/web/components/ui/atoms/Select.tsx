import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-theme-secondary ml-1 tracking-tight uppercase">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-theme-surface border border-white/5 rounded-2xl px-4 py-3.5
            text-theme-primary text-sm font-bold outline-none appearance-none
            transition-all duration-200
            focus:border-theme-brand/50 focus:bg-theme-brand/5
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500/50 bg-red-500/5' : ''}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-theme-surface">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-theme-secondary">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && <span className="text-[10px] font-bold text-red-500 ml-1">{error}</span>}
    </div>
  );
};
