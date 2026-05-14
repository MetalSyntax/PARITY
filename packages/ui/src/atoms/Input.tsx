import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, label, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-theme-secondary ml-1 tracking-tight uppercase">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-secondary group-focus-within:text-theme-brand transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-theme-surface border border-white/5 rounded-2xl px-4 py-3.5
              text-theme-primary placeholder:text-theme-secondary/50 outline-none
              transition-all duration-200
              focus:border-theme-brand/50 focus:bg-theme-brand/5
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
              ${error ? 'border-red-500/50 bg-red-500/5' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-secondary group-focus-within:text-theme-brand transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-[10px] font-bold text-red-500 ml-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
